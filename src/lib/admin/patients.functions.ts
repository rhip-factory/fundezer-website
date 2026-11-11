import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface PatientJourneyStep {
  stage: string;
  status: string;
  date: string | null;
  done: boolean;
}

export interface PatientUpdateRecord {
  id: string;
  author: string;
  date: string;
  note: string;
}

export interface PatientHistoryRecord {
  id: string;
  hospitalName: string;
  reason: string;
  from: string;
  to: string | null;
}

export interface PatientRecord {
  id: string;
  displayName: string;
  reference: string;
  condition: string;
  medicalSummary: string;
  ageBand: string;
  gender: string;
  urgency: string;
  status: string;
  hospitalId: string | null;
  hospitalName: string;
  causeId: string | null;
  causeName: string;
  campaignId: string | null;
  campaignTitle: string;
  treatmentStage: string;
  lastUpdated: string;
  journey: PatientJourneyStep[];
  updates: PatientUpdateRecord[];
  hospitalHistory: PatientHistoryRecord[];
}

type Ctx = { supabase: any; userId: string; claims: Record<string, unknown> };

export const listPatients = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PatientRecord[]> => {
    const supabase = (context as unknown as Ctx).supabase;

    const [
      { data: patients, error },
      { data: journeys },
      { data: updates },
      { data: history },
      { data: campaigns },
      { data: hospitals },
      { data: causes },
    ] = await Promise.all([
      supabase
        .from("patients")
        .select(
          "id, display_name, reference_code, condition, medical_summary, age_band, gender, urgency, status, current_hospital_id, updated_at, created_at",
        )
        .order("display_name"),
      supabase
        .from("treatment_journeys")
        .select("id, patient_id, stage, stage_status, position, started_at, completed_at")
        .order("position"),
      supabase
        .from("treatment_updates")
        .select("id, patient_id, hospital_id, public_summary, private_notes, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("patient_hospital_history")
        .select("id, patient_id, hospital_id, reason, started_on, ended_on")
        .order("started_on", { ascending: true }),
      supabase.from("campaigns").select("id, patient_id, title, cause_id, created_at"),
      supabase.from("hospitals").select("id, name"),
      supabase.from("causes").select("id, name"),
    ]);
    if (error) throw new Error(error.message);

    const hospitalName = new Map<string, string>(
      (hospitals ?? []).map((h: any) => [h.id as string, h.name as string]),
    );
    const causeName = new Map<string, string>(
      (causes ?? []).map((c: any) => [c.id as string, c.name as string]),
    );
    const campaignByPatient = new Map<string, any>();
    for (const c of campaigns ?? []) {
      if (!campaignByPatient.has(c.patient_id)) campaignByPatient.set(c.patient_id, c);
    }

    const group = <T extends { patient_id: string }>(rows: T[] | null) => {
      const map = new Map<string, T[]>();
      for (const row of rows ?? []) {
        const list = map.get(row.patient_id) ?? [];
        list.push(row);
        map.set(row.patient_id, list);
      }
      return map;
    };

    const journeyMap = group(journeys as any[]);
    const updateMap = group(updates as any[]);
    const historyMap = group(history as any[]);

    return (patients ?? []).map((p: any): PatientRecord => {
      const steps = (journeyMap.get(p.id) ?? []).map(
        (j: any): PatientJourneyStep => ({
          stage: j.stage,
          status: j.stage_status,
          date: j.completed_at ?? j.started_at ?? null,
          done: j.stage_status === "Completed",
        }),
      );
      const current =
        [...steps].reverse().find((s) => s.status === "In Progress") ??
        [...steps].reverse().find((s) => s.done);
      const campaign = campaignByPatient.get(p.id);
      return {
        id: p.id,
        displayName: p.display_name,
        reference: p.reference_code,
        condition: p.condition ?? "—",
        medicalSummary: p.medical_summary ?? "",
        ageBand: p.age_band ?? "—",
        gender: p.gender ?? "—",
        urgency: p.urgency,
        status: p.status,
        hospitalId: p.current_hospital_id ?? null,
        hospitalName: p.current_hospital_id
          ? (hospitalName.get(p.current_hospital_id) ?? "—")
          : "Unassigned",
        causeId: campaign?.cause_id ?? null,
        causeName: campaign?.cause_id ? (causeName.get(campaign.cause_id) ?? "—") : "—",
        campaignId: campaign?.id ?? null,
        campaignTitle: campaign?.title ?? "No campaign",
        treatmentStage: current?.stage ?? "Not started",
        lastUpdated: p.updated_at ?? p.created_at,
        journey: steps,
        updates: (updateMap.get(p.id) ?? []).map(
          (u: any): PatientUpdateRecord => ({
            id: u.id,
            author: u.hospital_id ? (hospitalName.get(u.hospital_id) ?? "Clinical team") : "Clinical team",
            date: u.created_at,
            note: u.public_summary ?? u.private_notes ?? "",
          }),
        ),
        hospitalHistory: (historyMap.get(p.id) ?? []).map(
          (h: any): PatientHistoryRecord => ({
            id: h.id,
            hospitalName: hospitalName.get(h.hospital_id) ?? "—",
            reason: h.reason ?? "—",
            from: h.started_on,
            to: h.ended_on ?? null,
          }),
        ),
      };
    });
  });
