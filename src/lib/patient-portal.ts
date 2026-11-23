import { supabase } from "@/integrations/supabase/client";

/** Internal unified route for the merged FundEzer Patient Portal. */
export const PATIENT_PORTAL_URL = "/portal";

/** Campaign statuses that count as "ongoing" for routing a patient to their dashboard. */
export const ONGOING_CAMPAIGN_STATUSES = ["Draft", "Under Review", "Active"] as const;

/** Check the account's own patient record, even when it can read other public campaigns. */
export async function hasOngoingCampaign(): Promise<boolean> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return false;
  const { data: patients, error: patientError } = await supabase
    .from("patients")
    .select("id")
    .eq("user_id", auth.user.id);
  if (patientError || !patients?.length) return false;
  const { data, error } = await supabase
    .from("campaigns")
    .select("id")
    .in("patient_id", patients.map((patient) => patient.id))
    .in("status", [...ONGOING_CAMPAIGN_STATUSES])
    .limit(1);
  if (error) return false;
  return (data?.length ?? 0) > 0;
}

/**
 * Navigates directly to the internal merged patient portal (/portal).
 * No external tabs or URL token fragments required.
 */
export async function openPatientPortal(): Promise<boolean> {
  if (typeof window !== "undefined") {
    window.location.assign("/portal");
    return true;
  }
  return false;
}
