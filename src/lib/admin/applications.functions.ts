import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const APPLICATION_STATUSES = [
  "Submitted",
  "Under Review",
  "Information Requested",
  "Verified",
  "Approved",
  "Rejected",
  "Withdrawn",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface ApplicationRecord {
  id: string;
  title: string;
  description: string;
  requestedAmount: number;
  status: ApplicationStatus;
  reviewNotes: string;
  verificationNotes: string;
  submittedAt: string;
  statusChangedAt: string;
  reviewedAt: string | null;
  decidedAt: string | null;
  patientId: string;
  patientName: string;
  patientReference: string;
  patientCondition: string;
  patientUrgency: string;
  hospitalId: string | null;
  hospitalName: string;
  causeName: string;
  serviceName: string;
}

type Ctx = { supabase: any; userId: string; claims: Record<string, unknown> };

const SELECT = `
  id, title, description, requested_amount, status, review_notes, verification_notes,
  submitted_at, status_changed_at, reviewed_at, decided_at,
  patient_id, hospital_id, cause_id, service_id
`;

async function attachRelations(sb: any, rows: any[]): Promise<any[]> {
  const ids = (k: string) => [...new Set(rows.map((r) => r[k]).filter(Boolean))] as string[];
  const load = async (table: string, cols: string, list: string[]) => {
    if (!list.length) return new Map<string, any>();
    const { data, error } = await sb.from(table).select(cols).in("id", list);
    if (error) throw new Error(error.message);
    return new Map<string, any>((data ?? []).map((d: any) => [d.id, d]));
  };
  const [p, h, c, s] = await Promise.all([
    load("patients", "id, display_name, reference_code, condition, urgency", ids("patient_id")),
    load("hospitals", "id, name", ids("hospital_id")),
    load("causes", "id, name", ids("cause_id")),
    load("services", "id, name", ids("service_id")),
  ]);
  return rows.map((r) => ({
    ...r,
    patients: p.get(r.patient_id) ?? null,
    hospitals: h.get(r.hospital_id) ?? null,
    causes: c.get(r.cause_id) ?? null,
    services: s.get(r.service_id) ?? null,
  }));
}

function toRecord(row: any): ApplicationRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    requestedAmount: Number(row.requested_amount ?? 0),
    status: row.status,
    reviewNotes: row.review_notes ?? "",
    verificationNotes: row.verification_notes ?? "",
    submittedAt: row.submitted_at,
    statusChangedAt: row.status_changed_at,
    reviewedAt: row.reviewed_at ?? null,
    decidedAt: row.decided_at ?? null,
    patientId: row.patient_id,
    patientName: row.patients?.display_name ?? "Unknown patient",
    patientReference: row.patients?.reference_code ?? "—",
    patientCondition: row.patients?.condition ?? "—",
    patientUrgency: row.patients?.urgency ?? "—",
    hospitalId: row.hospital_id ?? null,
    hospitalName: row.hospitals?.name ?? "Unassigned",
    causeName: row.causes?.name ?? "—",
    serviceName: row.services?.name ?? "—",
  };
}

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

export const listApplications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ApplicationRecord[]> => {
    const ctx = context as unknown as Ctx;
    const { data, error } = await ctx.supabase
      .from("applications")
      .select(SELECT)
      .order("submitted_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (await attachRelations(ctx.supabase, data ?? [])).map(toRecord);
  });

export const setApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(APPLICATION_STATUSES),
        note: z.string().trim().max(2000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<ApplicationRecord> => {
    const ctx = context as unknown as Ctx;

    const { data: before, error: beforeError } = await ctx.supabase
      .from("applications")
      .select("status, review_notes, verification_notes")
      .eq("id", data.id)
      .maybeSingle();
    if (beforeError) throw new Error(beforeError.message);
    if (!before) throw new Error("Application not found.");

    const now = new Date().toISOString();
    const patch: Record<string, unknown> = {
      status: data.status,
      status_changed_at: now,
      reviewed_by: ctx.userId,
    };
    if (data.note) {
      if (data.status === "Verified") patch["verification_notes"] = data.note;
      else patch["review_notes"] = data.note;
    }
    if (data.status === "Under Review" || data.status === "Information Requested")
      patch["reviewed_at"] = now;
    if (data.status === "Verified") patch["verified_by"] = ctx.userId;
    if (data.status === "Approved" || data.status === "Rejected" || data.status === "Withdrawn")
      patch["decided_at"] = now;

    const { data: row, error } = await ctx.supabase
      .from("applications")
      .update(patch)
      .eq("id", data.id)
      .select(SELECT)
      .single();
    if (error) throw new Error(error.message);

    await ctx.supabase.from("audit_logs").insert({
      actor_user_id: ctx.userId,
      actor_name: await actorLabel(ctx),
      actor_role: "platform_administrator",
      action: `Application ${data.status}`,
      entity_type: "Application",
      entity_id: row.id,
      entity_label: row.title,
      description: data.note
        ? `Application "${row.title}" moved from ${before.status} to ${data.status}. ${data.note}`
        : `Application "${row.title}" moved from ${before.status} to ${data.status}.`,
      previous_state: before,
      new_state: { status: data.status },
    });

    const [full] = await attachRelations(ctx.supabase, [row]);
    return toRecord(full);
  });
