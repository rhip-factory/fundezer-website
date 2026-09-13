import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, Lock } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { formatNaira, formatShort } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { donateToCampaign, getDonorOverview } from "@/lib/donor.functions";
import { getPublicCampaign } from "@/lib/public-campaigns.functions";

const campaignQuery = (idOrSlug: string) =>
  queryOptions({
    queryKey: ["public-campaign", idOrSlug],
    queryFn: () => getPublicCampaign({ data: { idOrSlug } }),
  });

export const Route = createFileRoute("/donate/$campaignId")({
  loader: async ({ params, context }) => {
    const result = await context.queryClient.ensureQueryData(campaignQuery(params.campaignId));
    if (!result) throw notFound();
  },
  component: DonatePage,
  head: () => ({
    meta: [
      { title: "Donate | Fundezer website" },
      {
        name: "description",
        content:
          "Donate to a hospital-verified patient campaign. Funds are paid to the treating hospital and you receive verified treatment updates.",
      },
      { property: "og:title", content: "Donate | Fundezer website" },
      {
        property: "og:description",
        content: "Donate to a hospital-verified patient campaign and follow the treatment journey.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const presets = [5000, 10000, 25000, 100000];
const field =
  "mt-1.5 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary";

type Visibility = "public" | "anonymous" | "private";

function DonatePage() {
  const { campaignId } = Route.useParams();
  const { data } = useSuspenseQuery(campaignQuery(campaignId));
  const navigate = useNavigate();
  const { signedIn, loading } = useAuth();
  const donate = useServerFn(donateToCampaign);
  const overviewFn = useServerFn(getDonorOverview);

  const [amount, setAmount] = useState(25000);
  const [source, setSource] = useState<"card" | "transfer">("card");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: overview } = useQuery({
    queryKey: ["donor-overview"],
    queryFn: () => overviewFn(),
    enabled: signedIn,
  });

  useEffect(() => {
    if (!overview?.profile) return;
    setDisplayName((prev) => prev || overview.profile!.full_name);
  }, [overview]);

  if (!data) return null;
  const { campaign } = data;
  const slugOrId = campaign.slug ?? campaign.id;

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
            params={{ campaignId: slugOrId }}
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Back to campaign
          </Link>
          <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-foreground md:text-4xl">
            Donate to {campaign.title}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Your donation is paid to the treating hospital, never to the patient. You&rsquo;ll
            receive a confirmation and verified updates as treatment progresses.
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
              Donations are recorded to your donor account and impact dashboard, so you need a
              FundEzer donor account. It takes under a minute.
            </p>
            <Link
              to="/auth"
              search={{ next: `/donate/${slugOrId}` }}
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
              disabled={submitting || campaign.status === "Completed"}
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
              {campaign.title}
            </h2>
            {campaign.causeName && (
              <p className="mt-1 text-sm font-medium text-primary">{campaign.causeName}</p>
            )}
            <p className="mt-6 font-display text-2xl font-semibold text-foreground">
              {formatNaira(campaign.target)}
            </p>
            <p className="text-sm text-muted-foreground">funding goal</p>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

// Re-exported so fast-refresh keeps a stable module shape.
export { supabase as _donateSupabase };
