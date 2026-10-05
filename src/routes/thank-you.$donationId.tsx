import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Mail, Share2 } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { formatNaira } from "@/lib/data";
import { formatDate } from "@/lib/donor-store";
import { getDonationReceipt } from "@/lib/donor.functions";

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
  const receiptFn = useServerFn(getDonationReceipt);
  const { data, isLoading } = useQuery({
    queryKey: ["donation-receipt", donationId],
    queryFn: () => receiptFn({ data: { donationId } }),
  });

  if (isLoading) {
    return (
      <PageShell>
        <div className="container-page py-24 text-sm text-muted-foreground">Loading…</div>
      </PageShell>
    );
  }

  const donation = data?.donation;
  const campaign = data?.campaign ?? null;
  const cause = data?.cause ?? null;
  const supports = campaign?.public_title ?? cause?.name ?? null;

  if (!donation || !supports) {
    return (
      <PageShell>
        <div className="container-page py-24">
          <h1 className="text-3xl font-semibold text-foreground">Donation not found</h1>
          <p className="mt-3 text-muted-foreground">
            We couldn&rsquo;t find this donation on your account.
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

  const campaignRef = campaign?.slug ?? campaign?.id ?? null;

  return (
    <PageShell>
      <section className="border-b border-border bg-[image:var(--gradient-soft)]">
        <div className="container-page py-16 md:py-20">
          <CheckCircle2 className="h-10 w-10 text-success" />
          <h1 className="mt-5 max-w-2xl text-3xl font-semibold leading-tight text-foreground md:text-4xl">
            Thank you
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-foreground">
            Your donation of{" "}
            <span className="font-semibold">{formatNaira(Number(donation.amount))}</span> has been
            recorded.
          </p>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            You are now supporting <strong>{supports}</strong>. Funds are paid to the treating
            hospital, never to a personal account.
          </p>
        </div>
      </section>

      <div className="container-page grid gap-8 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="surface-card p-6 md:p-8">
          <h2 className="font-display text-lg font-semibold text-foreground">What happens next</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Your donation is held for the campaign and released to the hospital against verified
            milestones. FundEzer publishes donor-safe treatment updates as the patient&rsquo;s care
            progresses — you&rsquo;ll see them in My Impact.
          </p>
          {campaign && (
            <p className="mt-4 text-sm text-muted-foreground">
              Campaign funding goal:{" "}
              <span className="font-semibold text-foreground">
                {formatNaira(Number(campaign.target ?? 0))}
              </span>
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            {campaignRef && campaign && (
              <Link
                to="/my-impact/$campaignId"
                params={{ campaignId: campaignRef }}
                className="rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
              >
                View the patient&rsquo;s journey
              </Link>
            )}
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
            <Mail className="h-4 w-4 text-primary" /> Receipt
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A confirmation has been sent to the email on your donor account.
          </p>
          <dl className="mt-6 space-y-3 text-sm">
            {[
              ["Donation amount", formatNaira(Number(donation.amount))],
              [campaign ? "Campaign" : "Cause", supports],
              ["Date", formatDate(donation.created_at)],
              ["Payment method", donation.payment_method ?? "card"],
              ["Status", donation.payment_status],
              ["Visibility", donation.is_anonymous ? "Anonymous" : "Public"],
              ["Transaction reference", donation.transaction_reference ?? "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right font-semibold capitalize text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/my-impact" className="text-sm font-semibold text-primary hover:underline">
              Go to My Impact →
            </Link>
            <Link to="/wallet" className="text-sm font-semibold text-primary hover:underline">
              Manage account →
            </Link>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
