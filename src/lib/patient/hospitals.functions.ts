import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PartnerHospital = {
  id: string;
  name: string;
  city: string;
  specialty: string;
};

/**
 * Lists hospitals that are onboarded through the Hospital Portal: active,
 * verified and with at least one active hospital account, so every
 * application is received by a real hospital team.
 */
export const listPartnerHospitals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<PartnerHospital[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: accounts, error: accErr } = await supabaseAdmin
      .from("hospital_users")
      .select("hospital_id")
      .eq("status", "active");
    if (accErr) {
      console.error("[hospitals] accounts read failed", accErr);
      throw new Error("We could not load hospitals right now.");
    }
    const ids = [...new Set((accounts ?? []).map((a) => a.hospital_id))];
    if (ids.length === 0) return [];

    const { data, error } = await supabaseAdmin
      .from("hospitals")
      .select("id, name, city, state, accreditation")
      .in("id", ids)
      .eq("status", "active")
      .eq("verification", "Verified")
      .order("name");
    if (error) {
      console.error("[hospitals] read failed", error);
      throw new Error("We could not load hospitals right now.");
    }

    return (data ?? []).map((h) => ({
      id: h.id,
      name: h.name,
      city: [h.city, h.state].filter(Boolean).join(", "),
      specialty: h.accreditation ?? "FundEzer partner hospital",
    }));
  });
