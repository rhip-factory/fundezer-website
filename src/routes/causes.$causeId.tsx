import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, HeartHandshake, ShieldCheck, Users } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { ProgressBar } from "@/components/site/CampaignCard";
import { formatNaira } from "@/lib/data";
import { causeProgress, getCause } from "@/lib/causes";

export const Route = createFileRoute("/causes/$causeId")({
  loader: ({ params }) => {
    const cause = getCause(params.causeId);
    if (!cause) throw notFound();
    return { cause };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Cause not found — Fundezer website" }, { name: "robots", content: "noindex" }] };
    }
    const { cause } = loaderData;
    const title = `${cause.name} — Support a Cause | Fundezer website`;
    return {
      meta: [
        { title },
        { name: "description", content: cause.description.slice(0, 155) },
        { property: "og:title", content: title },
        { property: "og:description", content: cause.short },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CauseDetail,
  notFoundComponent: CauseMissing,
});

function CauseMissing() {
  return (
    <PageShell>
      <section className="container-page py-24">
        <h1 className="font-display text-3xl font-semibold text-foreground">Cause not found</h1>
        <Link to="/causes" className="mt-4 inline-block text-sm font-semibold text-primary">
          Back to all causes
        </Link>
      </section>
    </PageShell>
  );
}

function CauseDetail() {
  const { cause } = Route.useLoaderData();
  const pct = causeProgress(cause);

  return (
    <PageShell>
      <section className="border-b border-border bg-[image:var(--gradient-soft)]">
        <div className="container-page grid items-center gap-10 py-14 md:py-16 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Cause funding pool
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-[1.1] text-foreground md:text-5xl">
              {cause.name}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {cause.description}
            </p>

            <div className="mt-8 max-w-xl">
              <ProgressBar value={pct} />
              <dl className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
                {[
                  ["Raised", formatNaira(cause.raised)],
                  ["Target", formatNaira(cause.target)],
                  ["Funded", `${pct}%`],
                  ["Patients supported", String(cause.patients)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-1 font-display text-xl font-semibold text-foreground">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/causes/donate/$causeId"
                params={{ causeId: cause.id }}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lift transition-transform hover:-translate-y-0.5"
              >
                Donate to This Cause <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/causes/donate/$causeId"
                params={{ causeId: cause.id }}
                search={{ recurring: true }}
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card px-6 py-3.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft"
              >
                Become a Recurring Donor
              </Link>
            </div>
          </div>

          <img
            src={cause.image}
            alt={`${cause.name} at a FundEzer partner hospital`}
            width={1200}
            height={900}
            className="w-full rounded-3xl object-cover shadow-lift"
          />
        </div>
      </section>

      <section className="container-page grid gap-6 py-14 md:grid-cols-3">
        {[
          {
            icon: HeartHandshake,
            title: "How cause giving works",
            body: `Your donation supports the ${cause.name} funding pool and helps FundEzer support verified patients who meet the eligibility criteria for this cause.`,
          },
          {
            icon: ShieldCheck,
            title: "Still paid to hospitals",
            body: "Money leaves the pool only against approved treatment milestones at verified partner hospitals. It is never paid to an individual.",
          },
          {
            icon: Users,
            title: "Active campaigns",
            body: `${cause.activeCampaigns} verified campaigns are currently drawing from this pool, alongside ${cause.patients} patients already supported.`,
          },
        ].map((item) => (
          <div key={item.title} className="surface-card p-6">
            <item.icon className="h-5 w-5 text-primary" />
            <h2 className="mt-4 font-display text-lg font-semibold text-foreground">
              {item.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </section>

      <section className="container-page pb-16">
        <div className="surface-card flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Prefer to fund one person? You can still choose a specific patient and follow their
            treatment from start to finish.
          </p>
          <Link
            to="/campaigns"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-primary/30 bg-card px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft"
          >
            Find a Patient <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
