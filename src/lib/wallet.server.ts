/**
 * Server-only wallet ledger.
 *
 * Rules enforced here (never in the browser):
 *  - balances are always summed from immutable transaction rows
 *  - donor wallet accounting and campaign wallet accounting are separate tables
 *  - every write carries an idempotency key so a retry cannot double-charge
 *  - every write is audit logged
 */

type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

async function admin(): Promise<Admin> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export function reference(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

export async function ensureWallet(userId: string, email: string, fullName: string) {
  const db = await admin();
  await db.from("profiles").upsert({ id: userId, email, full_name: fullName }, { onConflict: "id", ignoreDuplicates: true });
  const { data } = await db.from("donor_wallets").select("id").eq("user_id", userId).maybeSingle();
  if (data) return data.id;
  const { data: created, error } = await db
    .from("donor_wallets")
    .insert({ user_id: userId })
    .select("id")
    .single();
  if (error) throw new Error("Could not open wallet");
  return created.id;
}

export async function walletBalance(userId: string) {
  const db = await admin();
  const { data, error } = await db
    .from("donor_wallet_transactions")
    .select("direction, amount")
    .eq("user_id", userId);
  if (error) throw new Error("Could not read balance");
  return (data ?? []).reduce(
    (sum, t) => sum + (t.direction === "credit" ? Number(t.amount) : -Number(t.amount)),
    0,
  );
}

async function audit(userId: string, action: string, detail: Record<string, string | number | boolean>) {
  const db = await admin();
  await db.from("wallet_audit_log").insert({ user_id: userId, action, detail });
}

async function notify(userId: string, title: string, body: string, kind = "wallet") {
  const db = await admin();
  await db.from("wallet_notifications").insert({ user_id: userId, title, body, kind });
}

/** Basic fraud monitoring for the pilot: implausible amounts / burst activity. */
async function fraudCheck(userId: string, amount: number) {
  if (amount > 5_000_000) throw new Error("Amount exceeds the pilot limit of ₦5,000,000.");
  const db = await admin();
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await db
    .from("donor_wallet_transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  if ((count ?? 0) >= 10) {
    await audit(userId, "fraud_block_rate_limit", { amount });
    throw new Error("Too many wallet operations in a short period. Please try again shortly.");
  }
}

export async function topUp(input: {
  userId: string;
  email: string;
  fullName: string;
  amount: number;
  idempotencyKey: string;
  kind?: "topup" | "recurring_topup";
}) {
  const db = await admin();
  const existing = await db
    .from("donor_wallet_transactions")
    .select("id, amount, reference")
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();
  if (existing.data) return { duplicate: true, balance: await walletBalance(input.userId) };

  await fraudCheck(input.userId, input.amount);
  const walletId = await ensureWallet(input.userId, input.email, input.fullName);
  const ref = reference("TOP");
  const { error } = await db.from("donor_wallet_transactions").insert({
    wallet_id: walletId,
    user_id: input.userId,
    kind: input.kind ?? "topup",
    direction: "credit",
    amount: input.amount,
    reference: ref,
    idempotency_key: input.idempotencyKey,
    description: input.kind === "recurring_topup" ? "Recurring wallet funding" : "Wallet top-up",
  });
  if (error) throw new Error("Top-up could not be recorded");

  const balance = await walletBalance(input.userId);
  await audit(input.userId, "wallet_topup", { amount: input.amount, reference: ref });
  await notify(
    input.userId,
    "Wallet topped up",
    `₦${input.amount.toLocaleString("en-NG")} was added to your donor wallet. Reference ${ref}.`,
  );
  return { duplicate: false, balance, reference: ref };
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
  source: "wallet" | "card" | "transfer";
  idempotencyKey: string;
}) {
  const db = await admin();

  const dup = await db
    .from("donations")
    .select("id")
    .eq("reference", input.idempotencyKey)
    .maybeSingle();
  if (dup.data) return { donationId: dup.data.id, duplicate: true };

  const campaign = await db
    .from("campaigns")
    .select("id, public_display_name, hospital, published")
    .eq("id", input.campaignId)
    .maybeSingle();
  if (!campaign.data || !campaign.data.published) throw new Error("Campaign is not available.");

  await fraudCheck(input.userId, input.amount);
  const walletId = await ensureWallet(input.userId, input.email, input.fullName);

  if (input.source === "wallet") {
    const balance = await walletBalance(input.userId);
    if (balance < input.amount) throw new Error("Your wallet balance is too low for this donation.");
    const { error } = await db.from("donor_wallet_transactions").insert({
      wallet_id: walletId,
      user_id: input.userId,
      kind: "donation",
      direction: "debit",
      amount: input.amount,
      reference: reference("DON"),
      idempotency_key: `${input.idempotencyKey}:wallet`,
      campaign_id: input.campaignId,
      description: `Donation to ${campaign.data.public_display_name}`,
    });
    if (error) throw new Error("Wallet debit could not be recorded");
  }

  const { data: donation, error: donationError } = await db
    .from("donations")
    .insert({
      campaign_id: input.campaignId,
      donor_user_id: input.userId,
      amount: input.amount,
      visibility: input.visibility,
      public_display_name: input.visibility === "public" ? input.displayName : "Anonymous donor",
      message: input.message.slice(0, 500),
      source: input.source,
      reference: input.idempotencyKey,
    })
    .select("id")
    .single();
  if (donationError || !donation) throw new Error("Donation could not be recorded");

  const wallet = await db
    .from("campaign_wallets")
    .select("id")
    .eq("campaign_id", input.campaignId)
    .maybeSingle();
  let campaignWalletId = wallet.data?.id;
  if (!campaignWalletId) {
    const created = await db
      .from("campaign_wallets")
      .insert({ campaign_id: input.campaignId })
      .select("id")
      .single();
    campaignWalletId = created.data?.id;
  }
  if (campaignWalletId) {
    await db.from("campaign_wallet_transactions").insert({
      campaign_wallet_id: campaignWalletId,
      campaign_id: input.campaignId,
      kind: "donation",
      direction: "credit",
      amount: input.amount,
      reference: reference("CW"),
      idempotency_key: `${input.idempotencyKey}:campaign`,
      description: "Donation received",
    });
  }

  await audit(input.userId, "donation", {
    campaign_id: input.campaignId,
    amount: input.amount,
    source: input.source,
    visibility: input.visibility,
  });
  await notify(
    input.userId,
    "Donation confirmed",
    `₦${input.amount.toLocaleString("en-NG")} was sent to ${campaign.data.public_display_name}'s campaign at ${campaign.data.hospital}.`,
    "donation",
  );

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
