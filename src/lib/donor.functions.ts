import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const visibility = z.enum(["public", "anonymous", "private"]);

export const getDonorOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { milestonesFor } = await import("./wallet.server");
    const { supabase, userId } = context;

    const [profile, donations, plans, notifications, campaigns] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("donations")
        .select(
          "id, campaign_id, cause_id, amount, currency, donation_type, payment_status, payment_method, is_anonymous, message, created_at",
        )
        .order("created_at", { ascending: false }),
      supabase.from("recurring_plans").select("*").order("created_at", { ascending: false }),
      supabase
        .from("notifications")
        .select("id, notification_type, title, message, is_read, read_at, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("public_campaigns")
        .select("id, slug, public_title, target, status, published_at"),
    ]);

    const donationRows = donations.data ?? [];
    const totalGiven = donationRows.reduce((s, d) => s + Number(d.amount), 0);
    const patients = new Set(donationRows.map((d) => d.campaign_id).filter(Boolean)).size;

    return {
      profile: profile.data,
      balance: 0,
      transactions: [] as Array<{
        id: string;
        kind: string;
        direction: "credit" | "debit";
        amount: number;
        reference: string | null;
        description: string | null;
        created_at: string;
      }>,
      donations: donationRows,
      plans: plans.data ?? [],
      notifications: (notifications.data ?? []).map((n) => ({
        id: n.id,
        title: n.title,
        body: n.message,
        kind: n.notification_type,
        read_at: n.read_at,
        created_at: n.created_at,
      })),
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
      .object({
        amount: z.number().int().min(500).max(5_000_000),
        idempotencyKey: z.string().min(8).max(80),
      })
      .parse(input),
  )
  .handler(async () => {
    throw new Error(
      "Wallet top-ups are not available on the website yet — please donate directly by card or bank transfer.",
    );
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
      source: "card" | "transfer";
      idempotencyKey: string;
    }) =>
      z
        .object({
          campaignId: z.string().min(1).max(64),
          amount: z.number().int().min(500).max(5_000_000),
          visibility,
          displayName: z.string().trim().max(60),
          message: z.string().trim().max(500),
          source: z.enum(["card", "transfer"]),
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
      .select(
        "id, campaign_id, cause_id, amount, currency, donation_type, payment_status, payment_method, is_anonymous, transaction_reference, created_at",
      )
      .eq("id", data.donationId)
      .maybeSingle();
    if (!donation) return null;

    const campaign = donation.campaign_id
      ? (
          await context.supabase
            .from("public_campaigns")
            .select("id, slug, public_title, target, status, published_at")
            .eq("id", donation.campaign_id)
            .maybeSingle()
        ).data
      : null;
    const cause = donation.cause_id
      ? (
          await context.supabase
            .from("causes")
            .select("id, name")
            .eq("id", donation.cause_id)
            .maybeSingle()
        ).data
      : null;

    return { donation, campaign, cause };
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
      .update({ full_name: data.fullName, phone: data.phone })
      .eq("user_id", context.userId);
    if (error) throw new Error("Could not save your preferences");
    return { ok: true };
  });

export const saveRecurringPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      amount: number;
      frequency: "weekly" | "monthly" | "quarterly";
      status?: "active" | "paused" | "cancelled";
    }) =>
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
    const frequency =
      data.frequency === "weekly" ? "Weekly" : data.frequency === "monthly" ? "Monthly" : "Quarterly";
    const status =
      data.status === "cancelled" ? "Cancelled" : data.status === "paused" ? "Paused" : "Active";
    const days = data.frequency === "weekly" ? 7 : data.frequency === "monthly" ? 30 : 90;
    const next = new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

    const existing = await supabaseAdmin
      .from("recurring_plans")
      .select("id")
      .eq("donor_user_id", context.userId)
      .neq("status", "Cancelled")
      .maybeSingle();

    if (existing.data) {
      await supabaseAdmin
        .from("recurring_plans")
        .update({ amount: data.amount, frequency, status, next_run_on: next })
        .eq("id", existing.data.id)
        .eq("donor_user_id", context.userId);
    } else {
      await supabaseAdmin.from("recurring_plans").insert({
        donor_user_id: context.userId,
        amount: data.amount,
        frequency,
        status,
        next_run_on: next,
      });
    }
    await supabaseAdmin.from("notifications").insert({
      recipient_user_id: context.userId,
      notification_type: "recurring",
      title: data.status === "cancelled" ? "Recurring giving cancelled" : "Recurring giving updated",
      message:
        data.status === "cancelled"
          ? "Your recurring contribution has been cancelled. You can restart it any time."
          : `₦${data.amount.toLocaleString("en-NG")} ${data.frequency}, next on ${next}.`,
    });
    return { ok: true };
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("recipient_user_id", context.userId)
      .is("read_at", null);
    return { ok: true };
  });
