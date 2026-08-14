import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, Building2, Lock, Wallet } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { ProgressBar } from "@/components/site/CampaignCard";
import { campaigns, formatNaira, formatShort, type Campaign } from "@/lib/data";
import { privateName } from "@/lib/donor-store";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { donateToCampaign, getDonorOverview } from "@/lib/donor.functions";

export const Route = createFileRoute("/donate/$campaignId")({
  loader: ({ params }): { campaign: Campaign } => {
    const campaign = campaigns.find((c) => c.id === params.campaignId);
    if (!campaign) throw notFound();
    return { campaign };
  },
  component: DonatePage,
  head: ({ loaderData }) => {
    const c = loaderData?.campaign;
    const title = c ? `Donate to ${privateName(c.patient)} | Fundezer website` : "Donate | Fundezer website";
    const description = c
      ? `Support ${privateName(c.patient)}'s treatment at ${c.hospital}. Funds are paid to the hospital and you receive verified treatment updates.`
      : "Donate to a hospital-verified patient campaign and follow the treatment journey.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
});

const presets = [5000, 10000, 25000, 100000];
const field =
  "mt-1.5 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary";

type Visibility = "public" | "anonymous" | "private";

function DonatePage() {
  const { campaign } = Route.useLoaderData();
  const navigate = useNavigate();
  const { signedIn, loading } = useAuth();
  const donate = useServerFn(donateToCampaign);
  const overviewFn = useServerFn(getDonorOverview);

  const [amount, setAmount] = useState(25000);
  const [source, setSource] = useState<"wallet" | "card" | "transfer">("wallet");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: overview } = useQuery({
    queryKey: ["donor-overview"],
    queryFn: () => overviewFn(),
    enabled: signedIn,
  });

  const { data: totals } = useQuery({
    queryKey: ["campaign-totals", campaign.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("campaign_totals", { _campaign_id: campaign.id });
      return data?.[0] ?? null;
    },
  });

  useEffect(() => {
    if (!overview?.profile) return;
    setDisplayName((prev) => prev || overview.profile!.full_name);
    setVisibility(overview.profile.default_donation_visibility as Visibility);
  }, [overview]);

  const raised = Number(totals?.raised ?? campaign.raised);
  const pct = Math.min(100, Math.round((raised / campaign.goal) * 100));
  const balance = overview?.balance ?? 0;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (amount < 500) {
      toast.error("Please enter an amount of at least ₦500.");
      return;
    }
    if (visibility === "public" && displayName.trim().length < 2) {
      toast.error("Add the name you'd like shown, or choose anonymous.");
      return;
    }
    if (source === "wallet" && balance < amount) {
      toast.error("Your wallet balance is too low. Add funds first.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await donate({
        data: {
          campaignId: campaign.id,
          amount,
          visibility,
          displayName: displayName.trim().slice(0, 60),
          message: message.trim().slice(0, 500),
          source,
          idempotencyKey: `don-${crypto.randomUUID()}`,
        },
      });
      navigate({ to: "/thank-you/$donationId", params: { donationId: result.donationId } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Donation could not be completed.");
      setSubmitting(false);
    }
  };

  return (
    <PageShell>
      <div className="border-b border-border bg-[image:var(--gradient-soft)]">
        <div className="container-page py-10">
          <Link
            to="/campaigns/$campaignId"
            params={{ campaignId: campaign.id }}
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Back to campaign
          </Link>
          <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-foreground md:text-4xl">
            Donate to {privateName(campaign.patient)}&rsquo;s treatment
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Your donation is paid to {campaign.hospital}, never to the patient. You&rsquo;ll receive
            a confirmation and verified updates as treatment progresses.
          </p>
        </div>
      </div>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        {!loading && !signedIn ? (
          <div className="surface-card p-8">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Sign in to donate
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Donations are recorded to your donor wallet and impact dashboard, so you need a
              FundEzer donor account. It takes under a minute.
            </p>
            <Link
              to="/auth"
              search={{ next: `/donate/${campaign.id}` }}
              className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft"
            >
              Sign in or create an account
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="surface-card p-6 md:p-8">
            <h2 className="font-display text-lg font-semibold text-foreground">Your donation</h2>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(p)}
                  className={`rounded-lg border px-2 py-2.5 text-xs font-semibold transition-colors ${
                    amount === p
                      ? "border-primary bg-primary-soft text-primary-deep"
                      : "border-input text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {formatShort(p)}
                </button>
              ))}
            </div>
            <label className="mt-4 block text-sm font-medium text-foreground">
              Amount (₦)
              <input
                type="number"
                min={500}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className={field}
              />
            </label>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              How would you like to pay?
            </h2>
            <div className="mt-3 space-y-2.5">
              {(
                [
                  ["wallet", `Donor wallet — balance ${formatNaira(balance)}`],
                  ["card", "Card"],
                  ["transfer", "Bank transfer"],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="flex cursor-pointer items-center gap-3 text-sm text-muted-foreground">
                  <input
                    type="radio"
                    name="source"
                    checked={source === value}
                    onChange={() => setSource(value)}
                    className="h-4 w-4 accent-[hsl(var(--primary))]"
                  />
                  {label}
                </label>
              ))}
            </div>
            {source === "wallet" && (
              <p className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Wallet className="h-3.5 w-3.5" />{" "}
                <Link to="/wallet" className="font-semibold text-primary hover:underline">
                  Add funds to your wallet
                </Link>
              </p>
            )}

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
              How should your donation appear?
            </h2>
            <div className="mt-3 space-y-2.5">
              {(
                [
                  ["public", "Public — show my display name and amount"],
                  ["anonymous", "Anonymous — show the amount as an anonymous donor"],
                  ["private", "Private — do not list my donation at all"],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="flex cursor-pointer items-center gap-3 text-sm text-muted-foreground">
                  <input
                    type="radio"
                    name="visibility"
                    checked={visibility === value}
                    onChange={() => setVisibility(value)}
                    className="h-4 w-4 accent-[hsl(var(--primary))]"
                  />
                  {label}
                </label>
              ))}
            </div>
            {visibility === "public" && (
              <label className="mt-4 block text-sm font-medium text-foreground">
                Display name
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={60}
                  placeholder="Ada N."
                  className={field}
                />
              </label>
            )}
            <label className="mt-4 block text-sm font-medium text-foreground">
              Message of support (optional)
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                rows={3}
                className={field}
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="mt-8 w-full rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {submitting ? "Processing…" : `Donate ${formatShort(amount)}`}
            </button>
            <p className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" /> Your contact and payment details are never shown
              publicly.
            </p>
          </form>
        )}

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="surface-card p-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-deep">
              <BadgeCheck className="h-3.5 w-3.5" /> Hospital verified
            </span>
            <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
              {privateName(campaign.patient)}, {campaign.age}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{campaign.condition}</p>
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4 text-primary" /> {campaign.hospital}
            </p>
            <div className="mt-6">
              <ProgressBar value={pct} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{formatNaira(raised)}</span>{" "}
              raised of {formatNaira(campaign.goal)} goal
            </p>
            <p className="mt-1 text-sm font-semibold text-primary">{pct}% funded</p>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
