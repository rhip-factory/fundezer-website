import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { BadgeCheck, Repeat } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { formatNaira } from "@/lib/data";
import { formatDate } from "@/lib/donor-store";
import { getDonorOverview } from "@/lib/donor.functions";
import { getPublicCampaign } from "@/lib/public-campaigns.functions";

const campaignQuery = (idOrSlug: string) =>
  queryOptions({
    queryKey: ["public-campaign", idOrSlug],
    queryFn: () => getPublicCampaign({ data: { idOrSlug } }),
  });

export const Route = createFileRoute("/_authenticated/my-impact/$campaignId")({
  loader: async ({ params, context }) => {
    const result = await context.queryClient.ensureQueryData(campaignQuery(params.campaignId));
    if (!result) throw notFound();
  },
  component: PatientProgress,
  head: () => ({
    meta: [
      { title: "Patient journey | Fundezer website" },
      {
        name: "description",
        content: "Treatment timeline, verified hospital updates and campaign funding progress.",
      },
      { property: "og:title", content: "Patient journey | Fundezer website" },
      {
        property: "og:description",
        content: "Treatment timeline, verified hospital updates and campaign funding progress.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function PatientProgress() {
  const { campaignId } = Route.useParams();
  const { data } = useSuspenseQuery(campaignQuery(campaignId));
  const overviewFn = useServerFn(getDonorOverview);
  const { data: overview } = useQuery({
    queryKey: ["donor-overview"],
    queryFn: () => overviewFn(),
  });

  if (!data) return null;
  const { campaign, updates } = data;

  const donations = (overview?.donations ?? []).filter((d) => d.campaign_id === campaign.id);
  const given = donations.reduce((s, d) => s + Number(d.amount), 0);
  const first = donations[donations.length - 1];
  const latest = updates[0];

  return (
    <PageShell>
      <section className="border-b border-border bg-[image:var(--gradient-soft)]">
        <div className="container-page py-12">
          <Link to="/my-impact" className="text-sm font-medium text-primary hover:underline">
            ← Back to My Impact
          </Link>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-foreground md:text-4xl">
            {campaign.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {campaign.causeName && <span>Cause: {campaign.causeName}</span>}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-deep">
              {campaign.status === "Completed" ? "Campaign completed" : "Funding now"}
            </span>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-8 py-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-8">
          {latest && (
            <section className="surface-card p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Latest update
              </p>
              <p className="mt-3 text-xs text-muted-foreground">{formatDate(latest.publishedAt)}</p>
              <h2 className="mt-1 font-display text-xl font-semibold text-foreground">
                {latest.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {latest.content}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified by FundEzer
                </span>
              </div>
            </section>
          )}

          <section className="surface-card p-6 md:p-8">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Treatment updates
            </h2>
            {updates.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No updates have been published yet. FundEzer reviews each hospital update and
                publishes a donor-safe version here.
              </p>
            ) : (
              <ol className="mt-6 space-y-6 border-l border-border pl-6">
                {updates.map((u) => (
                  <li key={u.id} className="relative">
                    <span className="absolute -left-[1.9rem] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                    <p className="font-display font-semibold text-foreground">{u.title}</p>
                    <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
                      {formatDate(u.publishedAt)}
                    </p>
                    <p className="mt-1.5 text-sm text-muted-foreground">{u.content}</p>
                  </li>
                ))}
              </ol>
            )}
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
              {first ? `First donated on ${formatDate(first.created_at)}` : "No donation recorded yet"}
            </p>
            {donations.length > 1 && (
              <p className="mt-1 text-sm text-muted-foreground">
                Across {donations.length} donations
              </p>
            )}
          </div>

          <div className="surface-card p-6">
            <h2 className="font-display text-lg font-semibold text-foreground">Campaign goal</h2>
            <p className="mt-4 font-display text-2xl font-semibold text-foreground">
              {formatNaira(campaign.target)}
            </p>
            <p className="text-sm text-muted-foreground">funding goal</p>
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
