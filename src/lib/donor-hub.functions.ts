import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type DonorDonation = {
  id: string;
  date: string;
  createdAt: string;
  amount: number;
  campaignId: string | null;
  causeId: string | null;
  targetName: string;
  type: string;
  status: string;
  visibility: "Public" | "Anonymous" | "Private";
  method: string;
  message: string | null;
};

export type DonorRecurringPlan = {
  id: string;
  amount: number;
  frequency: string;
  status: string;
  nextRunOn: string | null;
  campaignId: string | null;
  causeId: string | null;
};

export type DonorNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  time: string;
  unread: boolean;
};

export type DonorOverview = {
  profile: { fullName: string; email: string | null; phone: string | null; city: string | null; state: string | null } | null;
  donations: DonorDonation[];
  recurringPlans: DonorRecurringPlan[];
  notifications: DonorNotification[];
  totals: { given: number; campaignsSupported: number; paidCount: number; pendingCount: number };
};

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" }) : "";

const relative = (value: string) => {
  const diff = Date.now() - new Date(value).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return formatDate(value);
};

export const getDonorOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DonorOverview> => {
    const { supabase, userId } = context;
    const [profileRes, donationsRes, plansRes, notificationsRes] = await Promise.all([
      supabase.from("profiles").select("full_name, email, phone, city, state").eq("user_id", userId).maybeSingle(),
      supabase
        .from("donations")
        .select("id, amount, campaign_id, cause_id, donation_type, payment_status, is_anonymous, payment_method, message, created_at")
        .eq("donor_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("recurring_plans")
        .select("id, amount, frequency, status, next_run_on, campaign_id, cause_id")
        .eq("donor_user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("notifications")
        .select("id, title, message, notification_type, is_read, created_at")
        .eq("recipient_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (donationsRes.error) throw donationsRes.error;
    const donationRows = donationsRes.data ?? [];

    // Resolve only the public-facing label for the donor's own targets.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const campaignIds = [...new Set(donationRows.map((r) => r.campaign_id).filter((v): v is string => Boolean(v)))];
    const causeIds = [...new Set(donationRows.map((r) => r.cause_id).filter((v): v is string => Boolean(v)))];
    const [campaignsRes, causesRes] = await Promise.all([
      campaignIds.length
        ? supabaseAdmin.from("campaigns").select("id, public_title").in("id", campaignIds)
        : Promise.resolve({ data: [] as { id: string; public_title: string | null }[] }),
      causeIds.length
        ? supabaseAdmin.from("causes").select("id, name").in("id", causeIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    ]);
    const campaignNames = new Map((campaignsRes.data ?? []).map((c) => [c.id, c.public_title ?? "Supported campaign"]));
    const causeNames = new Map((causesRes.data ?? []).map((c) => [c.id, c.name]));

    const donations: DonorDonation[] = donationRows.map((row) => ({
      id: row.id,
      date: formatDate(row.created_at),
      createdAt: row.created_at,
      amount: Number(row.amount),
      campaignId: row.campaign_id,
      causeId: row.cause_id,
      targetName: row.campaign_id
        ? campaignNames.get(row.campaign_id) ?? "Supported campaign"
        : row.cause_id
          ? causeNames.get(row.cause_id) ?? "Cause pool"
          : "FundEzer",
      type: row.donation_type === "Recurring" ? "Recurring" : "One-time",
      status: row.payment_status,
      visibility: row.is_anonymous ? "Anonymous" : "Public",
      method: row.payment_method ?? "Not recorded",
      message: row.message,
    }));

    const paid = donations.filter((donation) => donation.status === "Paid");
    return {
      profile: profileRes.data
        ? {
            fullName: profileRes.data.full_name,
            email: profileRes.data.email,
            phone: profileRes.data.phone,
            city: profileRes.data.city,
            state: profileRes.data.state,
          }
        : null,
      donations,
      recurringPlans: (plansRes.data ?? []).map((row) => ({
        id: row.id,
        amount: Number(row.amount),
        frequency: row.frequency,
        status: row.status,
        nextRunOn: row.next_run_on,
        campaignId: row.campaign_id,
        causeId: row.cause_id,
      })),
      notifications: (notificationsRes.data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        body: row.message,
        type: row.notification_type,
        time: relative(row.created_at),
        unread: !row.is_read,
      })),
      totals: {
        given: paid.reduce((sum, donation) => sum + donation.amount, 0),
        campaignsSupported: new Set(paid.map((donation) => donation.campaignId).filter(Boolean)).size,
        paidCount: paid.length,
        pendingCount: donations.filter((donation) => donation.status === "Pending").length,
      },
    };
  });

export const createDonation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        campaignId: z.string().uuid().optional(),
        causeId: z.string().uuid().optional(),
        amount: z.number().int().positive().max(50_000_000),
        recurring: z.boolean().default(false),
        visibility: z.enum(["Public", "Anonymous", "Private"]),
        paymentMethod: z.string().min(2).max(60),
        frequency: z.enum(["Weekly", "Monthly", "Quarterly", "Yearly"]).optional(),
      })
      .refine((value) => Boolean(value.campaignId) !== Boolean(value.causeId), {
        message: "A donation must target exactly one campaign or one cause",
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: donation, error } = await supabase
      .from("donations")
      .insert({
        donor_user_id: userId,
        campaign_id: data.campaignId ?? null,
        cause_id: data.causeId ?? null,
        amount: data.amount,
        donation_type: data.recurring ? "Recurring" : data.campaignId ? "Patient" : "Cause",
        payment_status: "Pending",
        allocation_status: "Under Review",
        payment_method: data.paymentMethod,
        is_anonymous: data.visibility !== "Public",
      })
      .select("id, amount, payment_status, created_at")
      .single();
    if (error) throw error;

    if (data.recurring) {
      const next = new Date();
      next.setMonth(next.getMonth() + 1);
      await supabase.from("recurring_plans").insert({
        donor_user_id: userId,
        campaign_id: data.campaignId ?? null,
        cause_id: data.causeId ?? null,
        amount: data.amount,
        frequency: data.frequency ?? "Monthly",
        status: "Active",
        next_run_on: next.toISOString().slice(0, 10),
      });
    }

    return donation;
  });

export const saveRecurringPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        planId: z.string().uuid().optional(),
        amount: z.number().int().positive().max(50_000_000),
        frequency: z.enum(["Weekly", "Monthly", "Quarterly", "Yearly"]),
        active: z.boolean(),
        campaignId: z.string().uuid().optional(),
        causeId: z.string().uuid().optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const status = data.active ? "Active" : "Paused";
    if (data.planId) {
      const { error } = await supabase
        .from("recurring_plans")
        .update({ amount: data.amount, frequency: data.frequency, status })
        .eq("id", data.planId)
        .eq("donor_user_id", userId);
      if (error) throw error;
      return { id: data.planId };
    }
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    const { data: plan, error } = await supabase
      .from("recurring_plans")
      .insert({
        donor_user_id: userId,
        amount: data.amount,
        frequency: data.frequency,
        status,
        campaign_id: data.campaignId ?? null,
        cause_id: data.causeId ?? null,
        next_run_on: next.toISOString().slice(0, 10),
      })
      .select("id")
      .single();
    if (error) throw error;
    return plan;
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("recipient_user_id", context.userId)
      .eq("is_read", false);
    if (error) throw error;
    return { ok: true };
  });

export const updateDonorProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        fullName: z.string().min(2).max(120),
        phone: z.string().max(40).optional().nullable(),
        city: z.string().max(80).optional().nullable(),
        state: z.string().max(80).optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const payload = {
      user_id: userId,
      full_name: data.fullName,
      phone: data.phone ?? null,
      city: data.city ?? null,
      state: data.state ?? null,
    };
    const { data: existing } = await supabase.from("profiles").select("id").eq("user_id", userId).maybeSingle();
    if (existing) {
      const { error } = await supabase.from("profiles").update(payload).eq("user_id", userId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("profiles").insert({ ...payload, status: "active" });
      if (error) throw error;
    }
    return { ok: true };
  });
