import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const CAMPAIGN_STATUSES = [
  "Draft",
  "Under Review",
  "Active",
  "Completed",
  "Suspended",
] as const;

export type CampaignStatusValue = (typeof CAMPAIGN_STATUSES)[number];

export interface CampaignDonationRecord {
  id: string;
  donor: string;
  amount: number;
  date: string;
  channel: string;
  paymentStatus: string;
}

export interface CampaignRecord {
  id: string;
  title: string;
  summary: string;
  status: CampaignStatusValue;
  target: number;
  /** Derived from paid donation records — never stored on the campaign row. */
  raised: number;
  created: string;
  patientId: string;
  patientName: string;
  hospitalId: string | null;
  hospitalName: string;
  causeId: string | null;
  causeName: string;
  donations: CampaignDonationRecord[];
}

export interface CampaignOptions {
  patients: { id: string; label: string }[];
  hospitals: { id: string; label: string }[];
  causes: { id: string; label: string }[];
}

type Ctx = { supabase: any; userId: string; claims: Record<string, unknown> };

const SELECT = `
  id, title, internal_summary, status, target, created_at,
  patient_id, hospital_id, cause_id
`;

async function attachRelations(sb: any, rows: any[]): Promise<any[]> {
  const ids = (key: string) => [...new Set(rows.map((row) => row[key]).filter(Boolean))] as string[];
  const load = async (table: string, columns: string, list: string[]) => {
    if (!list.length) return new Map<string, any>();
    const { data, error } = await sb.from(table).select(columns).in("id", list);
    if (error) throw new Error(error.message);
    return new Map<string, any>((data ?? []).map((item: any) => [item.id, item]));
  };
  const [patients, hospitals, causes] = await Promise.all([
    load("patients", "id, display_name", ids("patient_id")),
    load("hospitals", "id, name", ids("hospital_id")),
    load("causes", "id, name", ids("cause_id")),
  ]);
  return rows.map((row) => ({
    ...row,
    patients: patients.get(row.patient_id) ?? null,
    hospitals: hospitals.get(row.hospital_id) ?? null,
    causes: causes.get(row.cause_id) ?? null,
  }));
}

const draftSchema = z.object({
  title: z.string().trim().min(3).max(200),
  patientId: z.string().uuid(),
  hospitalId: z.string().uuid().nullable().optional(),
  causeId: z.string().uuid().nullable().optional(),
  target: z.number().positive(),
  status: z.enum(CAMPAIGN_STATUSES),
  summary: z.string().trim().max(4000).optional().default(""),
});

async function actorLabel(context: Ctx) {
  const { data } = await context.supabase
    .from("profiles")
    .select("full_name")
    .eq("user_id", context.userId)
    .maybeSingle();
  const claims = context.claims as Record<string, unknown>;
  return (
    (data?.full_name as string | undefined) ??
    (typeof claims["email"] === "string" ? (claims["email"] as string) : "Administrator")
  );
}

async function writeAudit(
  context: Ctx,
  action: string,
  campaign: { id: string; title: string },
  description: string,
  previous: unknown,
  next: unknown,
) {
  await context.supabase.from("audit_logs").insert({
    actor_user_id: context.userId,
    actor_name: await actorLabel(context),
    actor_role: "platform_administrator",
    action,
    entity_type: "Campaign",
    entity_id: campaign.id,
    entity_label: campaign.title,
    description,
    previous_state: previous ?? null,
    new_state: next ?? null,
  });
}

async function assertApplicationApproved(ctx: Ctx, applicationId: string | null | undefined) {
  if (!applicationId) return;
  const { data } = await ctx.supabase
    .from("applications")
    .select("status")
    .eq("id", applicationId)
    .maybeSingle();
  if (data?.status !== "Approved")
    throw new Error("This campaign can't go live until its application has been approved.");
}

function toRecord(row: any, raised: number, donations: CampaignDonationRecord[]): CampaignRecord {
  return {
    id: row.id,
    title: row.title,
    summary: row.internal_summary ?? "",
    status: row.status,
    target: Number(row.target ?? 0),
    raised,
    created: row.created_at,
    patientId: row.patient_id,
    patientName: row.patients?.display_name ?? "—",
    hospitalId: row.hospital_id ?? null,
    hospitalName: row.hospitals?.name ?? "—",
    causeId: row.cause_id ?? null,
    causeName: row.causes?.name ?? "—",
    donations,
  };
}

function donationRecord(d: any): CampaignDonationRecord {
  return {
    id: d.id,
    donor: d.is_anonymous ? "Anonymous donor" : (d.donor_name ?? "Donor"),
    amount: Number(d.amount ?? 0),
    date: d.created_at,
    channel: d.payment_method ?? "Online",
    paymentStatus: d.payment_status,
  };
}

export const listCampaigns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CampaignRecord[]> => {
    const ctx = context as unknown as Ctx;
    const [{ data: rows, error }, { data: donations, error: donationError }] = await Promise.all([
      ctx.supabase.from("campaigns").select(SELECT).order("created_at", { ascending: false }),
      ctx.supabase
        .from("donations")
        .select("id, campaign_id, donor_name, is_anonymous, amount, payment_status, payment_method, created_at")
        .not("campaign_id", "is", null)
        .order("created_at", { ascending: false }),
    ]);
    if (error) throw new Error(error.message);
    if (donationError) throw new Error(donationError.message);

    const raised = new Map<string, number>();
    const byCampaign = new Map<string, CampaignDonationRecord[]>();
    for (const d of donations ?? []) {
      const key = d.campaign_id as string;
      if (d.payment_status === "Paid") raised.set(key, (raised.get(key) ?? 0) + Number(d.amount));
      const list = byCampaign.get(key) ?? [];
      if (list.length < 8) list.push(donationRecord(d));
      byCampaign.set(key, list);
    }

    const completeRows = await attachRelations(ctx.supabase, rows ?? []);
    return completeRows.map((row: any) =>
      toRecord(row, raised.get(row.id) ?? 0, byCampaign.get(row.id) ?? []),
    );
  });

export const listCampaignOptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CampaignOptions> => {
    const ctx = context as unknown as Ctx;
    const [{ data: patients }, { data: hospitals }, { data: causes }] = await Promise.all([
      ctx.supabase.from("patients").select("id, display_name").order("display_name"),
      ctx.supabase.from("hospitals").select("id, name").order("name"),
      ctx.supabase.from("causes").select("id, name").eq("status", "Active").order("name"),
    ]);
    return {
      patients: (patients ?? []).map((p: any) => ({ id: p.id, label: p.display_name })),
      hospitals: (hospitals ?? []).map((h: any) => ({ id: h.id, label: h.name })),
      causes: (causes ?? []).map((c: any) => ({ id: c.id, label: c.name })),
    };
  });

async function readOne(ctx: Ctx, id: string): Promise<CampaignRecord> {
  const [{ data: row, error }, { data: donations }] = await Promise.all([
    ctx.supabase.from("campaigns").select(SELECT).eq("id", id).single(),
    ctx.supabase
      .from("donations")
      .select("id, donor_name, is_anonymous, amount, payment_status, payment_method, created_at")
      .eq("campaign_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (error) throw new Error(error.message);
  const paid = (donations ?? [])
    .filter((d: any) => d.payment_status === "Paid")
    .reduce((sum: number, d: any) => sum + Number(d.amount), 0);
  const [completeRow] = await attachRelations(ctx.supabase, [row]);
  if (!completeRow) throw new Error("Campaign not found.");
  return toRecord(completeRow, paid, (donations ?? []).slice(0, 8).map(donationRecord));
}

export const createCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => draftSchema.parse(data))
  .handler(async ({ context, data }): Promise<CampaignRecord> => {
    const ctx = context as unknown as Ctx;
    const { data: row, error } = await ctx.supabase
      .from("campaigns")
      .insert({
        title: data.title,
        patient_id: data.patientId,
        hospital_id: data.hospitalId ?? null,
        cause_id: data.causeId ?? null,
        target: data.target,
        status: data.status,
        internal_summary: data.summary ?? "",
        ...(data.status === "Active" ? { published_at: new Date().toISOString() } : {}),
      })
      .select("id, title")
      .single();
    if (error) throw new Error(error.message);

    await writeAudit(
      ctx,
      "Campaign Created",
      row,
      `Campaign "${row.title}" created as ${data.status}.`,
      null,
      { status: data.status, target: data.target },
    );
    return readOne(ctx, row.id);
  });

export const updateCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => draftSchema.extend({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<CampaignRecord> => {
    const ctx = context as unknown as Ctx;
    const { data: before } = await ctx.supabase
      .from("campaigns")
      .select("title, target, status, internal_summary, patient_id, hospital_id, cause_id, application_id")
      .eq("id", data.id)
      .maybeSingle();
    if (data.status === "Active" && before?.status !== "Active")
      await assertApplicationApproved(ctx, before?.application_id);

    const { data: row, error } = await ctx.supabase
      .from("campaigns")
      .update({
        title: data.title,
        patient_id: data.patientId,
        hospital_id: data.hospitalId ?? null,
        cause_id: data.causeId ?? null,
        target: data.target,
        status: data.status,
        internal_summary: data.summary ?? "",
      })
      .eq("id", data.id)
      .select("id, title")
      .single();
    if (error) throw new Error(error.message);

    await writeAudit(ctx, "Campaign Updated", row, `Campaign "${row.title}" details updated.`, before, {
      title: data.title,
      status: data.status,
      target: data.target,
    });
    return readOne(ctx, row.id);
  });

export const setCampaignStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(CAMPAIGN_STATUSES) }).parse(data),
  )
  .handler(async ({ context, data }): Promise<CampaignRecord> => {
    const ctx = context as unknown as Ctx;
    const { data: before } = await ctx.supabase
      .from("campaigns")
      .select("status, published_at, application_id")
      .eq("id", data.id)
      .maybeSingle();
    if (data.status === "Active") await assertApplicationApproved(ctx, before?.application_id);

    const { data: row, error } = await ctx.supabase
      .from("campaigns")
      .update({
        status: data.status,
        ...(data.status === "Active" && !before?.published_at
          ? { published_at: new Date().toISOString() }
          : {}),
      })
      .eq("id", data.id)
      .select("id, title")
      .single();
    if (error) throw new Error(error.message);

    await writeAudit(
      ctx,
      "Campaign Status Changed",
      row,
      `Campaign status changed to ${data.status}.`,
      before,
      { status: data.status },
    );
    return readOne(ctx, row.id);
  });
