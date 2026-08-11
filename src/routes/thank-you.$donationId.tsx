import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCircle2, Mail, Share2 } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { ProgressBar } from "@/components/site/CampaignCard";
import { campaigns, formatNaira } from "@/lib/data";
import { formatDate, getDonation, privateName, type Donation } from "@/lib/donor-store";

export const Route = createFileRoute("/thank-you/$donationId")({
  component: ThankYou,
  head: () => ({
    meta: [
      { title: "Donation confirmed | Fundezer website" },
      {
        name: "description",
        content:
          "Your FundEzer donation is confirmed. Follow the patient's treatment journey and receive verified hospital updates.",
      },
      { property: "og:title", content: "Donation confirmed | Fundezer website" },
      {
        property: "og:description",
        content: "Your FundEzer donation is confirmed. Follow the patient's treatment journey.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function ThankYou() {
  const { donationId } = Route.useParams();
  const [donation, setDonation] = useState<Donation | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDonation(getDonation(donationId) ?? null);
    setReady(true);
  }, [donationId]);

  const campaign = donation ? campaigns.find((c) => c.id === donation.campaignId) : undefined;

  if (!ready) {
    return (
      <PageShell>
        <div className="container-page py-24 text-sm text-muted-foreground">Loading…</div>
      </PageShell>
    );
  }

  if (!donation || !campaign) {
    return (
      <PageShell>
        <div className="container-page py-24">
          <h1 className="text-3xl font-semibold text-foreground">Donation not found</h1>
          <p className="mt-3 text-muted-foreground">
            We couldn&rsquo;t find this donation on this device.
          </p>
          <Link
            to="/campaigns"
            className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Browse campaigns
          </Link>
        </div>
      </PageShell>
    );
  }

  const pct = Math.round((campaign.raised / campaign.goal) * 100);

  return (
    <PageShell>
      <section className="border-b border-border bg-[image:var(--gradient-soft)]">
        <div className="container-page py-16 md:py-20">
          <CheckCircle2 className="h-10 w-10 text-primary" />
          <h1 className="mt-5 max-w-2xl text-3xl font-semibold leading-tight text-foreground md:text-4xl">
            Thank you, {donation.donor.name.split(" ")[0]}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-foreground">
            Your donation of{" "}
            <span className="font-semibold">{formatNaira(donation.amount)}</span> has been received.
          </p>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            You are now supporting <strong>{privateName(campaign.patient)}</strong> in receiving
            treatment at <strong>{campaign.hospital}</strong>.
          </p>
        </div>
      </section>

      <div className="container-page grid gap-8 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="surface-card p-6 md:p-8">
          <h2 className="font-display text-lg font-semibold text-foreground">Campaign progress</h2>
          <p className="mt-4 font-display text-2xl font-semibold text-foreground">
            {formatNaira(campaign.raised)}
          </p>
          <p className="text-sm text-muted-foreground">raised of {formatNaira(campaign.goal)}</p>
          <div className="mt-4">
            <ProgressBar value={pct} />
          </div>
          <p className="mt-3 text-sm font-semibold text-primary">{pct}% funded</p>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            The hospital has verified this campaign and FundEzer will provide updates as the
            patient&rsquo;s treatment progresses.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/my-impact/$campaignId"
              params={{ campaignId: campaign.id }}
              className="rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
            >
              View patient&rsquo;s journey
            </Link>
            <button
              type="button"
              onClick={() => toast.success("Campaign link copied to your clipboard.")}
              className="inline-flex items-center gap-2 rounded-full border border-input px-6 py-3.5 text-sm font-semibold text-foreground hover:border-primary/40"
            >
              <Share2 className="h-4 w-4" /> Share this campaign
            </button>
          </div>
        </div>

        <aside className="surface-card p-6 md:p-8">
          <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold text-foreground">
            <Mail className="h-4 w-4 text-primary" /> Receipt sent
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A confirmation has been sent to {donation.donor.email}.
          </p>
          <dl className="mt-6 space-y-3 text-sm">
            {[
              ["Donation amount", formatNaira(donation.amount)],
              ["Patient", privateName(campaign.patient)],
              ["Hospital", campaign.hospital],
              ["Date", formatDate(donation.date)],
              ["Transaction reference", donation.reference],
              ["Status", donation.status],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right font-semibold text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
          <Link
            to="/my-impact"
            className="mt-8 inline-flex text-sm font-semibold text-primary hover:underline"
          >
            Go to My Impact →
          </Link>
        </aside>
      </div>
    </PageShell>
  );
}
