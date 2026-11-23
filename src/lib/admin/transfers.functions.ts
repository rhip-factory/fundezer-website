import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const TRANSFER_STATUSES = [
  "Submitted",
  "Under Review",
  "Receiving Hospital Pending",
  "Accepted",
  "Patient Notified",
  "Transfer Scheduled",
  "Treatment Commenced",
  "Completed",
  "Rejected",
  "Cancelled",
] as const;

export type TransferStatusValue = (typeof TRANSFER_STATUSES)[number];

export const TRANSFER_FLOW: TransferStatusValue[] = [
  "Accepted",
  "Patient Notified",
  "Transfer Scheduled",
  "Treatment Commenced",
  "Completed",
];

export interface TransferEventRecord {
  id: string;
  status: string;
  at: string;
  by: string;
  note: string;
}

export interface TransferRecord {
  id: string;
  reference: string;
  patientId: string;
  patientName: string;
  fromHospitalId: string;
  fromHospitalName: string;
  receivingHospitalId: string | null;
  receivingHospitalName: string;
  serviceId: string | null;
  serviceName: string;
  campaignTitle: string;
  urgency: string;
  treatmentPhase: string;
  status: TransferStatusValue;
  reason: string;
  adminDecision: string;
  requestedAt: string;
  timeline: TransferEventRecord[];
}

export interface TransferHospitalOption {
  id: string;
  name: string;
  city: string;
  beds: number;
  status: string;
  verification: string;
  capabilities: Record<string, string>;
}

type Ctx = { supabase: any; userId: string; claims: Record<string, unknown> };

async function actorLabel(ctx: Ctx) {
  const { data } = await ctx.supabase
    .from("profiles")
    .select("full_name")
    .eq("user_id", ctx.userId)
    .maybeSingle();
  const claims = ctx.claims;
  return (
    (data?.full_name as string | undefined) ??
    (typeof claims["email"] === "string" ? (claims["email"] as string) : "Administrator")
  );
}

const SELECT = `
  id, reference_code, patient_id, campaign_id, originating_hospital_id, receiving_hospital_id,
  service_id, reason, urgency, treatment_phase, status, admin_decision, requested_at
`;

async function attachRelations(sb: any, rows: any[]): Promise<any[]> {
  const ids = (key: string) => [...new Set(rows.map((row) => row[key]).filter(Boolean))] as string[];
  const hospitalIds = [
    ...new Set([...ids("originating_hospital_id"), ...ids("receiving_hospital_id")]),
  ];
  const load = async (table: string, columns: string, list: string[]) => {
    if (!list.length) return new Map<string, any>();
    const { data, error } = await sb.from(table).select(columns).in("id", list);
    if (error) throw new Error(error.message);
    return new Map<string, any>((data ?? []).map((item: any) => [item.id, item]));
  };
  const [patients, hospitals, services, campaigns] = await Promise.all([
    load("patients", "id, display_name", ids("patient_id")),
    load("hospitals", "id, name", hospitalIds),
    load("services", "id, name", ids("service_id")),
    load("campaigns", "id, title", ids("campaign_id")),
  ]);
  return rows.map((row) => ({
    ...row,
    patients: patients.get(row.patient_id) ?? null,
    origin: hospitals.get(row.originating_hospital_id) ?? null,
    receiving: hospitals.get(row.receiving_hospital_id) ?? null,
    services: services.get(row.service_id) ?? null,
    campaigns: campaigns.get(row.campaign_id) ?? null,
  }));
}

function toRecord(row: any, timeline: TransferEventRecord[]): TransferRecord {
  return {
    id: row.id,
    reference: row.reference_code,
    patientId: row.patient_id,
    patientName: row.patients?.display_name ?? "Unknown patient",
    fromHospitalId: row.originating_hospital_id,
    fromHospitalName: row.origin?.name ?? "—",
    receivingHospitalId: row.receiving_hospital_id ?? null,
    receivingHospitalName: row.receiving?.name ?? "",
    serviceId: row.service_id ?? null,
    serviceName: row.services?.name ?? "—",
    campaignTitle: row.campaigns?.title ?? "—",
    urgency: row.urgency,
    treatmentPhase: row.treatment_phase ?? "—",
    status: row.status,
    reason: row.reason ?? "",
    adminDecision: row.admin_decision ?? "",
    requestedAt: row.requested_at,
    timeline,
  };
}

function eventRecord(e: any): TransferEventRecord {
  return {
    id: e.id,
    status: e.status,
    at: e.occurred_at,
    by: e.actor_label ?? "System",
    note: e.note ?? "",
  };
}

export const listTransfers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TransferRecord[]> => {
    const supabase = (context as unknown as Ctx).supabase;
    const [{ data: rows, error }, { data: events }] = await Promise.all([
      supabase.from("transfers").select(SELECT).order("requested_at", { ascending: false }),
      supabase
        .from("transfer_events")
        .select("id, transfer_id, status, actor_label, note, occurred_at")
        .order("occurred_at", { ascending: true }),
    ]);
    if (error) throw new Error(error.message);

    const byTransfer = new Map<string, TransferEventRecord[]>();
    for (const e of events ?? []) {
      const list = byTransfer.get(e.transfer_id) ?? [];
      list.push(eventRecord(e));
      byTransfer.set(e.transfer_id, list);
    }
    const completeRows = await attachRelations(supabase, rows ?? []);
    return completeRows.map((row: any) => toRecord(row, byTransfer.get(row.id) ?? []));
  });

export const listTransferHospitals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TransferHospitalOption[]> => {
    const supabase = (context as unknown as Ctx).supabase;
    const [{ data: hospitals, error }, { data: capabilities }] = await Promise.all([
      supabase.from("hospitals").select("id, name, city, beds, status, verification").order("name"),
      supabase.from("hospital_capabilities").select("hospital_id, service_id, status"),
    ]);
    if (error) throw new Error(error.message);

    const caps = new Map<string, Record<string, string>>();
    for (const c of capabilities ?? []) {
      const map = caps.get(c.hospital_id) ?? {};
      map[c.service_id] = c.status;
      caps.set(c.hospital_id, map);
    }
    return (hospitals ?? []).map((h: any) => ({
      id: h.id,
      name: h.name,
      city: h.city,
      beds: h.beds ?? 0,
      status: h.status,
      verification: h.verification,
      capabilities: caps.get(h.id) ?? {},
    }));
  });

async function readOne(ctx: Ctx, id: string): Promise<TransferRecord> {
  const [{ data: row, error }, { data: events }] = await Promise.all([
    ctx.supabase.from("transfers").select(SELECT).eq("id", id).single(),
    ctx.supabase
      .from("transfer_events")
      .select("id, status, actor_label, note, occurred_at")
      .eq("transfer_id", id)
      .order("occurred_at", { ascending: true }),
  ]);
  if (error) throw new Error(error.message);
  const [completeRow] = await attachRelations(ctx.supabase, [row]);
  if (!completeRow) throw new Error("Transfer not found.");
  return toRecord(completeRow, (events ?? []).map(eventRecord));
}

export const setTransferStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(TRANSFER_STATUSES),
        note: z.string().trim().max(2000).optional(),
        receivingHospitalId: z.string().uuid().nullable().optional(),
        actedByHospital: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<TransferRecord> => {
    const ctx = context as unknown as Ctx;

    const { data: before, error: beforeError } = await ctx.supabase
      .from("transfers")
      .select("status, reference_code, patient_id, receiving_hospital_id")
      .eq("id", data.id)
      .maybeSingle();
    if (beforeError) throw new Error(beforeError.message);
    if (!before) throw new Error("Transfer not found.");

    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { status: data.status };
    if (data.receivingHospitalId) patch["receiving_hospital_id"] = data.receivingHospitalId;
    if (data.note) patch["admin_decision"] = data.note;
    if (
      data.status === "Receiving Hospital Pending" ||
      data.status === "Rejected" ||
      data.status === "Cancelled"
    ) {
      patch["admin_decision_by"] = ctx.userId;
      patch["admin_decision_at"] = now;
    }
    if (data.status === "Transfer Scheduled") patch["scheduled_for"] = now;
    if (data.status === "Completed") patch["completed_at"] = now;

    const { error: updateError } = await ctx.supabase
      .from("transfers")
      .update(patch)
      .eq("id", data.id);
    if (updateError) throw new Error(updateError.message);

    const receivingId = data.receivingHospitalId ?? before.receiving_hospital_id ?? null;
    let byLabel = `Admin — ${await actorLabel(ctx)}`;
    if (data.actedByHospital && receivingId) {
      const { data: hospital } = await ctx.supabase
        .from("hospitals")
        .select("name")
        .eq("id", receivingId)
        .maybeSingle();
      byLabel = hospital?.name ?? "Receiving hospital";
    }

    await ctx.supabase.from("transfer_events").insert({
      transfer_id: data.id,
      status: data.status,
      actor_user_id: ctx.userId,
      actor_label: byLabel,
      note: data.note ?? null,
      occurred_at: now,
    });

    if (data.status === "Completed" && receivingId) {
      await ctx.supabase
        .from("patients")
        .update({ current_hospital_id: receivingId, status: "Transferred" })
        .eq("id", before.patient_id);
      await ctx.supabase
        .from("patient_hospital_history")
        .update({ ended_on: now.slice(0, 10) })
        .eq("patient_id", before.patient_id)
        .is("ended_on", null);
      await ctx.supabase.from("patient_hospital_history").insert({
        patient_id: before.patient_id,
        hospital_id: receivingId,
        transfer_id: data.id,
        reason: `Transfer ${before.reference_code}`,
        started_on: now.slice(0, 10),
      });
    }

    await ctx.supabase.from("audit_logs").insert({
      actor_user_id: ctx.userId,
      actor_name: await actorLabel(ctx),
      actor_role: "platform_administrator",
      action: `Transfer ${data.status}`,
      entity_type: "Transfer",
      entity_id: data.id,
      entity_label: before.reference_code,
      description: data.note
        ? `Transfer ${before.reference_code} moved from ${before.status} to ${data.status}. ${data.note}`
        : `Transfer ${before.reference_code} moved from ${before.status} to ${data.status}.`,
      previous_state: { status: before.status },
      new_state: { status: data.status },
    });

    return readOne(ctx, data.id);
  });
