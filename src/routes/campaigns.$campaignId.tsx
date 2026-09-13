import { useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, CalendarDays, QrCode, Share2 } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { formatNaira, formatShort } from "@/lib/data";
import { getPublicCampaign } from "@/lib/public-campaigns.functions";

const campaignQuery = (idOrSlug: string) =>
  queryOptions({
    queryKey: ["public-campaign", idOrSlug],
    queryFn: () => getPublicCampaign({ data: { idOrSlug } }),
  });

export const Route = createFileRoute("/campaigns/$campaignId")({
  loader: async ({ params, context }) => {
    const result = await context.queryClient.ensureQueryData(campaignQuery(params.campaignId));
    if (!result) throw notFound();
  },
  component: CampaignDetail,
  errorComponent: ({ error }) => (
    <PageShell>
      <section className="container-page py-24 text-center">
        <p className="font-display text-xl font-semibold text-foreground">
          This campaign could not be loaded
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Please try again shortly."}
        </p>
        <Link to="/campaigns" className="mt-6 inline-block text-sm font-semibold text-primary">
          ← Back to campaigns
        </Link>
      </section>
    </PageShell>
  ),
  notFoundComponent: () => (
    <PageShell>
      <section className="container-page py-24 text-center">
        <p className="font-display text-xl font-semibold text-foreground">Campaign not found</p>
        <p className="mt-2 text-sm text-muted-foreground">
          It may have closed, or the link may be incorrect.
        </p>
        <Link to="/campaigns" className="mt-6 inline-block text-sm font-semibold text-primary">
          ← Browse live campaigns
        </Link>
      </section>
    </PageShell>
  ),
  head: ({ params }) => ({
    meta: [
      { title: "Campaign | Fundezer website" },
      {
        name: "description",
        content: "Hospital-verified patient campaign on FundEzer. Donations go directly to the treating hospital.",
      },
      { property: "og:title", content: "Support this patient campaign | Fundezer website" },
      {
        property: "og:description",
        content: "Hospital-verified patient campaign on FundEzer. Donations go directly to the treating hospital.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: `/campaigns/${params.campaignId}` },
    ],
    links: [{ rel: "canonical", href: `/campaigns/${params.campaignId}` }],
  }),
});

const presets = [5000, 10000, 25000, 100000];

function formatPublishedAt(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function CampaignDetail() {
  const { campaignId } = Route.useParams();
  const { data } = useSuspenseQuery(campaignQuery(campaignId));
  const navigate = useNavigate();
  const [amount, setAmount] = useState(10000);
  const [method, setMethod] = useState("card");

  if (!data) return null;
  const { campaign, updates } = data;
  const slugOrId = campaign.slug ?? campaign.id;

  return (
    <PageShell>
      <div className="border-b border-border bg-[image:var(--gradient-soft)]">
        <div className="container-page py-10">
          <Link to="/campaigns" className="text-sm font-medium text-primary hover:underline">
            ← Back to campaigns
          </Link>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-deep">
              <BadgeCheck className="h-3.5 w-3.5" /> Hospital verified
            </span>
            {campaign.causeName && (
              <span className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
                {campaign.causeName}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" /> Published {formatPublishedAt(campaign.publishedAt)}
            </span>
            {campaign.status === "Completed" && (
              <span className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-primary">
                Campaign completed
              </span>
            )}
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-foreground md:text-4xl">
            {campaign.title}
          </h1>
        </div>
      </div>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-8">
          {campaign.imageUrl && (
            <img
              src={campaign.imageUrl}
              alt={campaign.title}
              className="w-full rounded-3xl object-cover shadow-soft"
            />
          )}

          <section className="surface-card p-7">
            <h2 className="font-display text-xl font-semibold text-foreground">Patient story</h2>
            <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">
              {campaign.story}
            </p>
          </section>

          {updates.length > 0 && (
            <section className="surface-card p-7">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Treatment updates
              </h2>
              <ol className="mt-5 space-y-5 border-l border-border pl-6">
                {updates.map((u) => (
                  <li key={u.id} className="relative">
                    <span className="absolute -left-[1.9rem] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {formatPublishedAt(u.publishedAt)}
                    </p>
                    <p className="mt-1 font-display font-semibold text-foreground">{u.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{u.content}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        {/* Donate panel */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="surface-card p-6">
            <p className="font-display text-3xl font-semibold text-foreground">
              {formatNaira(campaign.target)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">funding goal</p>

            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                navigate({
                  to: "/donate/$campaignId",
                  params: { campaignId: slugOrId },
                });
              }}
            >
              <div className="grid grid-cols-4 gap-2">
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
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">Amount (₦)</span>
                <input
                  type="number"
                  min={500}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">Payment method</span>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:border-primary"
                >
                  <option value="card">Card</option>
                  <option value="transfer">Bank transfer</option>
                </select>
              </label>
              <button
                type="submit"
                disabled={campaign.status === "Completed"}
                className="w-full rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                Donate {formatShort(amount)}
              </button>
              <p className="text-center text-xs text-muted-foreground">
                Paid directly to the treating hospital. You receive a receipt and treatment updates.
              </p>
            </form>

            <div className="mt-6 flex gap-2 border-t border-border pt-5">
              <button
                type="button"
                onClick={() => toast.success("Campaign link copied to your clipboard.")}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-input px-4 py-2.5 text-xs font-semibold text-foreground hover:border-primary/40"
              >
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
              <button
                type="button"
                onClick={() => toast("QR code ready for print and posters.")}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-input px-4 py-2.5 text-xs font-semibold text-foreground hover:border-primary/40"
              >
                <QrCode className="h-3.5 w-3.5" /> QR code
              </button>
            </div>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
