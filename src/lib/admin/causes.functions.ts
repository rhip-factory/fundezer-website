import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface CauseRecord {
  id: string;
  name: string;
  description: string;
  image: string;
  status: "Active" | "Inactive";
  fundingTarget: number;
  pool: number;
  totalDonations: number;
  patientsSupported: number;
  lastUpdated: string;
}

const draftSchema = z.object({
  name: z.string().trim().min(3).max(160),
  description: z.string().trim().min(20).max(4000),
  image: z.string().trim().min(1).max(60),
  status: z.enum(["Active", "Inactive"]),
  fundingTarget: z.number().positive(),
});

type Ctx = { supabase: any; userId: string; claims: Record<string, unknown> };

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
  cause: { id: string; name: string },
  description: string,
  previous: unknown,
  next: unknown,
) {
  await context.supabase.from("audit_logs").insert({
    actor_user_id: context.userId,
    actor_name: await actorLabel(context),
    actor_role: "platform_administrator",
    action,
    entity_type: "Cause",
    entity_id: cause.id,
    entity_label: cause.name,
    description,
    previous_state: previous ?? null,
    new_state: next ?? null,
  });
}

function toRecord(
  row: any,
  pool: number,
  totalDonations: number,
  patientsSupported: number,
): CauseRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    image: row.image_url ?? "oncology",
    status: row.status,
    fundingTarget: Number(row.funding_target ?? 0),
    pool,
    totalDonations,
    patientsSupported,
    lastUpdated: String(row.updated_at ?? row.created_at ?? "").slice(0, 10),
  };
}

export const listCauses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CauseRecord[]> => {
    const supabase = (context as unknown as Ctx).supabase;
    const [{ data: rows, error }, { data: donations }, { data: campaigns }] = await Promise.all([
      supabase
        .from("causes")
        .select("id, name, description, image_url, status, funding_target, created_at, updated_at")
        .order("created_at", { ascending: true }),
      supabase.from("donations").select("cause_id, amount, payment_status").not("cause_id", "is", null),
      supabase.from("campaigns").select("cause_id, patient_id").not("cause_id", "is", null),
    ]);
    if (error) throw error;

    const pools = new Map<string, number>();
    const counts = new Map<string, number>();
    for (const d of donations ?? []) {
      const key = d.cause_id as string;
      counts.set(key, (counts.get(key) ?? 0) + 1);
      if (d.payment_status === "Paid") pools.set(key, (pools.get(key) ?? 0) + Number(d.amount));
    }
    const patients = new Map<string, Set<string>>();
    for (const c of campaigns ?? []) {
      const key = c.cause_id as string;
      if (!patients.has(key)) patients.set(key, new Set());
      patients.get(key)!.add(c.patient_id as string);
    }

    return (rows ?? []).map((row: any) =>
      toRecord(row, pools.get(row.id) ?? 0, counts.get(row.id) ?? 0, patients.get(row.id)?.size ?? 0),
    );
  });

export const createCause = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => draftSchema.parse(data))
  .handler(async ({ context, data }): Promise<CauseRecord> => {
    const ctx = context as unknown as Ctx;
    const { data: row, error } = await ctx.supabase
      .from("causes")
      .insert({
        name: data.name,
        description: data.description,
        image_url: data.image,
        status: data.status,
        funding_target: data.fundingTarget,
      })
      .select("id, name, description, image_url, status, funding_target, created_at, updated_at")
      .single();
    if (error) throw new Error(error.message);

    await writeAudit(
      ctx,
      "Cause Created",
      row,
      `New cause "${row.name}" created as ${row.status}.`,
      null,
      { status: row.status, funding_target: row.funding_target },
    );
    return toRecord(row, 0, 0, 0);
  });

export const updateCause = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => draftSchema.extend({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<CauseRecord> => {
    const ctx = context as unknown as Ctx;
    const { data: before } = await ctx.supabase
      .from("causes")
      .select("name, description, image_url, status, funding_target")
      .eq("id", data.id)
      .maybeSingle();

    const { data: row, error } = await ctx.supabase
      .from("causes")
      .update({
        name: data.name,
        description: data.description,
        image_url: data.image,
        status: data.status,
        funding_target: data.fundingTarget,
      })
      .eq("id", data.id)
      .select("id, name, description, image_url, status, funding_target, created_at, updated_at")
      .single();
    if (error) throw new Error(error.message);

    await writeAudit(ctx, "Cause Updated", row, `Cause "${row.name}" details updated.`, before, {
      name: row.name,
      status: row.status,
      funding_target: row.funding_target,
    });
    return toRecord(row, 0, 0, 0);
  });

export const setCauseStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["Active", "Inactive"]) }).parse(data),
  )
  .handler(async ({ context, data }): Promise<CauseRecord> => {
    const ctx = context as unknown as Ctx;
    const { data: before } = await ctx.supabase
      .from("causes")
      .select("status")
      .eq("id", data.id)
      .maybeSingle();

    const { data: row, error } = await ctx.supabase
      .from("causes")
      .update({ status: data.status })
      .eq("id", data.id)
      .select("id, name, description, image_url, status, funding_target, created_at, updated_at")
      .single();
    if (error) throw new Error(error.message);

    await writeAudit(
      ctx,
      data.status === "Active" ? "Cause Activated" : "Cause Deactivated",
      row,
      `${row.name} set to ${data.status}.`,
      before,
      { status: row.status },
    );
    return toRecord(row, 0, 0, 0);
  });
