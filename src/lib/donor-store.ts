import { campaigns, type Campaign } from "./data";

/* ------------------------------------------------------------------ *
 * Prototype donor store — browser-only (localStorage). No backend.
 * ------------------------------------------------------------------ */

export type NotificationChannel = "Email" | "SMS" | "WhatsApp" | "App notifications";

export type Donor = {
  name: string;
  email: string;
  phone: string;
  channels: NotificationChannel[];
};

export type Donation = {
  id: string;
  reference: string;
  campaignId: string;
  amount: number;
  date: string; // ISO
  status: "Successful";
  donor: Donor;
};

export type TreatmentStage =
  | "Not started"
  | "Funding required"
  | "Treatment scheduled"
  | "Treatment started"
  | "Treatment in progress"
  | "Treatment completed"
  | "Follow-up"
  | "Journey completed";

export type TimelineStep = {
  label: string;
  date: string;
  detail: string;
  state: "done" | "current" | "pending";
};

export type HospitalUpdate = {
  date: string;
  title: string;
  body: string;
  hospital: string;
  verified: boolean;
};

export type TreatmentJourney = {
  campaignId: string;
  stage: TreatmentStage;
  campaignStatus: "Live" | "Fully funded" | "Closed";
  timeline: TimelineStep[];
  latestUpdate: HospitalUpdate | null;
};

const STORAGE_KEY = "fundezer.donor.v1";

type StoredState = { donor: Donor | null; donations: Donation[] };

const empty: StoredState = { donor: null, donations: [] };

export function readState(): StoredState {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as StoredState;
    return { donor: parsed.donor ?? null, donations: parsed.donations ?? [] };
  } catch {
    return empty;
  }
}

function writeState(state: StoredState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event("fundezer:donor-updated"));
}

export function recordDonation(input: {
  campaignId: string;
  amount: number;
  donor: Donor;
}): Donation {
  const state = readState();
  const now = new Date();
  const donation: Donation = {
    id: `d-${now.getTime()}`,
    reference: `FE-${now.getTime().toString(36).toUpperCase()}`,
    campaignId: input.campaignId,
    amount: input.amount,
    date: now.toISOString(),
    status: "Successful",
    donor: input.donor,
  };
  writeState({ donor: input.donor, donations: [donation, ...state.donations] });
  return donation;
}

export function clearDonorData() {
  writeState(empty);
}

export function getDonation(id: string): Donation | undefined {
  return readState().donations.find((d) => d.id === id);
}

export function donationsForCampaign(campaignId: string): Donation[] {
  return readState().donations.filter((d) => d.campaignId === campaignId);
}

export function supportedCampaigns(): { campaign: Campaign; given: number; donations: Donation[] }[] {
  const byCampaign = new Map<string, Donation[]>();
  for (const d of readState().donations) {
    byCampaign.set(d.campaignId, [...(byCampaign.get(d.campaignId) ?? []), d]);
  }
  return [...byCampaign.entries()]
    .map(([campaignId, donations]) => {
      const campaign = campaigns.find((c) => c.id === campaignId);
      if (!campaign) return null;
      return {
        campaign,
        donations,
        given: donations.reduce((sum, d) => sum + d.amount, 0),
      };
    })
    .filter((v): v is { campaign: Campaign; given: number; donations: Donation[] } => v !== null);
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ---------------- Prototype treatment journeys ---------------- */

const journeys: Record<string, TreatmentJourney> = {
  "amina-k": {
    campaignId: "amina-k",
    stage: "Treatment started",
    campaignStatus: "Live",
    timeline: [
      { label: "Hospital verified", date: "12 July 2026", detail: "Alliance Hospital confirmed the patient's medical need.", state: "done" },
      { label: "Campaign approved", date: "13 July 2026", detail: "The FundEzer campaign went live.", state: "done" },
      { label: "Treatment funding reached", date: "20 July 2026", detail: "Funding reached the required treatment threshold.", state: "done" },
      { label: "Treatment started", date: "22 July 2026", detail: "Hospital confirmed treatment has commenced.", state: "current" },
      { label: "Treatment completed", date: "Pending", detail: "", state: "pending" },
      { label: "Follow-up", date: "Pending", detail: "", state: "pending" },
    ],
    latestUpdate: {
      date: "22 July 2026",
      title: "Treatment has commenced",
      body: "The hospital has confirmed that Amina has commenced treatment and is currently receiving care.",
      hospital: "Alliance Hospital",
      verified: true,
    },
  },
  "tunde-a": {
    campaignId: "tunde-a",
    stage: "Treatment scheduled",
    campaignStatus: "Live",
    timeline: [
      { label: "Hospital verified", date: "02 July 2026", detail: "NNPC Multispecialty Hospital confirmed the medical need.", state: "done" },
      { label: "Campaign approved", date: "03 July 2026", detail: "The FundEzer campaign went live.", state: "done" },
      { label: "Treatment scheduled", date: "28 July 2026", detail: "Theatre slot reserved pending completion of funding.", state: "current" },
      { label: "Treatment started", date: "Pending", detail: "", state: "pending" },
      { label: "Treatment completed", date: "Pending", detail: "", state: "pending" },
    ],
    latestUpdate: {
      date: "28 July 2026",
      title: "Surgery date provisionally booked",
      body: "The hospital has reserved a theatre slot and will confirm the date once the campaign reaches its treatment threshold.",
      hospital: "NNPC Multispecialty Hospital",
      verified: true,
    },
  },
};

export function journeyFor(campaign: Campaign): TreatmentJourney {
  const existing = journeys[campaign.id];
  if (existing) return existing;
  const pct = Math.round((campaign.raised / campaign.goal) * 100);
  return {
    campaignId: campaign.id,
    stage: pct >= 100 ? "Treatment scheduled" : "Funding required",
    campaignStatus: pct >= 100 ? "Fully funded" : "Live",
    timeline: [
      { label: "Hospital verified", date: campaign.updates[0]?.date ?? "Verified", detail: `${campaign.hospital} confirmed the patient's medical need.`, state: "done" },
      { label: "Campaign approved", date: campaign.updates[0]?.date ?? "Live", detail: "The FundEzer campaign went live.", state: "done" },
      { label: "Treatment funding reached", date: pct >= 100 ? "Reached" : "Pending", detail: `Campaign is ${pct}% funded.`, state: pct >= 100 ? "done" : "current" },
      { label: "Treatment started", date: "Pending", detail: "", state: "pending" },
      { label: "Treatment completed", date: "Pending", detail: "", state: "pending" },
    ],
    latestUpdate: campaign.updates.length
      ? {
          date: campaign.updates[campaign.updates.length - 1]!.date,
          title: campaign.updates[campaign.updates.length - 1]!.title,
          body: campaign.updates[campaign.updates.length - 1]!.detail,
          hospital: campaign.hospital,
          verified: true,
        }
      : null,
  };
}

export function privateName(fullName: string) {
  const [first, ...rest] = fullName.split(" ");
  const initial = rest.length ? `${rest[rest.length - 1]![0]}.` : "";
  return `${first} ${initial}`.trim();
}
