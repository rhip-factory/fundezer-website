import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { PageShell, PageHero } from "@/components/site/PageShell";
import { CampaignCard } from "@/components/site/CampaignCard";
import { getPublicCampaigns } from "@/lib/public-campaigns.functions";

const campaignsQuery = queryOptions({
  queryKey: ["public-campaigns"],
  queryFn: () => getPublicCampaigns(),
});

export const Route = createFileRoute("/campaigns/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(campaignsQuery),
  component: BrowseCampaigns,
  errorComponent: ({ error }) => (
    <PageShell>
      <section className="container-page py-24 text-center">
        <p className="font-display text-xl font-semibold text-foreground">
          Campaigns could not be loaded
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Please try again shortly."}
        </p>
      </section>
    </PageShell>
  ),
  head: () => ({
    meta: [
      { title: "Browse verified campaigns — Fundezer website" },
      {
        name: "description",
        content:
          "Search hospital-verified patient campaigns in Abuja by hospital, condition and amount needed, and donate directly to the treating hospital.",
      },
      { property: "og:title", content: "Browse verified campaigns — Fundezer website" },
      {
        property: "og:description",
        content: "Hospital-verified patient campaigns you can fund with confidence.",
      },
      { property: "og:url", content: "/campaigns" },
    ],
    links: [{ rel: "canonical", href: "/campaigns" }],
  }),
});

function BrowseCampaigns() {
  const { data: campaigns } = useSuspenseQuery(campaignsQuery);
  const [query, setQuery] = useState("");
  const [cause, setCause] = useState("all");
  const [sort, setSort] = useState("newest");

  const causes = useMemo(
    () => Array.from(new Set(campaigns.map((c) => c.causeName).filter((n): n is string => !!n))),
    [campaigns],
  );

  const results = useMemo(() => {
    return campaigns
      .filter((c) => {
        const q = query.trim().toLowerCase();
        const matchesQuery =
          !q ||
          c.title.toLowerCase().includes(q) ||
          c.story.toLowerCase().includes(q) ||
          (c.causeName ?? "").toLowerCase().includes(q);
        return matchesQuery && (cause === "all" || c.causeName === cause);
      })
      .sort((a, b) => {
        if (sort === "amount") return b.target - a.target;
        if (sort === "smallest") return a.target - b.target;
        return (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");
      });
  }, [campaigns, query, cause, sort]);

  const selectClass =
    "w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary";

  return (
    <PageShell>
      <PageHero
        eyebrow="Browse campaigns"
        title="Verified hospitals validate every case and receive every donation"
        description="Search verified patient campaigns. Your donation is paid to the hospital treating the patient, never into a personal account."
      />

      <section className="container-page py-12">
        <div className="surface-card grid gap-4 p-5 md:grid-cols-[2fr_1fr_1fr]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search campaigns"
              aria-label="Search campaigns"
              className="w-full rounded-xl border border-input bg-card py-3 pl-11 pr-4 text-sm outline-none focus:border-primary"
            />
          </div>
          <select
            aria-label="Filter by cause"
            value={cause}
            onChange={(e) => setCause(e.target.value)}
            className={selectClass}
          >
            <option value="all">All causes</option>
            {causes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            aria-label="Sort campaigns"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={selectClass}
          >
            <option value="newest">Recently published</option>
            <option value="amount">Largest goal</option>
            <option value="smallest">Smallest goal</option>
          </select>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Showing {results.length} of {campaigns.length} campaigns
        </p>

        {results.length === 0 ? (
          <div className="surface-card mt-6 p-12 text-center">
            <p className="font-display text-lg font-semibold text-foreground">
              {campaigns.length === 0 ? "No campaigns are live yet" : "No campaigns match"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {campaigns.length === 0
                ? "New hospital-verified campaigns are published after consent and review — check back soon."
                : "Try a different cause or search term."}
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {results.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
