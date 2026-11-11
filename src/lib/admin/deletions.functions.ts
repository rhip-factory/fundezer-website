import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: any; userId: string };

async function assertAdmin(ctx: Ctx) {
  const { data } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .eq("role", "platform_administrator")
    .maybeSingle();
  if (!data) throw new Error("Only platform administrators can delete records.");
}

async function purgeCampaigns(admin: any, ids: string[]) {
  if (!ids.length) return;
  // Keep financial history: unlink donations and recurring plans instead of erasing payments.
  await admin.from("donations").update({ campaign_id: null }).in("campaign_id", ids);
  await admin.from("recurring_plans").update({ campaign_id: null }).in("campaign_id", ids);
  await admin.from("transfers").update({ campaign_id: null }).in("campaign_id", ids);
  for (const table of ["campaign_updates", "fund_requests", "consents", "documents", "treatment_updates", "treatment_journeys"]) {
    const { error } = await (admin as any).from(table).delete().in("campaign_id", ids);
    if (error) throw new Error(error.message);
  }
  const { error } = await admin.from("campaigns").delete().in("id", ids);
  if (error) throw new Error(error.message);
}

async function audit(admin: any, ctx: Ctx, entity: string, id: string, label: string) {
  await admin.from("audit_logs").insert({
    actor_user_id: ctx.userId,
    actor_role: "platform_administrator",
    action: `${entity} Deleted`,
    entity_type: entity,
    entity_id: id,
    entity_label: label,
    description: `${entity} "${label}" permanently deleted.`,
  });
}

export const deleteCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("campaigns").select("title").eq("id", data.id).maybeSingle();
    if (!row) throw new Error("Campaign not found.");
    await purgeCampaigns(supabaseAdmin, [data.id]);
    await audit(supabaseAdmin, ctx, "Campaign", data.id, row.title);
    return { ok: true };
  });

export const deletePatient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { supabaseAdmin: admin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await admin.from("patients").select("display_name").eq("id", data.id).maybeSingle();
    if (!row) throw new Error("Patient not found.");

    const { data: camps } = await admin.from("campaigns").select("id").eq("patient_id", data.id);
    await purgeCampaigns(admin, (camps ?? []).map((c: any) => c.id));

    const { data: transfers } = await admin.from("transfers").select("id").eq("patient_id", data.id);
    const tIds = (transfers ?? []).map((t: any) => t.id);
    if (tIds.length) {
      await admin.from("transfer_events").delete().in("transfer_id", tIds);
      await admin.from("documents").delete().in("transfer_id", tIds);
      await admin.from("patient_hospital_history").delete().in("transfer_id", tIds);
      const { error } = await admin.from("transfers").delete().in("id", tIds);
      if (error) throw new Error(error.message);
    }
    const { data: apps } = await admin.from("applications").select("id").eq("patient_id", data.id);
    const aIds = (apps ?? []).map((a: any) => a.id);
    if (aIds.length) await admin.from("documents").delete().in("application_id", aIds);

    for (const table of ["treatment_updates", "treatment_journeys", "patient_hospital_history", "consents", "documents", "applications"]) {
      const { error } = await (admin as any).from(table).delete().eq("patient_id", data.id);
      if (error) throw new Error(error.message);
    }
    const { error } = await admin.from("patients").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await audit(admin, ctx, "Patient", data.id, row.display_name);
    return { ok: true };
  });
