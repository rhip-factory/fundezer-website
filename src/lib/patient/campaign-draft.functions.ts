import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Drafts a campaign name and a short, privacy-safe public description from
 * the patient's story. Personal identifiers are never included.
 */
export const draftCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const raw = (input ?? {}) as Record<string, unknown>;
    const story = typeof raw["story"] === "string" ? raw["story"].trim().slice(0, 6000) : "";
    if (!story) throw new Error("Your story is needed to draft the campaign.");
    return { story };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { title: "", summary: "", error: "AI is not configured." };

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Lovable-API-Key": apiKey,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "You write fundraising campaign copy for patients. Output ONLY JSON: {\"title\": string, \"summary\": string}. " +
                "title: max 8 words, warm, no names. summary: 2-3 sentences, max 60 words, describing the medical need and why support matters. " +
                "NEVER include names, ages, dates of birth, addresses, phone numbers, ID numbers, family member names, hospital or doctor names, or other identifying details.",
            },
            {
              role: "user",
              content: data.story,
            },
          ],
        }),
      });

      if (!res.ok) {
        throw new Error(`AI gateway responded with ${res.status}`);
      }

      const json = await res.json();
      const content = json?.choices?.[0]?.message?.content ?? "";
      const match = content.match(/\{[\s\S]*\}/);
      const parsed = match ? (JSON.parse(match[0]) as { title?: string; summary?: string }) : {};
      return {
        title: String(parsed.title ?? "").slice(0, 160),
        summary: String(parsed.summary ?? "").slice(0, 1000),
        error: null as string | null,
      };
    } catch (err) {
      console.error("[campaign-draft] failed", err);
      return { title: "", summary: "", error: "We could not draft your campaign right now." };
    }
  });
