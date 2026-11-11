import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface Identity {
  userId: string;
  email: string | null;
  profile: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    city: string | null;
    state: string | null;
    status: string;
  };
  roles: AppRole[];
}

const displayNameFromClaims = (claims: Record<string, unknown>): string => {
  const meta = (claims["user_metadata"] ?? {}) as Record<string, unknown>;
  const name = typeof meta["full_name"] === "string" ? meta["full_name"].trim() : "";
  if (name) return name;
  const email = typeof claims["email"] === "string" ? claims["email"] : "";
  return email ? (email.split("@")[0] ?? "FundEzer user") : "FundEzer user";
};

/**
 * Ensures the signed-in backend user has exactly one profile row and returns
 * their profile + verified roles. Identity always comes from the validated
 * session token (context.userId), never from the browser.
 */
export const getIdentity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Identity> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    const claims = context.claims as unknown as Record<string, unknown>;
    const email = typeof claims["email"] === "string" ? (claims["email"] as string) : null;

    const { data: existing, error: readError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, phone, city, state, status")
      .eq("user_id", userId)
      .maybeSingle();
    if (readError) throw readError;

    let profile = existing;

    if (!profile) {
      // user_id carries a UNIQUE constraint, so upsert makes duplicates impossible
      // even under concurrent first-time sign-ins.
      const { data: created, error: upsertError } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            user_id: userId,
            full_name: displayNameFromClaims(claims),
            email,
          },
          { onConflict: "user_id" },
        )
        .select("id, full_name, email, phone, city, state, status")
        .single();
      if (upsertError) throw upsertError;
      profile = created;
    }

    const { data: roleRows, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (roleError) throw roleError;

    let roles = (roleRows ?? []).map((r) => r.role as AppRole);

    if (roles.length === 0) {
      // Bootstrap: the very first account on a fresh backend becomes the
      // platform administrator. Everyone after that gets no role until an
      // administrator grants one. The browser can never request a role.
      const { count, error: countError } = await supabaseAdmin
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("role", "platform_administrator");
      if (countError) throw countError;

      if ((count ?? 0) === 0) {
        const { error: grantError } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: userId, role: "platform_administrator" });
        if (!grantError) roles = ["platform_administrator"];
      }
    }

    return { userId, email, profile, roles };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        full_name: z.string().trim().min(3).max(120),
        phone: z.string().trim().max(40).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: data.full_name, phone: data.phone ?? null })
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });
