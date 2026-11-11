import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface TrendPoint {
  month: string;
  patient: number;
  cause: number;
}

export interface DashboardDonation {
  id: string;
  donor: string;
  type: string;
  amount: number;
  date: string;
  payment: string;
  allocation: string;
}

export interface DashboardTransfer {
  id: string;
  reference: string;
  serviceName: string;
  urgency: string;
  status: string;
  requestedAt: string;
}

export interface DashboardCause {
  id: string;
  name: string;
  pool: number;
  fundingTarget: number;
  totalDonations: number;
  patientsSupported: number;
}

export interface DashboardPayload {
  raised: number;
  donationCount: number;
  activeCampaigns: number;
  totalCampaigns: number;
  patients: number;
  activeHospitals: number;
  totalHospitals: number;
  pendingTransfers: number;
  recurringDonors: number;
  series: TrendPoint[];
  recentDonations: DashboardDonation[];
  queue: DashboardTransfer[];
  topCauses: DashboardCause[];
}

type Ctx = { supabase: any; userId: string; claims: Record<string, unknown> };

const OPEN = ["Submitted", "Under Review", "Receiving Hospital Pending"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const getDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DashboardPayload> => {
    const supabase = (context as unknown as Ctx).supabase;

    const [
      { data: donations, error },
      { data: campaigns },
      { data: hospitals },
      { data: patients },
      { data: transfers },
      { data: causes },
      { data: plans },
      { data: services },
    ] = await Promise.all([
      supabase
        .from("donations")
        .select(
          "id, donor_name, is_anonymous, amount, donation_type, payment_status, allocation_status, campaign_id, cause_id, created_at",
        )
        .order("created_at", { ascending: false }),
      supabase.from("campaigns").select("id, status, cause_id, patient_id"),
      supabase.from("hospitals").select("id, status"),
      supabase.from("patients").select("id"),
      supabase
        .from("transfers")
        .select("id, reference_code, service_id, urgency, status, requested_at")
        .order("requested_at", { ascending: false }),
      supabase.from("causes").select("id, name, status, funding_target"),
      supabase.from("recurring_plans").select("id, status"),
      supabase.from("services").select("id, name"),
    ]);
    if (error) throw new Error(error.message);

    const allDonations = donations ?? [];
    const paid = allDonations.filter((d: any) => d.payment_status === "Paid");
    const serviceName = new Map<string, string>(
      (services ?? []).map((s: any) => [s.id as string, s.name as string]),
    );

    // Trend: last 7 calendar months
    const now = new Date();
    const buckets: TrendPoint[] = [];
    const index = new Map<string, TrendPoint>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
      const point: TrendPoint = { month: MONTHS[d.getUTCMonth()]!, patient: 0, cause: 0 };
      buckets.push(point);
      index.set(key, point);
    }
    for (const d of paid) {
      const dt = new Date(d.created_at);
      const point = index.get(`${dt.getUTCFullYear()}-${dt.getUTCMonth()}`);
      if (!point) continue;
      if (d.cause_id && !d.campaign_id) point.cause += Number(d.amount ?? 0);
      else point.patient += Number(d.amount ?? 0);
    }

    // Cause pools
    const campaignCause = new Map<string, string>();
    const campaignPatient = new Map<string, string>();
    for (const c of campaigns ?? []) {
      if (c.cause_id) campaignCause.set(c.id, c.cause_id);
      if (c.patient_id) campaignPatient.set(c.id, c.patient_id);
    }
    const poolByCause = new Map<string, { pool: number; count: number; patients: Set<string> }>();
    for (const d of paid) {
      const causeId = d.cause_id ?? (d.campaign_id ? campaignCause.get(d.campaign_id) : null);
      if (!causeId) continue;
      const entry = poolByCause.get(causeId) ?? { pool: 0, count: 0, patients: new Set<string>() };
      entry.pool += Number(d.amount ?? 0);
      entry.count += 1;
      const patientId = d.campaign_id ? campaignPatient.get(d.campaign_id) : null;
      if (patientId) entry.patients.add(patientId);
      poolByCause.set(causeId, entry);
    }

    const topCauses: DashboardCause[] = (causes ?? [])
      .filter((c: any) => c.status === "Active")
      .map((c: any) => {
        const entry = poolByCause.get(c.id);
        return {
          id: c.id,
          name: c.name,
          pool: entry?.pool ?? 0,
          fundingTarget: Number(c.funding_target ?? 0),
          totalDonations: entry?.count ?? 0,
          patientsSupported: entry?.patients.size ?? 0,
        };
      })
      .sort((a: DashboardCause, b: DashboardCause) => b.pool - a.pool)
      .slice(0, 5);

    return {
      raised: paid.reduce((s: number, d: any) => s + Number(d.amount ?? 0), 0),
      donationCount: allDonations.length,
      activeCampaigns: (campaigns ?? []).filter((c: any) => c.status === "Active").length,
      totalCampaigns: (campaigns ?? []).length,
      patients: (patients ?? []).length,
      activeHospitals: (hospitals ?? []).filter((h: any) => h.status === "active").length,
      totalHospitals: (hospitals ?? []).length,
      pendingTransfers: (transfers ?? []).filter((t: any) => OPEN.includes(t.status)).length,
      recurringDonors: (plans ?? []).filter((p: any) => p.status === "Active").length,
      series: buckets,
      topCauses,
      recentDonations: allDonations.slice(0, 6).map(
        (d: any): DashboardDonation => ({
          id: d.id,
          donor: d.is_anonymous ? "Anonymous donor" : (d.donor_name ?? "Donor"),
          type: `${d.donation_type} Donation`,
          amount: Number(d.amount ?? 0),
          date: d.created_at,
          payment: d.payment_status,
          allocation: d.allocation_status,
        }),
      ),
      queue: (transfers ?? [])
        .filter((t: any) => OPEN.includes(t.status))
        .slice(0, 5)
        .map(
          (t: any): DashboardTransfer => ({
            id: t.id,
            reference: t.reference_code,
            serviceName: t.service_id ? (serviceName.get(t.service_id) ?? "—") : "—",
            urgency: t.urgency,
            status: t.status,
            requestedAt: t.requested_at,
          }),
        ),
    };
  });
