import { supabase } from "@/integrations/supabase/client";

/** Stable address of the separate FundEzer Patient Portal app (shares this backend). */
export const PATIENT_PORTAL_URL = "https://fundezer-patient-portal.lovable.app";

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
 * Opens the patient portal already signed in by handing the current session
 * over in the URL fragment (never sent to servers); the portal's client picks it up on load.
 *
 * The portal is a separate site, so it opens in a new top-level tab: a same-tab
 * cross-origin jump is refused inside the preview iframe (it answers 403
 * Forbidden), a new tab is not.
 *
 * "noopener,noreferrer" is deliberately NOT passed to window.open — browsers
 * then return null even when the tab opened fine, which would make popup-block
 * detection impossible. Clearing `opener` on the returned tab gives the same
 * isolation, so a blocked popup can still fall back to this tab.
 */
export async function openPatientPortal(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  const s = data.session;
  if (!s) return false;
  const params = new URLSearchParams({
    access_token: s.access_token,
    refresh_token: s.refresh_token,
    expires_in: String(s.expires_in ?? 3600),
    expires_at: String(s.expires_at ?? ""),
    token_type: "bearer",
    type: "magiclink",
  });
  const url = `${PATIENT_PORTAL_URL}/portal#${params.toString()}`;
  const tab = window.open(url, "_blank");
  if (tab) {
    tab.opener = null;
    return true;
  }
  window.location.assign(url);
  return true;
}
