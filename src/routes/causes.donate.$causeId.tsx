import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { formatNaira } from "@/lib/data";
import { getCause, newReference, saveCauseDonation, type CauseDonation } from "@/lib/causes";

export const Route = createFileRoute("/causes/donate/$causeId")({
  validateSearch: (search: Record<string, unknown>) => ({
    recurring: search["recurring"] === true || search["recurring"] === "true",
  }),
  loader: ({ params }) => {
    const cause = getCause(params.causeId);
    if (!cause) throw notFound();
    return { cause };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `Donate to ${loaderData.cause.name} — Fundezer website`
          : "Donate to a cause — Fundezer website",
      },
      {
        name: "description",
        content:
          "Choose an amount, give once or monthly, and support a FundEzer healthcare funding pool.",
      },
      { property: "og:title", content: "Donate to a cause — Fundezer website" },
      {
        property: "og:description",
        content: "Support a FundEzer healthcare funding pool in a few taps.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CauseDonate,
  notFoundComponent: () => (
    <PageShell>
      <section className="container-page py-24">
        <h1 className="font-display text-3xl font-semibold text-foreground">Cause not found</h1>
        <Link to="/causes" className="mt-4 inline-block text-sm font-semibold text-primary">
          Back to all causes
        </Link>
      </section>
    </PageShell>
  ),
});

const presets = [5000, 10000, 25000, 50000];
const methods = ["Card", "Bank transfer", "Wallet"] as const;

function CauseDonate() {
  const { cause } = Route.useLoaderData();
  const { recurring: recurringDefault } = Route.useSearch();

  const [amount, setAmount] = useState(25000);
  const [custom, setCustom] = useState("");
  const [recurring, setRecurring] = useState(recurringDefault);
  const [anonymous, setAnonymous] = useState(false);
  const [method, setMethod] = useState<(typeof methods)[number]>("Card");
  const [receipt, setReceipt] = useState<CauseDonation | null>(null);

  const value = custom ? Number(custom.replace(/[^\d]/g, "")) || 0 : amount;
  const valid = value >= 500;

  function submit() {
    if (!valid) return;
    const donation: CauseDonation = {
      id: newReference(),
      causeId: cause.id,
      causeName: cause.name,
      amount: value,
      recurring,
      anonymous,
      method,
      createdAt: new Date().toISOString(),
    };
    saveCauseDonation(donation);
    setReceipt(donation);
    window.scrollTo({ top: 0 });
  }

  if (receipt) {
    return (
      <PageShell>
        <section className="container-page max-w-2xl py-16">
          <div className="surface-card p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success text-success-foreground">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h1 className="mt-6 font-display text-3xl font-semibold text-foreground">
              Donation Successful
            </h1>
            <p className="mt-3 text-muted-foreground">Thank you for supporting {cause.name}.</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Your {formatNaira(receipt.amount)} donation has been added to the {cause.name} funding
              pool and will help support verified FundEzer patients who meet the eligibility
              criteria for this cause.
            </p>

            <dl className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                ["Cause", cause.name],
                ["Amount", formatNaira(receipt.amount) + (receipt.recurring ? " / month" : "")],
                ["Donation type", receipt.recurring ? "Recurring donation" : "One-time donation"],
                ["Date", new Date(receipt.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })],
                ["Reference", receipt.id],
                ["Visibility", receipt.anonymous ? "Anonymous" : "Public"],
              ].map(([label, val]) => (
                <div key={label} className="rounded-xl border border-border p-4">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">{val}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/my-impact"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
              >
                View My Impact <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/causes"
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card px-5 py-3 text-sm font-semibold text-primary hover:bg-primary-soft"
              >
                Support Another Cause
              </Link>
            </div>
          </div>
        </section>
      </PageShell>
    );
  }

  const optionClass = (active: boolean) =>
    `rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
      active
        ? "border-primary bg-primary-soft text-primary-deep"
        : "border-input bg-card text-foreground hover:border-primary/40"
    }`;

  return (
    <PageShell>
      <section className="container-page max-w-3xl py-12">
        <Link to="/causes/$causeId" params={{ causeId: cause.id }} className="text-sm text-muted-foreground hover:text-primary">
          ← Back to {cause.name}
        </Link>

        <h1 className="mt-4 font-display text-3xl font-semibold text-foreground">
          Donate to {cause.name}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Your donation supports the {cause.name} funding pool and helps FundEzer support verified
          patients who meet the eligibility criteria for this cause.
        </p>

        <div className="mt-8 surface-card p-6">
          <h2 className="text-sm font-semibold text-foreground">Choose an amount</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setAmount(p);
                  setCustom("");
                }}
                className={optionClass(!custom && amount === p)}
              >
                {formatNaira(p)}
              </button>
            ))}
          </div>
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            inputMode="numeric"
            placeholder="Custom amount (₦)"
            aria-label="Custom amount"
            className="mt-3 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:border-primary"
          />

          <h2 className="mt-8 text-sm font-semibold text-foreground">How often?</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setRecurring(false)} className={optionClass(!recurring)}>
              One-time
            </button>
            <button type="button" onClick={() => setRecurring(true)} className={optionClass(recurring)}>
              Monthly / Recurring
            </button>
          </div>

          <h2 className="mt-8 text-sm font-semibold text-foreground">Visibility</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setAnonymous(false)} className={optionClass(!anonymous)}>
              Show my name
            </button>
            <button type="button" onClick={() => setAnonymous(true)} className={optionClass(anonymous)}>
              Give anonymously
            </button>
          </div>

          <h2 className="mt-8 text-sm font-semibold text-foreground">Payment method</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {methods.map((m) => (
              <button key={m} type="button" onClick={() => setMethod(m)} className={optionClass(method === m)}>
                {m}
              </button>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between rounded-xl bg-secondary p-4">
            <span className="text-sm text-muted-foreground">You are giving</span>
            <span className="font-display text-xl font-semibold text-foreground">
              {formatNaira(valid ? value : 0)}
              {recurring ? " / month" : ""}
            </span>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={!valid}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            Continue to confirmation <ArrowRight className="h-4 w-4" />
          </button>
          {!valid && (
            <p className="mt-2 text-xs text-muted-foreground">Minimum donation is ₦500.</p>
          )}

          <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Prototype checkout — no card is charged. Funds released from this pool are paid to
            verified partner hospitals against approved treatment milestones.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
