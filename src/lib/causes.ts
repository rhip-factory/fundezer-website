import cancerImage from "@/assets/hero-care.jpg";
import diabetesImage from "@/assets/donor-known.jpg";
import kidneyImage from "@/assets/partner-safetynet.jpg";
import maternalImage from "@/assets/donor-stranger.jpg";
import emergencyImage from "@/assets/donor-spontaneous.jpg";
import surgeryImage from "@/assets/partner-transparency.jpg";
import cardioImage from "@/assets/donor-corporate.jpg";

export type Cause = {
  id: string;
  name: string;
  short: string;
  description: string;
  raised: number;
  target: number;
  patients: number;
  activeCampaigns: number;
  image: string;
};

export const causes: Cause[] = [
  {
    id: "cancer-care",
    name: "Cancer Care",
    short: "Fund chemotherapy, surgery and scans for patients facing a cancer diagnosis.",
    description:
      "Help verified patients access cancer-related treatment through FundEzer, from staging investigations to surgery and full chemotherapy cycles at partner hospitals in Abuja.",
    raised: 42500000,
    target: 50000000,
    patients: 127,
    activeCampaigns: 6,
    image: cancerImage,
  },
  {
    id: "diabetes-care",
    name: "Diabetes Care",
    short: "Cover insulin, monitoring and complication treatment for diabetic patients.",
    description:
      "Support long-term diabetes management for verified patients: insulin supply, glucose monitoring, wound and foot care, and treatment of complications before they become emergencies.",
    raised: 18300000,
    target: 30000000,
    patients: 84,
    activeCampaigns: 4,
    image: diabetesImage,
  },
  {
    id: "kidney-disease",
    name: "Kidney Disease",
    short: "Keep dialysis patients on schedule while they wait for transplant assessment.",
    description:
      "Dialysis is relentless and expensive. This pool funds thrice-weekly sessions, renal monitoring and transplant workup for verified patients with end-stage kidney disease.",
    raised: 27900000,
    target: 40000000,
    patients: 61,
    activeCampaigns: 5,
    image: kidneyImage,
  },
  {
    id: "maternal-child-health",
    name: "Maternal & Child Health",
    short: "Fund safe deliveries, neonatal intensive care and paediatric treatment.",
    description:
      "Emergency caesareans, neonatal intensive care and paediatric admissions for mothers and children whose families cannot meet hospital deposits in time.",
    raised: 15600000,
    target: 25000000,
    patients: 143,
    activeCampaigns: 7,
    image: maternalImage,
  },
  {
    id: "emergency-care",
    name: "Emergency Care",
    short: "Release funds fast for accident, trauma and acute admissions.",
    description:
      "A standing pool for patients who arrive at a partner hospital in crisis, so treatment can begin while a full campaign is being verified.",
    raised: 9800000,
    target: 20000000,
    patients: 96,
    activeCampaigns: 3,
    image: emergencyImage,
  },
  {
    id: "surgery",
    name: "Surgery",
    short: "Fund theatre costs, implants and post-operative recovery.",
    description:
      "Many patients are cleared for surgery and simply cannot pay for theatre, implants or admission. This pool clears that final barrier for verified cases.",
    raised: 33100000,
    target: 45000000,
    patients: 112,
    activeCampaigns: 8,
    image: surgeryImage,
  },
  {
    id: "cardiovascular-care",
    name: "Cardiovascular Care",
    short: "Support heart surgery, cardiac investigations and follow-up care.",
    description:
      "From paediatric congenital heart defects to adult cardiac procedures, this pool funds investigations, theatre and ICU recovery for verified cardiac patients.",
    raised: 21400000,
    target: 35000000,
    patients: 47,
    activeCampaigns: 4,
    image: cardioImage,
  },
];

export function getCause(id: string) {
  return causes.find((c) => c.id === id);
}

export function causeProgress(cause: Cause) {
  return Math.min(100, Math.round((cause.raised / cause.target) * 100));
}

export type CauseDonation = {
  id: string;
  causeId: string;
  causeName: string;
  amount: number;
  recurring: boolean;
  anonymous: boolean;
  method: string;
  createdAt: string;
};

const KEY = "fundezer.cause.donations.v1";

export function loadCauseDonations(): CauseDonation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CauseDonation[]) : [];
  } catch {
    return [];
  }
}

export function saveCauseDonation(donation: CauseDonation) {
  if (typeof window === "undefined") return;
  const all = [donation, ...loadCauseDonations()];
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export function newReference() {
  return "FZC-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}
