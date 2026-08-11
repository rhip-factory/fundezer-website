import { useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { BadgeCheck, Building2, Lock } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { ProgressBar } from "@/components/site/CampaignCard";
import { campaigns, formatNaira, formatShort, type Campaign } from "@/lib/data";
import { privateName, recordDonation, type NotificationChannel } from "@/lib/donor-store";

export const Route = createFileRoute("/donate/$campaignId")({
  loader: ({ params }): { campaign: Campaign } => {
    const campaign = campaigns.find((c) => c.id === params.campaignId);
    if (!campaign) throw notFound();
    return { campaign };
  },
  component: DonatePage,
  head: ({ loaderData }) => {
    const c = loaderData?.campaign;
    const title = c ? `Donate to ${privateName(c.patient)} | FundEzer` : "Donate | FundEzer";
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
const channels: NotificationChannel[] = ["Email", "SMS", "WhatsApp", "App notifications"];
const field =
  "mt-1.5 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary";

function DonatePage() {
  const { campaign } = Route.useLoaderData();
  const navigate = useNavigate();
  const [amount, setAmount] = useState(25000);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState("card");
  const [prefs, setPrefs] = useState<NotificationChannel[]>(["Email"]);
  const [submitting, setSubmitting] = useState(false);
  const pct = Math.round((campaign.raised / campaign.goal) * 100);

  const togglePref = (c: NotificationChannel) => {
    if (c === "Email") return;
    setPrefs((prev) => (prev.includes(c) ? prev.filter((p) => p !== c) : [...prev, c]));
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail) || trimmedEmail.length > 255) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (name.trim().length < 2 || amount < 500) {
      toast.error("Please enter your name and an amount of at least ₦500.");
      return;
    }
    setSubmitting(true);
    const donation = recordDonation({
      campaignId: campaign.id,
      amount,
      donor: {
        name: name.trim().slice(0, 100),
        email: trimmedEmail,
        phone: phone.trim().slice(0, 30),
        channels: prefs,
      },
    });
    navigate({ to: "/thank-you/$donationId", params: { donationId: donation.id } });
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

          <h2 className="mt-8 font-display text-lg font-semibold text-foreground">Your details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-foreground">
              Full name
              <input
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Nwosu"
                className={field}
              />
            </label>
            <label className="block text-sm font-medium text-foreground">
              Email address
              <input
                type="email"
                required
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={field}
              />
            </label>
            <label className="block text-sm font-medium text-foreground">
              Phone number
              <input
                maxLength={30}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0803 000 0000"
                className={field}
              />
            </label>
            <label className="block text-sm font-medium text-foreground">
              Payment method
              <select value={method} onChange={(e) => setMethod(e.target.value)} className={field}>
                <option value="card">Card</option>
                <option value="transfer">Bank transfer</option>
              </select>
            </label>
          </div>

          <fieldset className="mt-8">
            <legend className="font-display text-lg font-semibold text-foreground">
              How would you like to receive updates?
            </legend>
            <div className="mt-3 space-y-2.5">
              {channels.map((c) => (
                <label
                  key={c}
                  className="flex cursor-pointer items-center gap-3 text-sm text-muted-foreground"
                >
                  <input
                    type="checkbox"
                    checked={prefs.includes(c)}
                    disabled={c === "Email"}
                    onChange={() => togglePref(c)}
                    className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
                  />
                  {c}
                  {c === "Email" && (
                    <span className="text-xs text-muted-foreground/80">(required)</span>
                  )}
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={submitting}
            className="mt-8 w-full rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {submitting ? "Processing…" : `Donate ${formatShort(amount)}`}
          </button>
          <p className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> Prototype checkout — no payment is taken.
          </p>
        </form>

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
              <span className="font-semibold text-foreground">{formatNaira(campaign.raised)}</span>{" "}
              raised of {formatNaira(campaign.goal)} goal
            </p>
            <p className="mt-1 text-sm font-semibold text-primary">{pct}% funded</p>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
