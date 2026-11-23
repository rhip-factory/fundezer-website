import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const str = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

function slugify(title: string) {
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "campaign";
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

/**
 * Creates the signed-in patient's fundraising campaign in the shared
 * `campaigns` table. Patients have no INSERT policy on `campaigns`, so the
 * row is written with the admin client only after the caller's ownership of
 * the patient record has been verified under RLS.
 */
export const submitPortalCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const raw = (input ?? {}) as Record<string, unknown>;
    const title = str(raw["title"], 160);
    const story = str(raw["story"], 4000);
    if (!title) throw new Error("A campaign title is required.");
    if (!story) throw new Error("Please tell your story.");
    // The funding target is set by the hospital after review.
    return { title, story, target: 0 };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id, current_hospital_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (patientError) {
      console.error("[campaign] patient read failed", patientError);
      throw new Error("We could not load your patient record.");
    }
    if (!patient) {
      throw new Error(
        "Submit your funding application first — your campaign is created from it.",
      );
    }

    const { data: existing } = await supabase
      .from("campaigns")
      .select("id")
      .eq("patient_id", patient.id)
      .limit(1);

    if (existing && existing.length > 0) {
      return { ok: true, id: existing[0]!.id, alreadyExisted: true };
    }

    const { data: application } = await supabase
      .from("applications")
      .select("id, hospital_id, requested_amount")
      .eq("patient_id", patient.id)
      .order("submitted_at", { ascending: false })
      .limit(1);

    const appRow = application?.[0] ?? null;

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: inserted, error } = await supabaseAdmin
      .from("campaigns")
      .insert({
        patient_id: patient.id,
        application_id: appRow?.id ?? null,
        hospital_id: appRow?.hospital_id ?? patient.current_hospital_id ?? null,
        slug: slugify(data.title),
        title: data.title,
        public_title: data.title,
        public_story: data.story,
        target: data.target,
        status: "Under Review",
        is_public: false,
        publication_consent_granted: true,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[campaign] insert failed", error);
      throw new Error("We could not submit your campaign. Please try again.");
    }

    return { ok: true, id: inserted.id, alreadyExisted: false };
  });
