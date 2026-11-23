import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AuditRecord {
  id: string;
  at: string;
  user: string;
  role: string;
  action: string;
  recordType: string;
  record: string;
  description: string;
  actorUserId: string | null;
}

type Ctx = { supabase: any; userId: string; claims: Record<string, unknown> };

export const listAuditLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AuditRecord[]> => {
    const supabase = (context as unknown as Ctx).supabase;
    const { data, error } = await supabase
      .from("audit_logs")
      .select(
        "id, created_at, actor_user_id, actor_name, actor_role, action, entity_type, entity_id, entity_label, description",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    return (data ?? []).map(
      (a: any): AuditRecord => ({
        id: a.id,
        at: a.created_at,
        user: a.actor_name ?? "System",
        role: a.actor_role ?? "—",
        action: a.action,
        recordType: a.entity_type,
        record: a.entity_label ?? String(a.entity_id ?? "—").slice(0, 8).toUpperCase(),
        description: a.description ?? "",
        actorUserId: a.actor_user_id ?? null,
      }),
    );
  });
