import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PatientApplication = {
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

export type SubmitApplicationInput = {
  title: string;
  story: string;
  summary: string;
  amount: number;
  hospitalName: string;
  hospitalId: string;
  country: string;
  state: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  city: string;
  condition: string;
};

const str = (value: unknown, max = 400) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

function validate(input: unknown): SubmitApplicationInput {
  const raw = (input ?? {}) as Record<string, unknown>;
  const title = str(raw['title'], 160);
  const story = str(raw['story'], 8000);
  if (!title) throw new Error("A campaign name is required.");
  if (!story) throw new Error("Your story is required before submitting.");
  // The amount to raise is set by the hospital after review, not the patient.
  const amount = 0;
  const summary = str(raw['summary'], 1000);
  if (!summary) throw new Error("A short campaign description is required.");
  return {
    title,
    story,
    summary,
    amount,
    hospitalName: str(raw['hospitalName'], 160),
    hospitalId: str(raw['hospitalId'], 40),
    country: str(raw['country'], 80),
    state: str(raw['state'], 80),
    fullName: str(raw['fullName'], 160),
    email: str(raw['email'], 160),
    phone: str(raw['phone'], 40),
    dateOfBirth: str(raw['dateOfBirth'], 20),
    gender: str(raw['gender'], 40),
    city: str(raw['city'], 80),
    condition: str(raw['condition'], 400),
  };
}

const OPEN_STATUSES = [
  "Submitted",
  "Under Review",
  "Information Requested",
  "Verified",
  "Approved",
] as const;

function referenceOf(id: string) {
  return `FEZ-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

const isoDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;

/** Resolves the hospital row matching the selected hospital name, if any. */
async function findHospital(
  supabase: { from: (t: 'hospitals') => any },
  name: string,
) {
  if (!name) return null;
  const { data } = await supabase
    .from("hospitals")
    .select("id, name")
    .ilike("name", name)
    .limit(1);
  return (data?.[0] as { id: string; name: string } | undefined) ?? null;
}

/**
 * Submits the signed-in patient's application. Creates the patient record on
 * first submission and links it to the account.
 */
export const submitApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;

    const { data: existingPatient, error: patientError } = await supabase
      .from("patients")
      .select("id, current_hospital_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (patientError) throw new Error("We could not load your patient record.");

    const { supabaseAdmin: admin } = await import("@/integrations/supabase/client.server");
    const { data: hRow } = data.hospitalId
      ? await admin.from("hospitals").select("id, name").eq("id", data.hospitalId).eq("status", "active").eq("verification", "Verified").maybeSingle()
      : { data: null };
    const hospital = hRow ?? (await findHospital(admin as never, data.hospitalName));

    let patientId = existingPatient?.id ?? null;

    if (!patientId) {
      // patients rows are backend-controlled (patients_reviewer_create), so the
      // first-time record is created with elevated privileges for this caller only.
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const email = data.email || (claims['email'] as string | undefined) || null;
      const { data: created, error: createError } = await supabaseAdmin
        .from("patients")
        .insert({
          user_id: userId,
          reference_code: `PT-${Date.now().toString(36).toUpperCase()}`,
          display_name: data.fullName || email || "Patient",
          full_name: data.fullName || null,
          email,
          phone: data.phone || null,
          date_of_birth: isoDate(data.dateOfBirth),
          gender: data.gender || null,
          city: data.city || null,
          state: data.state || null,
          condition: data.condition || null,
          urgency: "Medium",
          status: "Active",
          current_hospital_id: hospital?.id ?? null,
        })
        .select("id")
        .single();
      if (createError || !created) {
        console.error("[applications] patient create failed", createError);
        throw new Error("We could not create your patient record.");
      }
      patientId = created.id;
    }

    // Never create a duplicate application for the same patient.
    const { data: openApp } = await supabase
      .from("applications")
      .select("id")
      .eq("patient_id", patientId)
      .in("status", [...OPEN_STATUSES])
      .order("submitted_at", { ascending: false })
      .limit(1);

    if (openApp?.[0]) {
      return { id: openApp[0].id, reference: referenceOf(openApp[0].id), created: false };
    }

    const { data: inserted, error: insertError } = await supabase
      .from("applications")
      .insert({
        patient_id: patientId,
        hospital_id: hospital?.id ?? null,
        title: data.title,
        description: data.story,
        requested_amount: data.amount,
        status: "Submitted",
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("[applications] insert failed", insertError);
      throw new Error("We could not submit your application. Please try again.");
    }

    // Create the linked campaign (under review, private until approved).
    const { data: existingCampaign } = await admin
      .from("campaigns").select("id").eq("patient_id", patientId).limit(1);
    if (!existingCampaign?.[0]) {
      const base = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "campaign";
      const { error: campaignError } = await admin.from("campaigns").insert({
        patient_id: patientId,
        application_id: inserted.id,
        hospital_id: hospital?.id ?? null,
        slug: `${base}-${Math.random().toString(36).slice(2, 8)}`,
        title: data.title,
        public_title: data.title,
        public_story: data.summary,
        internal_summary: data.story,
        target: data.amount,
        status: "Under Review",
        is_public: false,
        publication_consent_granted: true,
      });
      if (campaignError) console.error("[applications] campaign create failed", campaignError);
    }

    return {
      id: inserted.id,
      reference: referenceOf(inserted.id),
      created: true,
    };
  });

/** Returns the signed-in patient's most recent application, via RLS only. */
export const getMyApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PatientApplication | null> => {
    const { supabase } = context;

    const { data, error } = await supabase
      .from("applications")
      .select(
        "id, title, description, status, requested_amount, submitted_at, status_changed_at, hospital_id",
      )
      .order("submitted_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("[applications] read failed", error);
      throw new Error("We could not load your application right now.");
    }

    const row = data?.[0];
    if (!row) return null;

    let hospitalName: string | null = null;
    if (row.hospital_id) {
      const { data: h } = await supabase
        .from("hospitals")
        .select("name")
        .eq("id", row.hospital_id)
        .maybeSingle();
      hospitalName = h?.name ?? null;
    }

    return {
      id: row.id,
      reference: referenceOf(row.id),
      title: row.title,
      description: row.description,
      status: row.status,
      requestedAmount: Number(row.requested_amount ?? 0),
      submittedAt: row.submitted_at,
      statusChangedAt: row.status_changed_at,
      hospitalName,
    };
  });
