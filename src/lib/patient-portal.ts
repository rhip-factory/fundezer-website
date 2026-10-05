import { supabase } from "@/integrations/supabase/client";

/** Stable address of the separate FundEzer Patient Portal app (shares this backend). */
export const PATIENT_PORTAL_URL = "https://project--a31a67a4-94f1-4bbb-9ef4-5bd50869deb5.lovable.app";

/** Campaign statuses that count as "ongoing" for routing a patient to their dashboard. */
export const ONGOING_CAMPAIGN_STATUSES = ["Draft", "Under Review", "Active"] as const;

/** True when the signed-in account owns an ongoing campaign (row access is limited to the owner by the backend). */
export async function hasOngoingCampaign(): Promise<boolean> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("id")
    .in("status", [...ONGOING_CAMPAIGN_STATUSES])
    .limit(1);
  if (error) return false;
  return (data?.length ?? 0) > 0;
}

/**
 * Opens the patient portal already signed in by handing the current session
 * over in the URL fragment (never sent to servers); the portal's client picks it up on load.
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
  window.location.assign(`${PATIENT_PORTAL_URL}/portal#${params.toString()}`);
  return true;
}
