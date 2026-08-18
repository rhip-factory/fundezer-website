import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { PageShell, PageHero } from "@/components/site/PageShell";
import { CauseCard } from "@/components/site/CauseCard";
import { causes, causeProgress } from "@/lib/causes";

export const Route = createFileRoute("/causes/")({
  component: CauseDirectory,
  head: () => ({
    meta: [
      { title: "Support a Cause — Fundezer website" },
      {
        name: "description",
        content:
          "Support healthcare causes that matter to you and help verified FundEzer patients access the treatment they need.",
      },
      { property: "og:title", content: "Support a Cause — Fundezer website" },
      {
        property: "og:description",
        content:
          "Give to a healthcare funding pool such as Cancer Care, Kidney Disease or Emergency Care.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/causes" }],
  }),
});

function CauseDirectory() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("progress");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return causes
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.short.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sort === "raised") return b.raised - a.raised;
        if (sort === "patients") return b.patients - a.patients;
        return causeProgress(b) - causeProgress(a);
      });
  }, [query, sort]);

  return (
    <PageShell>
      <PageHero
        eyebrow="Support a cause"
        title="Support a Cause"
        description="Support healthcare causes that matter to you and help verified FundEzer patients access the treatment they need."
      />

      <section className="container-page py-12">
        <div className="surface-card grid gap-4 p-5 md:grid-cols-[2fr_1fr]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search causes, e.g. cancer, dialysis, surgery"
              aria-label="Search causes"
              className="w-full rounded-xl border border-input bg-card py-3 pl-11 pr-4 text-sm outline-none focus:border-primary"
            />
          </div>
          <select
            aria-label="Sort causes"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="progress">Most funded</option>
            <option value="raised">Largest pool</option>
            <option value="patients">Most patients supported</option>
          </select>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((cause) => (
            <CauseCard key={cause.id} cause={cause} />
          ))}
        </div>

        {results.length === 0 && (
          <p className="mt-10 text-sm text-muted-foreground">
            No causes match that search. Try a different term.
          </p>
        )}
      </section>
    </PageShell>
  );
}
