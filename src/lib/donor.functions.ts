import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const visibility = z.enum(["public", "anonymous", "private"]);

export const getDonorOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { walletBalance, ensureWallet, milestonesFor } = await import("./wallet.server");
    const { supabase, userId, claims } = context;
    const email = (claims as { email?: string }).email ?? "";
    await ensureWallet(userId, email, "");

    const [profile, transactions, donations, plans, notifications, campaigns] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("donor_wallet_transactions")
        .select("id, kind, direction, amount, reference, campaign_id, description, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("donations")
        .select("id, campaign_id, amount, visibility, created_at, reference, source")
        .order("created_at", { ascending: false }),
      supabase.from("recurring_plans").select("*").order("created_at", { ascending: false }),
      supabase
        .from("wallet_notifications")
        .select("id, title, body, kind, read_at, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("campaigns")
        .select("id, public_display_name, condition, hospital, goal, offline_raised, image, status"),
    ]);

    const donationRows = donations.data ?? [];
    const totalGiven = donationRows.reduce((s, d) => s + Number(d.amount), 0);
    const patients = new Set(donationRows.map((d) => d.campaign_id)).size;

    return {
      profile: profile.data,
      balance: await walletBalance(userId),
      transactions: transactions.data ?? [],
      donations: donationRows,
      plans: plans.data ?? [],
      notifications: notifications.data ?? [],
      campaigns: campaigns.data ?? [],
      totalGiven,
      patients,
      milestones: milestonesFor(totalGiven, patients),
    };
  });

export const topUpWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { amount: number; idempotencyKey: string }) =>
    z
      .object({ amount: z.number().int().min(500).max(5_000_000), idempotencyKey: z.string().min(8).max(80) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { topUp } = await import("./wallet.server");
    const email = (context.claims as { email?: string }).email ?? "";
    return topUp({
      userId: context.userId,
      email,
      fullName: "",
      amount: data.amount,
      idempotencyKey: data.idempotencyKey,
    });
  });

export const donateToCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      campaignId: string;
      amount: number;
      visibility: "public" | "anonymous" | "private";
      displayName: string;
      message: string;
      source: "wallet" | "card" | "transfer";
      idempotencyKey: string;
    }) =>
      z
        .object({
          campaignId: z.string().min(1).max(64),
          amount: z.number().int().min(500).max(5_000_000),
          visibility,
          displayName: z.string().trim().max(60),
          message: z.string().trim().max(500),
          source: z.enum(["wallet", "card", "transfer"]),
          idempotencyKey: z.string().min(8).max(80),
        })
        .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { donate } = await import("./wallet.server");
    const email = (context.claims as { email?: string }).email ?? "";
    return donate({
      userId: context.userId,
      email,
      fullName: data.displayName,
      campaignId: data.campaignId,
      amount: data.amount,
      visibility: data.visibility,
      displayName: data.displayName || "FundEzer donor",
      message: data.message,
      source: data.source,
      idempotencyKey: data.idempotencyKey,
    });
  });

export const getDonationReceipt = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { donationId: string }) =>
    z.object({ donationId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: donation } = await context.supabase
      .from("donations")
      .select("id, campaign_id, amount, visibility, reference, source, created_at")
      .eq("id", data.donationId)
      .maybeSingle();
    if (!donation) return null;
    const { data: campaign } = await context.supabase
      .from("campaigns")
      .select("id, public_display_name, condition, hospital, goal, offline_raised, image")
      .eq("id", donation.campaign_id)
      .maybeSingle();
    const { data: totals } = await context.supabase.rpc("campaign_totals", {
      _campaign_id: donation.campaign_id,
    });
    return { donation, campaign, totals: totals?.[0] ?? null };
  });

export const updateDonorProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      fullName: string;
      phone: string;
      channels: string[];
      defaultVisibility: "public" | "anonymous" | "private";
      consentCommunications: boolean;
    }) =>
      z
        .object({
          fullName: z.string().trim().max(100),
          phone: z.string().trim().max(30),
          channels: z.array(z.string().max(30)).max(6),
          defaultVisibility: visibility,
          consentCommunications: z.boolean(),
        })
        .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({
        full_name: data.fullName,
        phone: data.phone,
        update_channels: data.channels.length ? data.channels : ["Email"],
        default_donation_visibility: data.defaultVisibility,
        consent_communications: data.consentCommunications,
      })
      .eq("id", context.userId);
    if (error) throw new Error("Could not save your preferences");
    return { ok: true };
  });

export const saveRecurringPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { amount: number; frequency: "weekly" | "monthly" | "quarterly"; status?: "active" | "paused" | "cancelled" }) =>
      z
        .object({
          amount: z.number().int().min(500).max(5_000_000),
          frequency: z.enum(["weekly", "monthly", "quarterly"]),
          status: z.enum(["active", "paused", "cancelled"]).optional(),
        })
        .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const days = data.frequency === "weekly" ? 7 : data.frequency === "monthly" ? 30 : 90;
    const next = new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
    const existing = await supabaseAdmin
      .from("recurring_plans")
      .select("id")
      .eq("user_id", context.userId)
      .neq("status", "cancelled")
      .maybeSingle();

    if (existing.data) {
      await supabaseAdmin
        .from("recurring_plans")
        .update({ amount: data.amount, frequency: data.frequency, status: data.status ?? "active", next_charge_date: next })
        .eq("id", existing.data.id)
        .eq("user_id", context.userId);
    } else {
      await supabaseAdmin.from("recurring_plans").insert({
        user_id: context.userId,
        amount: data.amount,
        frequency: data.frequency,
        status: data.status ?? "active",
        next_charge_date: next,
      });
    }
    await supabaseAdmin.from("wallet_notifications").insert({
      user_id: context.userId,
      title: data.status === "cancelled" ? "Recurring giving cancelled" : "Recurring giving updated",
      body:
        data.status === "cancelled"
          ? "Your recurring contribution has been cancelled. You can restart it any time."
          : `₦${data.amount.toLocaleString("en-NG")} ${data.frequency}, next on ${next}.`,
      kind: "recurring",
    });
    return { ok: true };
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase
      .from("wallet_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", context.userId)
      .is("read_at", null);
    return { ok: true };
  });
