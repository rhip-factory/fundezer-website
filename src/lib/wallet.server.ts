/**
 * Server-only donation helpers.
 *
 * Rules enforced here (never in the browser):
 *  - donations are validated against the public, consent-gated campaign views
 *  - every write carries an idempotency key so a retry cannot double-record
 *  - donors are only ever linked through their authenticated user id
 */

type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

async function admin(): Promise<Admin> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function donate(input: {
  userId: string;
  email: string;
  fullName: string;
  campaignId: string;
  amount: number;
  visibility: "public" | "anonymous" | "private";
  displayName: string;
  message: string;
  source: "card" | "transfer";
  idempotencyKey: string;
}) {
  if (input.amount > 5_000_000) throw new Error("Amount exceeds the pilot limit of ₦5,000,000.");
  const db = await admin();

  // Idempotency: a retry with the same key returns the original donation.
  const dup = await db
    .from("donations")
    .select("id")
    .eq("transaction_reference", input.idempotencyKey)
    .maybeSingle();
  if (dup.data) return { donationId: dup.data.id, duplicate: true };

  // Only campaigns that pass the backend publication rule (public, consented,
  // published, Active/Completed) can receive donations through the site.
  const { data: campaign } = await db
    .from("public_campaigns")
    .select("id, public_title, status")
    .eq("id", input.campaignId)
    .maybeSingle();
  if (!campaign) throw new Error("Campaign is not available.");
  if (campaign.status !== "Active") throw new Error("This campaign has already completed.");

  const { data: donation, error: donationError } = await db
    .from("donations")
    .insert({
      campaign_id: input.campaignId,
      donor_user_id: input.userId,
      donor_name:
        input.visibility === "public" && input.displayName ? input.displayName : "Anonymous donor",
      donor_email: input.email || null,
      amount: input.amount,
      currency: "NGN",
      donation_type: "Patient",
      payment_status: "Pending",
      allocation_status: "Under Review",
      payment_method: input.source,
      transaction_reference: input.idempotencyKey,
      is_anonymous: input.visibility !== "public",
      message: input.message.slice(0, 500) || null,
    })
    .select("id")
    .single();
  if (donationError || !donation) throw new Error("Donation could not be recorded");

  await db.from("notifications").insert({
    recipient_user_id: input.userId,
    notification_type: "donation",
    title: "Donation recorded",
    message: `₦${input.amount.toLocaleString("en-NG")} was recorded for ${campaign.public_title ?? "the campaign"}. You will receive verified updates as treatment progresses.`,
    related_entity_type: "campaign",
    related_entity_id: input.campaignId,
  });

  return { donationId: donation.id, duplicate: false };
}

export function milestonesFor(totalGiven: number, patients: number) {
  const tiers = [
    { label: "First donation", target: 1, value: patients },
    { label: "Three patients supported", target: 3, value: patients },
    { label: "₦50,000 given", target: 50_000, value: totalGiven },
    { label: "₦250,000 given", target: 250_000, value: totalGiven },
    { label: "₦1,000,000 given", target: 1_000_000, value: totalGiven },
  ];
  return tiers.map((t) => ({
    label: t.label,
    achieved: t.value >= t.target,
    progress: Math.min(100, Math.round((t.value / t.target) * 100)),
  }));
}
