import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { PageShell, PageHero } from "@/components/site/PageShell";
import { CampaignCard } from "@/components/site/CampaignCard";
import { campaigns, hospitals } from "@/lib/data";

export const Route = createFileRoute("/campaigns/")({
  component: BrowseCampaigns,
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
  const [query, setQuery] = useState("");
  const [hospital, setHospital] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("urgency");

  const categories = useMemo(
    () => Array.from(new Set(campaigns.map((c) => c.category))),
    [],
  );

  const results = useMemo(() => {
    const rank = { Critical: 0, Urgent: 1, Scheduled: 2 } as const;
    return campaigns
      .filter((c) => {
        const q = query.trim().toLowerCase();
        const matchesQuery =
          !q ||
          c.patient.toLowerCase().includes(q) ||
          c.condition.toLowerCase().includes(q) ||
          c.hospital.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q);
        return (
          matchesQuery &&
          (hospital === "all" || c.hospital === hospital) &&
          (category === "all" || c.category === category)
        );
      })
      .sort((a, b) => {
        if (sort === "urgency") return rank[a.urgency] - rank[b.urgency];
        if (sort === "amount") return b.goal - b.raised - (a.goal - a.raised);
        return b.raised / b.goal - a.raised / a.goal;
      });
  }, [query, hospital, category, sort]);

  const selectClass =
    "w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary";

  return (
    <PageShell>
      <PageHero
        eyebrow="Browse campaigns"
        title="Verified hospitals validate every case and receive every donation"
        description="Search by patient, condition, hospital or location. Your donation is paid to the hospital treating the patient, never into a personal account."
      />

      <section className="container-page py-12">
        <div className="surface-card grid gap-4 p-5 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patient, condition or hospital"
              aria-label="Search campaigns"
              className="w-full rounded-xl border border-input bg-card py-3 pl-11 pr-4 text-sm outline-none focus:border-primary"
            />
          </div>
          <select
            aria-label="Filter by hospital"
            value={hospital}
            onChange={(e) => setHospital(e.target.value)}
            className={selectClass}
          >
            <option value="all">All hospitals</option>
            {hospitals.map((h) => (
              <option key={h.id} value={h.name}>
                {h.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by condition"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={selectClass}
          >
            <option value="all">All conditions</option>
            {categories.map((c) => (
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
            <option value="urgency">Most urgent</option>
            <option value="amount">Largest gap remaining</option>
            <option value="progress">Closest to goal</option>
          </select>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Showing {results.length} of {campaigns.length} campaigns
        </p>

        {results.length === 0 ? (
          <div className="surface-card mt-6 p-12 text-center">
            <p className="font-display text-lg font-semibold text-foreground">No campaigns match</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try a different hospital, condition or search term.
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