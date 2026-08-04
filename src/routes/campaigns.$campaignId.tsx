import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  BadgeCheck,
  Building2,
  Clock,
  QrCode,
  Share2,
  Users,
  Wallet,
} from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { ProgressBar } from "@/components/site/CampaignCard";
import { campaigns, formatNaira, formatShort, type Campaign } from "@/lib/data";

export const Route = createFileRoute("/campaigns/$campaignId")({
  loader: ({ params }): { campaign: Campaign } => {
    const campaign = campaigns.find((c) => c.id === params.campaignId);
    if (!campaign) throw notFound();
    return { campaign };
  },
  component: CampaignDetail,
  head: ({ loaderData, params }) => {
    const c = loaderData?.campaign;
    const title = c ? `${c.patient} — ${c.condition} | FundEzer` : "Campaign | FundEzer";
    const description = c
      ? `${c.patient} needs ${formatShort(c.goal)} for ${c.condition} at ${c.hospital}. Donate directly to the hospital through FundEzer.`
      : "Hospital-verified patient campaign on FundEzer.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/campaigns/${params.campaignId}` },
      ],
      links: [{ rel: "canonical", href: `/campaigns/${params.campaignId}` }],
    };
  },
});

const presets = [5000, 10000, 25000, 100000];

function CampaignDetail() {
  const { campaign } = Route.useLoaderData();
  const [amount, setAmount] = useState(10000);
  const [method, setMethod] = useState("card");
  const pct = Math.round((campaign.raised / campaign.goal) * 100);
  const paidOut = campaign.updates.length > 1 ? 910000 : 0;

  const minTotal = campaign.costBreakdown.reduce((s, c) => s + c.min, 0);
  const maxTotal = campaign.costBreakdown.reduce((s, c) => s + c.max, 0);

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
            <span className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
              {campaign.category}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> {campaign.daysLeft} days left
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-foreground md:text-4xl">
            {campaign.patient}, {campaign.age} — {campaign.condition}
          </h1>
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" /> {campaign.hospital} · {campaign.location}
          </p>
        </div>
      </div>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-8">
          <section className="surface-card p-7">
            <h2 className="font-display text-xl font-semibold text-foreground">Patient story</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">{campaign.story}</p>
          </section>

          <section className="surface-card p-7">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Diagnosis summary
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {campaign.diagnosisSummary}
            </p>
            <h3 className="mt-8 font-display text-base font-semibold text-foreground">
              Treatment plan
            </h3>
            <ul className="mt-4 space-y-3">
              {campaign.treatmentPlan.map((t) => (
                <li key={t.label} className="flex gap-4 rounded-xl bg-muted p-4">
                  <span className="w-32 shrink-0 text-sm font-semibold text-primary">{t.label}</span>
                  <span className="text-sm text-muted-foreground">{t.detail}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="surface-card p-7">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Hospital cost estimate
            </h2>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 font-semibold">Item</th>
                    <th className="py-3 text-right font-semibold">Minimum</th>
                    <th className="py-3 text-right font-semibold">Maximum</th>
                  </tr>
                </thead>
                <tbody>
                  {campaign.costBreakdown.map((c) => (
                    <tr key={c.item} className="border-b border-border/60">
                      <td className="py-3 text-foreground">{c.item}</td>
                      <td className="py-3 text-right text-muted-foreground">
                        {formatNaira(c.min)}
                      </td>
                      <td className="py-3 text-right text-muted-foreground">
                        {formatNaira(c.max)}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-semibold text-foreground">
                    <td className="py-3">Total</td>
                    <td className="py-3 text-right">{formatNaira(minTotal)}</td>
                    <td className="py-3 text-right">{formatNaira(maxTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 rounded-xl bg-primary-soft p-4 text-sm text-primary-deep">
              Campaign goal of {formatNaira(campaign.goal)} reflects the hospital maximum plus a
              contingency of about 20%, approved by {campaign.hospital}.
            </p>
          </section>

          <section className="surface-card p-7">
            <h2 className="font-display text-xl font-semibold text-foreground">Treatment updates</h2>
            <ol className="mt-5 space-y-5 border-l border-border pl-6">
              {campaign.updates.map((u) => (
                <li key={u.title} className="relative">
                  <span className="absolute -left-[1.9rem] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {u.date}
                  </p>
                  <p className="mt-1 font-display font-semibold text-foreground">{u.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{u.detail}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Donate panel */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="surface-card p-6">
            <p className="font-display text-3xl font-semibold text-foreground">
              {formatNaira(campaign.raised)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              raised of {formatNaira(campaign.goal)} goal
            </p>
            <div className="mt-4">
              <ProgressBar value={pct} />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold text-primary">{pct}% funded</span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> {campaign.donors} donors
              </span>
            </div>

            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                toast.success(
                  `Thank you! ${formatNaira(amount)} will be paid to ${campaign.hospital}.`,
                  { description: "A receipt and treatment updates will be sent to your email." },
                );
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
                className="w-full rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
              >
                Donate {formatShort(amount)}
              </button>
              <p className="text-center text-xs text-muted-foreground">
                Paid directly to {campaign.hospital}. You receive a receipt and treatment updates.
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

          <div className="surface-card mt-6 p-6">
            <h3 className="inline-flex items-center gap-2 font-display text-base font-semibold text-foreground">
              <Wallet className="h-4 w-4 text-primary" /> Campaign wallet
            </h3>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ["Campaign goal", formatNaira(campaign.goal)],
                ["Funds raised", formatNaira(campaign.raised)],
                ["Payments made to hospital", formatNaira(paidOut)],
                ["Available balance", formatNaira(campaign.raised - paidOut)],
                ["Remaining to goal", formatNaira(campaign.goal - campaign.raised)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-semibold text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}