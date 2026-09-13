import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

/**
 * Donor-facing campaign data, served from the existing backend views
 * public.public_campaigns / public.public_campaign_updates.
 * Those views already enforce the publication rule (is_public, consent
 * granted, status Active/Completed, published_at set), so nothing private,
 * unpublished or internal can reach the browser through here.
 */
export type PublicCampaign = {
  id: string;
  slug: string | null;
  title: string;
  story: string;
  imageUrl: string | null;
  target: number;
  status: "Active" | "Completed";
  publishedAt: string | null;
  causeId: string | null;
  causeName: string | null;
};

export type PublicCampaignUpdate = {
  id: string;
  title: string;
  content: string;
  publishedAt: string | null;
};

function publicClient() {
  return createClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

type CampaignRow = Database["public"]["Views"]["public_campaigns"]["Row"];

function toPublicCampaign(row: CampaignRow, causeNames: Map<string, string>): PublicCampaign | null {
  if (!row.id || !row.public_title) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.public_title,
    story: row.public_story ?? "",
    imageUrl: row.public_image_url,
    target: Number(row.target ?? 0),
    status: row.status === "Completed" ? "Completed" : "Active",
    publishedAt: row.published_at,
    causeId: row.cause_id,
    causeName: row.cause_id ? (causeNames.get(row.cause_id) ?? null) : null,
  };
}

async function causeNameMap(sb: ReturnType<typeof publicClient>) {
  const { data } = await sb.from("causes").select("id, name").eq("status", "Active");
  return new Map((data ?? []).map((c) => [c.id, c.name]));
}

export const getPublicCampaigns = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const [{ data, error }, causeNames] = await Promise.all([
    sb.from("public_campaigns").select("*").order("published_at", { ascending: false }),
    causeNameMap(sb),
  ]);
  if (error) throw new Error("Could not load campaigns");
  return (data ?? [])
    .map((row) => toPublicCampaign(row, causeNames))
    .filter((c): c is PublicCampaign => c !== null);
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getPublicCampaign = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ idOrSlug: z.string().min(1).max(120) }).parse(input))
  .handler(async ({ data: input }) => {
    const sb = publicClient();
    const causeNames = await causeNameMap(sb);

    let query = sb.from("public_campaigns").select("*").limit(1);
    query = UUID_RE.test(input.idOrSlug)
      ? query.eq("id", input.idOrSlug)
      : query.eq("slug", input.idOrSlug);
    const { data: rows, error } = await query;
    if (error) throw new Error("Could not load campaign");
    const campaign = rows?.[0] ? toPublicCampaign(rows[0], causeNames) : null;
    if (!campaign) return null;

    const { data: updateRows } = await sb
      .from("public_campaign_updates")
      .select("id, title, content, published_at")
      .eq("campaign_id", campaign.id)
      .order("published_at", { ascending: false });

    const updates: PublicCampaignUpdate[] = (updateRows ?? [])
      .filter((u) => u.id && u.title)
      .map((u) => ({
        id: u.id as string,
        title: u.title as string,
        content: u.content ?? "",
        publishedAt: u.published_at,
      }));

    return { campaign, updates };
  });
