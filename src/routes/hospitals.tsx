import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";
import { PageShell, PageHero } from "@/components/site/PageShell";
import { hospitals } from "@/lib/data";

export const Route = createFileRoute("/hospitals")({
  component: Hospitals,
  head: () => ({
    meta: [
      { title: "Partner hospitals in Abuja — Fundezer website" },
      {
        name: "description",
        content:
          "Meet the verified Abuja hospitals that assess patient applications, approve treatment plans and receive FundEzer donations directly.",
      },
      { property: "og:title", content: "Partner hospitals — Fundezer website" },
      {
        property: "og:description",
        content: "Verified Abuja hospitals validating and treating FundEzer patients.",
      },
      { property: "og:url", content: "/hospitals" },
    ],
    links: [{ rel: "canonical", href: "/hospitals" }],
  }),
});

function Hospitals() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Partner hospitals"
        title="Africa's trusted healthcare financing platform"
        description="Hospitals complete licensing, facility and finance verification before they can review applications or receive payments on FundEzer."
      />

      <section className="container-page py-16">
        <div className="grid gap-6 md:grid-cols-2">
          {hospitals.map((h) => (
            <article key={h.id} className="surface-card p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground">{h.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{h.area}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-deep">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified {h.verifiedSince}
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {h.specialties.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5">
                <div>
                  <dt className="text-xs text-muted-foreground">Campaigns hosted</dt>
                  <dd className="font-display text-xl font-semibold text-foreground">
                    {h.campaigns}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Patients treated</dt>
                  <dd className="font-display text-xl font-semibold text-foreground">{h.treated}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>

        <div className="surface-card mt-12 flex flex-wrap items-center justify-between gap-6 p-8">
          <div className="max-w-xl">
            <h2 className="text-2xl font-semibold text-foreground">Are you a hospital in Abuja?</h2>
            <p className="mt-2 text-muted-foreground">
              Recover revenue you currently write off as bad debt, and treat patients who would
              otherwise walk away. Verification takes days, not months.
            </p>
          </div>
          <Link
            to="/contact"
            className="rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft"
          >
            Become a partner
          </Link>
        </div>
      </section>
    </PageShell>
  );
}