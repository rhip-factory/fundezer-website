import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { BadgeCheck, Building2, Circle, CircleDot, CheckCircle2, Repeat } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { ProgressBar } from "@/components/site/CampaignCard";
import { campaigns, formatNaira, type Campaign } from "@/lib/data";
import {
  donationsForCampaign,
  formatDate,
  journeyFor,
  privateName,
  type Donation,
} from "@/lib/donor-store";

export const Route = createFileRoute("/_authenticated/my-impact/$campaignId")({
  loader: ({ params }): { campaign: Campaign } => {
    const campaign = campaigns.find((c) => c.id === params.campaignId);
    if (!campaign) throw notFound();
    return { campaign };
  },
  component: PatientProgress,
  head: ({ loaderData }) => {
    const c = loaderData?.campaign;
    const title = c
      ? `${privateName(c.patient)}'s journey | Fundezer website`
      : "Patient journey | Fundezer website";
    return {
      meta: [
        { title },
        {
          name: "description",
          content: c
            ? `Treatment timeline, hospital updates and campaign funding progress for ${privateName(c.patient)} at ${c.hospital}.`
            : "Treatment timeline and verified hospital updates for the patient you supported.",
        },
        { property: "og:title", content: title },
        {
          property: "og:description",
          content: "Treatment timeline, verified hospital updates and campaign funding progress.",
        },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
});

function PatientProgress() {
  const { campaign } = Route.useLoaderData();
  const overviewFn = useServerFn(getDonorOverview);
  const { data } = useQuery({ queryKey: ["donor-overview"], queryFn: () => overviewFn() });

  const donations = (data?.donations ?? []).filter((d) => d.campaign_id === campaign.id);
  const journey = journeyFor(campaign);
  const pct = Math.round((campaign.raised / campaign.goal) * 100);
  const given = donations.reduce((s, d) => s + Number(d.amount), 0);
  const first = donations[donations.length - 1];


  return (
    <PageShell>
      <section className="border-b border-border bg-[image:var(--gradient-soft)]">
        <div className="container-page py-12">
          <Link to="/my-impact" className="text-sm font-medium text-primary hover:underline">
            ← Back to My Impact
          </Link>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-foreground md:text-4xl">
            {privateName(campaign.patient)}&rsquo;s journey
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> {campaign.hospital}
            </span>
            <span>Campaign: {campaign.condition}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-deep">
              Campaign status: {journey.campaignStatus}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-deep">
              Treatment: {journey.stage}
            </span>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-8 py-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-8">
          {journey.latestUpdate && (
            <section className="surface-card p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Latest update
              </p>
              <p className="mt-3 text-xs text-muted-foreground">{journey.latestUpdate.date}</p>
              <h2 className="mt-1 font-display text-xl font-semibold text-foreground">
                {journey.latestUpdate.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {journey.latestUpdate.body}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-5 text-xs text-muted-foreground">
                <span>
                  Update provided by{" "}
                  <span className="font-semibold text-foreground">
                    {journey.latestUpdate.hospital}
                  </span>
                </span>
                {journey.latestUpdate.verified && (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
                    <BadgeCheck className="h-3.5 w-3.5" /> Verified by FundEzer
                  </span>
                )}
              </div>
            </section>
          )}

          <section className="surface-card p-6 md:p-8">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Treatment timeline
            </h2>
            <ol className="mt-6 space-y-6 border-l border-border pl-6">
              {journey.timeline.map((step) => (
                <li key={step.label} className="relative">
                  <span className="absolute -left-[2.05rem] top-0.5 bg-background">
                    {step.state === "done" ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : step.state === "current" ? (
                      <CircleDot className="h-4 w-4 text-primary" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </span>
                  <p
                    className={`font-display font-semibold ${
                      step.state === "pending" ? "text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
                    {step.date}
                  </p>
                  {step.detail && (
                    <p className="mt-1.5 text-sm text-muted-foreground">{step.detail}</p>
                  )}
                </li>
              ))}
            </ol>
            <p className="mt-8 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
              Hospitals submit updates through their FundEzer dashboard. FundEzer reviews each
              update and publishes a donor-safe version — clinical records and personal details are
              never shared with donors.
            </p>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="surface-card p-6">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Your contribution
            </h2>
            <p className="mt-4 font-display text-3xl font-semibold text-foreground">
              {formatNaira(given)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {first ? `First donated on ${formatDate(first.date)}` : "No donation on this device"}
            </p>
            {donations.length > 1 && (
              <p className="mt-1 text-sm text-muted-foreground">
                Across {donations.length} donations
              </p>
            )}
          </div>

          <div className="surface-card p-6">
            <h2 className="font-display text-lg font-semibold text-foreground">Campaign progress</h2>
            <p className="mt-4 font-display text-2xl font-semibold text-foreground">
              {formatNaira(campaign.raised)}
            </p>
            <p className="text-sm text-muted-foreground">
              of {formatNaira(campaign.goal)} goal
            </p>
            <div className="mt-4">
              <ProgressBar value={pct} />
            </div>
            <p className="mt-3 text-sm font-semibold text-primary">{pct}% funded</p>
          </div>

          <div className="surface-card p-6">
            <h2 className="font-display text-base font-semibold text-foreground">
              Keep the impact going
            </h2>
            <Link
              to="/campaigns"
              className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
            >
              Support another patient
            </Link>
            <Link
              to="/partner-donor"
              hash="join"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-input px-5 py-3 text-sm font-semibold text-foreground hover:border-primary/40"
            >
              <Repeat className="h-4 w-4" /> Become a recurring donor
            </Link>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
