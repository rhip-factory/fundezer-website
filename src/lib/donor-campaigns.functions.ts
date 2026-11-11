import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type PublicCampaign = {
  id: string;
  name: string;
  shortName: string;
  condition: string;
  hospital: string;
  location: string;
  raised: number;
  target: number;
  percent: number;
  stage: string;
  update: string;
  updateDate: string;
  category: string;
  story: string;
  status: string;
};

export type PublicCampaignUpdate = {
  id: string;
  campaignId: string;
  campaignName: string;
  title: string;
  content: string;
  publishedAt: string | null;
};

function publicClient() {
  return createClient<Database>(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" }) : "";

function categoryFor(percent: number, status: string, createdAt: string) {
  if (status === "Completed") return "Completed";
  if (percent >= 75) return "Nearly Funded";
  const days = (Date.now() - new Date(createdAt).getTime()) / 86_400_000;
  if (days <= 30) return "Recently Verified";
  if (percent < 25) return "Urgent";
  return "Recommended";
}

// Publicly visible campaigns only. Base rows are read with the publishable key so
// the public RLS policy decides what is visible; institutional labels and donation
// totals for those same campaigns are aggregated server-side.
export const listPublicCampaigns = createServerFn({ method: "GET" }).handler(async (): Promise<PublicCampaign[]> => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("id, public_title, title, public_story, target, status, treatment_stage, hospital_id, cause_id, created_at, published_at")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(60);
  if (error) throw error;
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const ids = rows.map((row) => row.id);
  const hospitalIds = [...new Set(rows.map((row) => row.hospital_id).filter((id): id is string => Boolean(id)))];
  const causeIds = [...new Set(rows.map((row) => row.cause_id).filter((id): id is string => Boolean(id)))];

  const [{ data: paid }, { data: hospitals }, { data: causes }, { data: updates }] = await Promise.all([
    supabaseAdmin.from("donations").select("campaign_id, amount").in("campaign_id", ids).eq("payment_status", "Paid"),
    hospitalIds.length
      ? supabaseAdmin.from("hospitals").select("id, name, city, state").in("id", hospitalIds)
      : Promise.resolve({ data: [] as { id: string; name: string; city: string; state: string }[] }),
    causeIds.length
      ? supabaseAdmin.from("causes").select("id, name").in("id", causeIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    supabaseAdmin
      .from("campaign_updates")
      .select("campaign_id, content, published_at, status")
      .in("campaign_id", ids)
      .eq("status", "Published")
      .order("published_at", { ascending: false }),
  ]);

  const raisedBy = new Map<string, number>();
  for (const row of paid ?? []) {
    if (!row.campaign_id) continue;
    raisedBy.set(row.campaign_id, (raisedBy.get(row.campaign_id) ?? 0) + Number(row.amount));
  }
  const hospitalBy = new Map((hospitals ?? []).map((h) => [h.id, h]));
  const causeBy = new Map((causes ?? []).map((c) => [c.id, c.name]));
  const latestUpdate = new Map<string, { content: string; published_at: string | null }>();
  for (const row of updates ?? []) {
    if (row.campaign_id && !latestUpdate.has(row.campaign_id)) {
      latestUpdate.set(row.campaign_id, { content: row.content, published_at: row.published_at });
    }
  }

  return rows.map((row) => {
    const target = Number(row.target) || 0;
    const raised = raisedBy.get(row.id) ?? 0;
    const percent = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;
    const hospital = row.hospital_id ? hospitalBy.get(row.hospital_id) : undefined;
    const update = latestUpdate.get(row.id);
    const name = row.public_title || row.title;
    return {
      id: row.id,
      name,
      shortName: name.length > 34 ? `${name.slice(0, 32)}…` : name,
      condition: (row.cause_id ? causeBy.get(row.cause_id) : undefined) ?? "Healthcare treatment",
      hospital: hospital?.name ?? "Verified partner hospital",
      location: hospital ? [hospital.city, hospital.state].filter(Boolean).join(", ") : "Nigeria",
      raised,
      target,
      percent,
      stage: `Stage ${row.treatment_stage}`,
      update: update?.content ?? "No public update has been shared yet.",
      updateDate: formatDate(update?.published_at ?? row.published_at),
      category: categoryFor(percent, row.status, row.created_at),
      story: row.public_story ?? "This campaign's public story has not been shared yet.",
      status: row.status,
    };
  });
});

export const getPublicCampaignUpdates = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ campaignId: z.string().uuid().optional() }).parse(data ?? {}))
  .handler(async ({ data }): Promise<PublicCampaignUpdate[]> => {
    const supabase = publicClient();
    let query = supabase
      .from("campaign_updates")
      .select("id, campaign_id, title, content, published_at")
      .eq("status", "Published")
      .order("published_at", { ascending: false })
      .limit(30);
    if (data.campaignId) query = query.eq("campaign_id", data.campaignId);
    const { data: rows, error } = await query;
    if (error) throw error;
    const list = rows ?? [];
    const campaignIds = [...new Set(list.map((row) => row.campaign_id))];
    const names = new Map<string, string>();
    if (campaignIds.length) {
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("id, public_title, title")
        .in("id", campaignIds);
      for (const campaign of campaigns ?? []) {
        names.set(campaign.id, campaign.public_title || campaign.title);
      }
    }
    return list.map((row) => ({
      id: row.id,
      campaignId: row.campaign_id,
      campaignName: names.get(row.campaign_id) ?? "Campaign",
      title: row.title ?? "Campaign update",
      content: row.content,
      publishedAt: row.published_at,
    }));
  });


export const listActiveCauses = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("causes")
    .select("id, name, description, funding_target")
    .eq("status", "Active")
    .order("name");
  if (error) throw error;
  return data ?? [];
});
