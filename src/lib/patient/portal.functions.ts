import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ------------------------------------------------------------------ */
/* Types returned to the portal UI                                     */
/* ------------------------------------------------------------------ */

export type PortalProfileRecord = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
};

export type PortalPatientRecord = {
  id: string;
  referenceCode: string;
  displayName: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  city: string | null;
  state: string | null;
  condition: string | null;
  medicalSummary: string | null;
  urgency: string;
  status: string;
  hospitalName: string | null;
};

export type PortalApplicationRecord = {
  id: string;
  reference: string;
  title: string;
  description: string | null;
  status: string;
  requestedAmount: number;
  submittedAt: string;
  statusChangedAt: string;
  hospitalName: string | null;
};

export type PortalCampaignRecord = {
  id: string;
  title: string;
  story: string | null;
  imageUrl: string | null;
  slug: string | null;
  status: string;
  isPublic: boolean;
  target: number;
  raised: number;
  donors: number;
  hospitalName: string | null;
  publishedAt: string | null;
  recentDonations: {
    id: string;
    name: string;
    amount: number;
    createdAt: string;
  }[];
};

export type PortalJourneyStep = {
  id: string;
  stage: string;
  stageStatus: string;
  startedAt: string | null;
  completedAt: string | null;
  hospitalName: string | null;
};

export type PortalTreatmentUpdate = {
  id: string;
  summary: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  hospitalName: string | null;
};

export type PortalTransfer = {
  id: string;
  reference: string;
  status: string;
  reason: string;
  urgency: string;
  requestedAt: string;
  scheduledFor: string | null;
  completedAt: string | null;
  fromHospital: string | null;
  toHospital: string | null;
  events: {
    id: string;
    status: string;
    note: string | null;
    actorLabel: string | null;
    occurredAt: string;
  }[];
};

export type PortalHospitalStay = {
  id: string;
  hospitalName: string | null;
  treatmentPhase: string | null;
  reason: string | null;
  startedOn: string;
  endedOn: string | null;
};

export type PortalDocumentRecord = {
  id: string;
  title: string;
  documentType: string;
  description: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  createdAt: string;
};

export type PortalConsentRecord = {
  id: string;
  consentType: string;
  status: string;
  consentVersion: string;
  consentedAt: string | null;
  withdrawnAt: string | null;
};

export type PortalNotificationRecord = {
  id: string;
  notificationType: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedEntityType: string | null;
};

export type PortalOverview = {
  userId: string;
  email: string | null;
  profile: PortalProfileRecord | null;
  patient: PortalPatientRecord | null;
  application: PortalApplicationRecord | null;
  campaign: PortalCampaignRecord | null;
  journey: PortalJourneyStep[];
  treatmentUpdates: PortalTreatmentUpdate[];
  transfers: PortalTransfer[];
  hospitalStays: PortalHospitalStay[];
  documents: PortalDocumentRecord[];
  consents: PortalConsentRecord[];
  notifications: PortalNotificationRecord[];
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function referenceOf(id: string) {
  return `FEZ-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

/**
 * Patients cannot read `hospitals` under RLS, so hospital display names for
 * rows the patient already owns are resolved server-side, names only.
 */
async function hospitalNames(ids: (string | null | undefined)[]) {
  const unique = [...new Set(ids.filter((v): v is string => !!v))];
  if (unique.length === 0) return new Map<string, string>();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("hospitals")
    .select("id, name")
    .in("id", unique);
  return new Map((data ?? []).map((h) => [h.id, h.name]));
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

/**
 * Everything the signed-in patient's portal needs, read as that user so the
 * existing RLS policies decide what is visible.
 */
export const getPortalOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PortalOverview> => {
    const { supabase, userId, claims } = context;
    const email = (claims['email'] as string | undefined) ?? null;

    const [profileRes, patientRes, notificationRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, email, phone, city, state")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("patients")
        .select(
          "id, reference_code, display_name, full_name, email, phone, date_of_birth, gender, city, state, condition, medical_summary, urgency, status, current_hospital_id",
        )
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("notifications")
        .select(
          "id, notification_type, title, message, is_read, created_at, related_entity_type",
        )
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (profileRes.error || patientRes.error) {
      console.error("[portal] profile/patient read failed", {
        profile: profileRes.error,
        patient: patientRes.error,
      });
      throw new Error("We could not load your account right now.");
    }

    const patientRow = patientRes.data;

    const [appRes, campaignRes, journeyRes, updatesRes, transferRes, stayRes, docRes, consentRes] =
      patientRow
        ? await Promise.all([
            supabase
              .from("applications")
              .select(
                "id, title, description, status, requested_amount, submitted_at, status_changed_at, hospital_id",
              )
              .order("submitted_at", { ascending: false })
              .limit(1),
            supabase
              .from("campaigns")
              .select(
                "id, title, public_title, public_story, public_image_url, slug, status, is_public, target, hospital_id, published_at, created_at",
              )
              .order("created_at", { ascending: false })
              .limit(1),
            supabase
              .from("treatment_journeys")
              .select(
                "id, stage, stage_status, position, started_at, completed_at, hospital_id",
              )
              .order("position", { ascending: true }),
            supabase
              .from("treatment_updates")
              .select(
                "id, public_summary, private_notes, status, published_at, created_at, hospital_id",
              )
              .order("created_at", { ascending: false })
              .limit(20),
            supabase
              .from("transfers")
              .select(
                "id, reference_code, status, reason, urgency, requested_at, scheduled_for, completed_at, originating_hospital_id, receiving_hospital_id",
              )
              .order("requested_at", { ascending: false })
              .limit(10),
            supabase
              .from("patient_hospital_history")
              .select(
                "id, hospital_id, treatment_phase, reason, started_on, ended_on",
              )
              .order("started_on", { ascending: false }),
            supabase
              .from("documents")
              .select(
                "id, title, document_type, description, mime_type, file_size_bytes, created_at",
              )
              .order("created_at", { ascending: false }),
            supabase
              .from("consents")
              .select(
                "id, consent_type, status, consent_version, consented_at, withdrawn_at",
              )
              .order("created_at", { ascending: false }),
          ])
        : [null, null, null, null, null, null, null, null];

    const appRow = appRes?.data?.[0] ?? null;
    const campaignRow = campaignRes?.data?.[0] ?? null;
    const journeyRows = journeyRes?.data ?? [];
    const updateRows = updatesRes?.data ?? [];
    const transferRows = transferRes?.data ?? [];
    const stayRows = stayRes?.data ?? [];
    const docRows = docRes?.data ?? [];
    const consentRows = consentRes?.data ?? [];

    const names = await hospitalNames([
      patientRow?.current_hospital_id,
      appRow?.hospital_id,
      campaignRow?.hospital_id,
      ...journeyRows.map((j) => j.hospital_id),
      ...updateRows.map((u) => u.hospital_id),
      ...transferRows.flatMap((t) => [
        t.originating_hospital_id,
        t.receiving_hospital_id,
      ]),
      ...stayRows.map((s) => s.hospital_id),
    ]);
    const nameOf = (id: string | null | undefined) =>
      (id && names.get(id)) || null;

    /* transfer events for the patient's own transfers (RLS-scoped) */
    type EventRow = {
      id: string;
      transfer_id: string;
      status: string;
      note: string | null;
      actor_label: string | null;
      occurred_at: string;
    };
    let events: EventRow[] = [];
    if (transferRows.length > 0) {
      const { data } = await supabase
        .from("transfer_events")
        .select("id, transfer_id, status, note, actor_label, occurred_at")
        .in(
          "transfer_id",
          transferRows.map((t) => t.id),
        )
        .order("occurred_at", { ascending: false });
      events = (data ?? []) as EventRow[];
    }

    /* Donation totals for the patient's own campaign. Individual donor rows
       are not readable by patients under RLS, so the aggregate is computed
       server-side and scoped to this campaign only. */
    let raised = 0;
    let donors = 0;
    let recentDonations: PortalCampaignRecord["recentDonations"] = [];
    if (campaignRow) {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const { data: donationRows } = await supabaseAdmin
        .from("donations")
        .select("id, amount, donor_name, is_anonymous, created_at, payment_status")
        .eq("campaign_id", campaignRow.id)
        .eq("payment_status", "Paid")
        .order("created_at", { ascending: false });
      const rows = donationRows ?? [];
      raised = rows.reduce((sum, d) => sum + Number(d.amount ?? 0), 0);
      donors = rows.length;
      recentDonations = rows.slice(0, 5).map((d) => ({
        id: d.id,
        name: d.is_anonymous ? "Anonymous" : (d.donor_name ?? "A supporter"),
        amount: Number(d.amount ?? 0),
        createdAt: d.created_at,
      }));
    }

    return {
      userId,
      email,
      profile: profileRes.data
        ? {
            fullName: profileRes.data.full_name ?? "",
            email: profileRes.data.email ?? email ?? "",
            phone: profileRes.data.phone ?? "",
            city: profileRes.data.city ?? "",
            state: profileRes.data.state ?? "",
          }
        : null,
      patient: patientRow
        ? {
            id: patientRow.id,
            referenceCode: patientRow.reference_code,
            displayName: patientRow.display_name,
            fullName: patientRow.full_name,
            email: patientRow.email,
            phone: patientRow.phone,
            dateOfBirth: patientRow.date_of_birth,
            gender: patientRow.gender,
            city: patientRow.city,
            state: patientRow.state,
            condition: patientRow.condition,
            medicalSummary: patientRow.medical_summary,
            urgency: patientRow.urgency,
            status: patientRow.status,
            hospitalName: nameOf(patientRow.current_hospital_id),
          }
        : null,
      application: appRow
        ? {
            id: appRow.id,
            reference: referenceOf(appRow.id),
            title: appRow.title,
            description: appRow.description,
            status: appRow.status,
            requestedAmount: Number(appRow.requested_amount ?? 0),
            submittedAt: appRow.submitted_at,
            statusChangedAt: appRow.status_changed_at,
            hospitalName: nameOf(appRow.hospital_id),
          }
        : null,
      campaign: campaignRow
        ? {
            id: campaignRow.id,
            title: campaignRow.public_title || campaignRow.title,
            story: campaignRow.public_story,
            imageUrl: campaignRow.public_image_url,
            slug: campaignRow.slug,
            status: campaignRow.status,
            isPublic: campaignRow.is_public,
            target: Number(campaignRow.target ?? 0),
            raised,
            donors,
            hospitalName: nameOf(campaignRow.hospital_id),
            publishedAt: campaignRow.published_at,
            recentDonations,
          }
        : null,
      journey: journeyRows.map((j) => ({
        id: j.id,
        stage: j.stage,
        stageStatus: j.stage_status,
        startedAt: j.started_at,
        completedAt: j.completed_at,
        hospitalName: nameOf(j.hospital_id),
      })),
      treatmentUpdates: updateRows
        .filter((u) => !!(u.public_summary || u.private_notes))
        .map((u) => ({
          id: u.id,
          summary: u.public_summary || u.private_notes || "",
          status: u.status,
          publishedAt: u.published_at,
          createdAt: u.created_at,
          hospitalName: nameOf(u.hospital_id),
        })),
      transfers: transferRows.map((t) => ({
        id: t.id,
        reference: t.reference_code,
        status: t.status,
        reason: t.reason,
        urgency: t.urgency,
        requestedAt: t.requested_at,
        scheduledFor: t.scheduled_for,
        completedAt: t.completed_at,
        fromHospital: nameOf(t.originating_hospital_id),
        toHospital: nameOf(t.receiving_hospital_id),
        events: events
          .filter((e) => e.transfer_id === t.id)
          .map((e) => ({
            id: e.id,
            status: e.status,
            note: e.note,
            actorLabel: e.actor_label,
            occurredAt: e.occurred_at,
          })),
      })),
      hospitalStays: stayRows.map((s) => ({
        id: s.id,
        hospitalName: nameOf(s.hospital_id),
        treatmentPhase: s.treatment_phase,
        reason: s.reason,
        startedOn: s.started_on,
        endedOn: s.ended_on,
      })),
      documents: docRows.map((d) => ({
        id: d.id,
        title: d.title,
        documentType: d.document_type,
        description: d.description,
        mimeType: d.mime_type,
        fileSizeBytes: d.file_size_bytes === null ? null : Number(d.file_size_bytes),
        createdAt: d.created_at,
      })),
      consents: consentRows.map((c) => ({
        id: c.id,
        consentType: c.consent_type,
        status: c.status,
        consentVersion: c.consent_version,
        consentedAt: c.consented_at,
        withdrawnAt: c.withdrawn_at,
      })),
      notifications: (notificationRes.data ?? []).map((n) => ({
        id: n.id,
        notificationType: n.notification_type,
        title: n.title,
        message: n.message,
        isRead: n.is_read,
        createdAt: n.created_at,
        relatedEntityType: n.related_entity_type,
      })),
    };
  });

/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

const str = (value: unknown, max = 200) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

/** Saves the signed-in patient's own contact details to `profiles`. */
export const savePortalProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const raw = (input ?? {}) as Record<string, unknown>;
    const fullName = str(raw['fullName'], 160);
    if (!fullName) throw new Error("Your full name is required.");
    return {
      fullName,
      email: str(raw['email'], 160),
      phone: str(raw['phone'], 40),
      city: str(raw['city'], 80),
      state: str(raw['state'], 80),
    };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    const payload = {
      full_name: data.fullName,
      email: data.email || null,
      phone: data.phone || null,
      city: data.city || null,
      state: data.state || null,
    };

    const { error } = existing
      ? await supabase.from("profiles").update(payload).eq("id", existing.id)
      : await supabase
          .from("profiles")
          .insert({ ...payload, user_id: userId, status: "active" });

    if (error) {
      console.error("[portal] profile save failed", error);
      throw new Error("We could not save your profile. Please try again.");
    }
    return { ok: true };
  });

/** Marks one of the signed-in user's notifications as read. */
export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const id = str((input as Record<string, unknown>)?.['id'], 64);
    if (!id) throw new Error("A notification is required.");
    return { id };
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) {
      console.error("[portal] notification update failed", error);
      throw new Error("We could not update that notification.");
    }
    return { ok: true };
  });

/** Marks every unread notification for the signed-in user as read. */
export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("recipient_user_id", context.userId)
      .eq("is_read", false);
    if (error) {
      console.error("[portal] notifications update failed", error);
      throw new Error("We could not update your notifications.");
    }
    return { ok: true };
  });
