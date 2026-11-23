import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface ServiceRecord {
  id: string;
  name: string;
}

export interface HospitalCapability {
  serviceId: string;
  serviceName: string;
  status: string;
}

export interface HospitalEquipment {
  id: string;
  name: string;
  count: number;
  condition: string;
}

export interface HospitalPatientSummary {
  id: string;
  displayName: string;
  condition: string;
  status: string;
}

export interface HospitalRecord {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  contactRole: string;
  email: string;
  phone: string;
  beds: number;
  accreditation: string;
  verification: string;
  status: string;
  onboarded: string;
  capabilities: HospitalCapability[];
  equipment: HospitalEquipment[];
  patients: HospitalPatientSummary[];
}

type Ctx = { supabase: any; userId: string; claims: Record<string, unknown> };

const draftSchema = z.object({
  name: z.string().trim().min(3).max(200),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(120),
  contactRole: z.string().trim().max(160).optional().default(""),
  email: z.string().trim().email().or(z.literal("")).optional().default(""),
  phone: z.string().trim().max(60).optional().default(""),
  beds: z.number().int().min(0),
  accreditation: z.string().trim().max(200).optional().default(""),
  verification: z.enum(["Verified", "Pending", "Suspended"]),
  status: z.enum(["active", "inactive", "suspended"]),
  serviceIds: z.array(z.string().uuid()).default([]),
});

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

export const listServices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ServiceRecord[]> => {
    const supabase = (context as unknown as Ctx).supabase;
    const { data, error } = await supabase
      .from("services")
      .select("id, name")
      .eq("is_active", true)
      .order("name");
    if (error) throw new Error(error.message);
    return (data ?? []).map((s: any) => ({ id: s.id, name: s.name }));
  });

export const listHospitals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<HospitalRecord[]> => {
    const supabase = (context as unknown as Ctx).supabase;
    const [
      { data: hospitals, error },
      { data: services },
      { data: capabilities },
      { data: equipment },
      { data: patients },
    ] = await Promise.all([
      supabase
        .from("hospitals")
        .select(
          "id, name, city, state, address, contact_role, email, phone, beds, accreditation, verification, status, onboarded_on",
        )
        .order("name"),
      supabase.from("services").select("id, name").eq("is_active", true).order("name"),
      supabase.from("hospital_capabilities").select("hospital_id, service_id, status"),
      supabase.from("hospital_equipment").select("id, hospital_id, name, quantity, condition"),
      supabase
        .from("patients")
        .select("id, display_name, condition, status, current_hospital_id")
        .not("current_hospital_id", "is", null),
    ]);
    if (error) throw new Error(error.message);

    const serviceList: ServiceRecord[] = (services ?? []).map((s: any) => ({
      id: s.id,
      name: s.name,
    }));

    const capByHospital = new Map<string, Map<string, string>>();
    for (const c of capabilities ?? []) {
      const map = capByHospital.get(c.hospital_id) ?? new Map<string, string>();
      map.set(c.service_id, c.status);
      capByHospital.set(c.hospital_id, map);
    }
    const equipByHospital = new Map<string, HospitalEquipment[]>();
    for (const e of equipment ?? []) {
      const list = equipByHospital.get(e.hospital_id) ?? [];
      list.push({ id: e.id, name: e.name, count: e.quantity ?? 0, condition: e.condition ?? "—" });
      equipByHospital.set(e.hospital_id, list);
    }
    const patientsByHospital = new Map<string, HospitalPatientSummary[]>();
    for (const p of patients ?? []) {
      const list = patientsByHospital.get(p.current_hospital_id) ?? [];
      list.push({
        id: p.id,
        displayName: p.display_name,
        condition: p.condition ?? "—",
        status: p.status,
      });
      patientsByHospital.set(p.current_hospital_id, list);
    }

    return (hospitals ?? []).map((h: any): HospitalRecord => {
      const caps = capByHospital.get(h.id);
      return {
        id: h.id,
        name: h.name,
        city: h.city,
        state: h.state,
        address: h.address ?? "",
        contactRole: h.contact_role ?? "—",
        email: h.email ?? "—",
        phone: h.phone ?? "—",
        beds: h.beds ?? 0,
        accreditation: h.accreditation ?? "—",
        verification: h.verification,
        status: h.status,
        onboarded: h.onboarded_on,
        capabilities: serviceList.map((s) => ({
          serviceId: s.id,
          serviceName: s.name,
          status: caps?.get(s.id) ?? "Not Available",
        })),
        equipment: equipByHospital.get(h.id) ?? [],
        patients: patientsByHospital.get(h.id) ?? [],
      };
    });
  });

export const createHospital = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => draftSchema.parse(data))
  .handler(async ({ context, data }): Promise<{ id: string }> => {
    const ctx = context as unknown as Ctx;
    const { data: row, error } = await ctx.supabase
      .from("hospitals")
      .insert({
        name: data.name,
        city: data.city,
        state: data.state,
        contact_role: data.contactRole || null,
        email: data.email || null,
        phone: data.phone || null,
        beds: data.beds,
        accreditation: data.accreditation || null,
        verification: data.verification,
        status: data.status,
        onboarded_on: new Date().toISOString().slice(0, 10),
      })
      .select("id, name")
      .single();
    if (error) throw new Error(error.message);

    if (data.serviceIds.length > 0) {
      const { error: capError } = await ctx.supabase.from("hospital_capabilities").insert(
        data.serviceIds.map((serviceId) => ({
          hospital_id: row.id,
          service_id: serviceId,
          status: "Available",
        })),
      );
      if (capError) throw new Error(capError.message);
    }

    await ctx.supabase.from("audit_logs").insert({
      actor_user_id: ctx.userId,
      actor_name: await actorLabel(ctx),
      actor_role: "platform_administrator",
      action: "Hospital Added",
      entity_type: "Hospital",
      entity_id: row.id,
      entity_label: row.name,
      description: `New hospital "${row.name}" onboarded as ${data.verification}.`,
      new_state: { verification: data.verification, status: data.status, beds: data.beds },
    });

    return { id: row.id };
  });
