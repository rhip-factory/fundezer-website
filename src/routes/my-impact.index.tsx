import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { HeartHandshake } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { ProgressBar } from "@/components/site/CampaignCard";
import { formatNaira } from "@/lib/data";
import { journeyFor, privateName, supportedCampaigns } from "@/lib/donor-store";

export const Route = createFileRoute("/my-impact/")({
  component: MyImpact,
  head: () => ({
    meta: [
      { title: "My Impact — patients you support | FundEzer" },
      {
        name: "description",
        content:
          "See every patient you have supported on FundEzer: total given, campaign funding progress and current treatment stage.",
      },
      { property: "og:title", content: "My Impact — patients you support | FundEzer" },
      {
        property: "og:description",
        content: "Total given, campaigns supported and live treatment progress for your donations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function MyImpact() {
  const [items, setItems] = useState<ReturnType<typeof supportedCampaigns>>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setItems(supportedCampaigns());
    sync();
    setReady(true);
    window.addEventListener("fundezer:donor-updated", sync);
    return () => window.removeEventListener("fundezer:donor-updated", sync);
  }, []);

  const totalGiven = items.reduce((sum, i) => sum + i.given, 0);
  const active = items.filter((i) => i.campaign.raised < i.campaign.goal).length;
  const completed = items.length - active;

  return (
    <PageShell>
      <section className="border-b border-border bg-[image:var(--gradient-soft)]">
        <div className="container-page py-14 md:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Your donor dashboard
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-[1.1] text-foreground md:text-5xl">
            My Impact
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground md:text-lg">
            Every patient you have supported, their campaign funding progress and where their
            treatment currently stands.
          </p>

          <dl className="mt-10 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              ["Total given", formatNaira(totalGiven)],
              ["Patients supported", String(items.length)],
              ["Active campaigns", String(active)],
              ["Completed campaigns", String(completed)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 font-display text-2xl font-semibold text-foreground">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="container-page py-14">
        <h2 className="font-display text-2xl font-semibold text-foreground">Supported patients</h2>

        {ready && items.length === 0 && (
          <div className="surface-card mt-8 p-10 text-center">
            <HeartHandshake className="mx-auto h-9 w-9 text-primary" />
            <p className="mt-4 font-display text-lg font-semibold text-foreground">
              You haven&rsquo;t supported a patient yet
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              When you donate to a verified campaign, the patient appears here and you&rsquo;ll be
              able to follow their treatment journey.
            </p>
            <Link
              to="/campaigns"
              className="mt-6 inline-flex rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft"
            >
              Browse campaigns
            </Link>
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {items.map(({ campaign, given }) => {
            const pct = Math.round((campaign.raised / campaign.goal) * 100);
            const journey = journeyFor(campaign);
            return (
              <div key={campaign.id} className="surface-card p-6">
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {privateName(campaign.patient)}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{campaign.hospital}</p>
                <p className="mt-1 text-sm text-muted-foreground">{campaign.condition}</p>
                <div className="mt-5">
                  <ProgressBar value={pct} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {formatNaira(campaign.raised)} / {formatNaira(campaign.goal)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="font-semibold text-primary">{pct}% funded</span>
                  <span className="text-muted-foreground">
                    Current stage:{" "}
                    <span className="font-semibold text-foreground">{journey.stage}</span>
                  </span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  You gave <span className="font-semibold text-foreground">{formatNaira(given)}</span>
                </p>
                <Link
                  to="/my-impact/$campaignId"
                  params={{ campaignId: campaign.id }}
                  className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
                >
                  View progress
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}
