import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, CheckCircle2, Lock, Repeat, ShieldCheck, Wallet } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { formatNaira } from "@/lib/data";
import {
  getDonorOverview,
  markNotificationsRead,
  saveRecurringPlan,
  topUpWallet,
  updateDonorProfile,
} from "@/lib/donor.functions";

export const Route = createFileRoute("/_authenticated/wallet")({
  component: WalletPage,
  head: () => ({
    meta: [
      { title: "Donor wallet — Fundezer website" },
      {
        name: "description",
        content:
          "Fund your FundEzer donor wallet, review every wallet transaction, manage recurring giving and set how your donations appear.",
      },
      { property: "og:title", content: "Donor wallet — Fundezer website" },
      { property: "og:description", content: "Your FundEzer donor wallet, transactions and recurring giving." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const field =
  "mt-1.5 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary";
const presets = [5000, 10000, 25000, 100000];
const channels = ["Email", "SMS", "WhatsApp", "App notifications"];

function newKey(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function WalletPage() {
  const overview = useServerFn(getDonorOverview);
  const topUp = useServerFn(topUpWallet);
  const savePlan = useServerFn(saveRecurringPlan);
  const saveProfile = useServerFn(updateDonorProfile);
  const markRead = useServerFn(markNotificationsRead);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["donor-overview"], queryFn: () => overview() });

  const [amount, setAmount] = useState(10000);
  const [planAmount, setPlanAmount] = useState(10000);
  const [frequency, setFrequency] = useState<"weekly" | "monthly" | "quarterly">("monthly");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [prefs, setPrefs] = useState<string[]>(["Email"]);
  const [visibility, setVisibility] = useState<"public" | "anonymous" | "private">("public");
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    if (!data?.profile) return;
    setFullName(data.profile.full_name);
    setPhone(data.profile.phone ?? "");
    const plan = data.plans[0];
    if (plan) {
      setPlanAmount(Number(plan.amount));
      setFrequency(plan.frequency.toLowerCase() as "weekly" | "monthly" | "quarterly");
    }
  }, [data]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["donor-overview"] });

  const topUpMutation = useMutation({
    mutationFn: () => topUp({ data: { amount, idempotencyKey: newKey("top") } }),
    onSuccess: () => {
      toast.success("Wallet topped up.");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const planMutation = useMutation({
    mutationFn: (status?: "active" | "paused" | "cancelled") =>
      savePlan({ data: status ? { amount: planAmount, frequency, status } : { amount: planAmount, frequency } }),
    onSuccess: () => {
      toast.success("Recurring giving updated.");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const profileMutation = useMutation({
    mutationFn: () =>
      saveProfile({
        data: {
          fullName,
          phone,
          channels: prefs,
          defaultVisibility: visibility,
          consentCommunications: consent,
        },
      }),
    onSuccess: () => {
      toast.success("Preferences saved.");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const unread = useMemo(
    () => (data?.notifications ?? []).filter((n) => !n.read_at).length,
    [data],
  );

  const plan = data?.plans[0];

  return (
    <PageShell>
      <section className="border-b border-border bg-[image:var(--gradient-soft)]">
        <div className="container-page py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Donor wallet
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-[1.1] text-foreground md:text-5xl">
            Your wallet
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground md:text-lg">
            Fund your wallet once, then give to verified campaigns whenever you are ready. Balances
            are calculated on our servers from an immutable transaction record.
          </p>
          <div className="mt-8 flex flex-wrap items-end gap-8">
            <div>
              <p className="text-xs text-muted-foreground">Available balance</p>
              <p className="font-display text-4xl font-semibold text-foreground">
                {isLoading ? "…" : formatNaira(data?.balance ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total given</p>
              <p className="font-display text-2xl font-semibold text-foreground">
                {formatNaira(data?.totalGiven ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Patients supported</p>
              <p className="font-display text-2xl font-semibold text-foreground">
                {data?.patients ?? 0}
              </p>
            </div>
            <Link
              to="/my-impact"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft"
            >
              View my impact
            </Link>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-8 py-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-8">
          <div className="surface-card p-6 md:p-8">
            <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <Wallet className="h-5 w-5 text-primary" /> Add funds
            </h2>
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
                  {formatNaira(p)}
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
            <button
              type="button"
              disabled={topUpMutation.isPending}
              onClick={() => topUpMutation.mutate()}
              className="mt-5 w-full rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-60"
            >
              {topUpMutation.isPending ? "Processing…" : `Add ${formatNaira(amount)}`}
            </button>
            <p className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" /> Pilot checkout — the ledger is real, no card is charged.
            </p>
          </div>

          <div className="surface-card p-6 md:p-8">
            <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <Repeat className="h-5 w-5 text-primary" /> Recurring giving
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Set aside an amount you are comfortable giving regularly. Recurring funds land in your
              wallet so you decide which patient they support.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-foreground">
                Amount (₦)
                <input
                  type="number"
                  min={500}
                  value={planAmount}
                  onChange={(e) => setPlanAmount(Number(e.target.value))}
                  className={field}
                />
              </label>
              <label className="block text-sm font-medium text-foreground">
                Frequency
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as typeof frequency)}
                  className={field}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </label>
            </div>
            {plan && plan.status !== "Cancelled" && (
              <p className="mt-3 text-sm text-muted-foreground">
                Current plan: <span className="font-semibold text-foreground">{plan.status}</span> —
                next on {plan.next_run_on ?? "schedule pending"}
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => planMutation.mutate("active")}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft"
              >
                {plan && plan.status !== "Cancelled" ? "Update plan" : "Start recurring giving"}
              </button>
              {plan && plan.status === "Active" && (
                <button
                  type="button"
                  onClick={() => planMutation.mutate("paused")}
                  className="rounded-full border border-input px-5 py-2.5 text-sm font-semibold text-foreground"
                >
                  Pause
                </button>
              )}
              {plan && plan.status !== "Cancelled" && (
                <button
                  type="button"
                  onClick={() => planMutation.mutate("cancelled")}
                  className="rounded-full border border-input px-5 py-2.5 text-sm font-semibold text-muted-foreground"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          <div className="surface-card p-6 md:p-8">
            <h2 className="font-display text-lg font-semibold text-foreground">Wallet transactions</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Transaction records are permanent and cannot be edited or deleted.
            </p>
            <ul className="mt-5 divide-y divide-border">
              {(data?.transactions ?? []).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.description || t.kind}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleString("en-GB")} · {t.reference}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      t.direction === "credit" ? "text-success" : "text-foreground"
                    }`}
                  >
                    {t.direction === "credit" ? "+" : "−"}
                    {formatNaira(Number(t.amount))}
                  </span>
                </li>
              ))}
              {!isLoading && (data?.transactions ?? []).length === 0 && (
                <li className="py-6 text-sm text-muted-foreground">No transactions yet.</li>
              )}
            </ul>
          </div>
        </div>

        <aside className="space-y-8">
          <div className="surface-card p-6">
            <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <Bell className="h-5 w-5 text-primary" /> Notifications
              {unread > 0 && (
                <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary-deep">
                  {unread} new
                </span>
              )}
            </h2>
            <ul className="mt-4 space-y-3">
              {(data?.notifications ?? []).slice(0, 6).map((n) => (
                <li key={n.id} className="rounded-xl border border-border p-3">
                  <p className="text-sm font-semibold text-foreground">{n.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
                </li>
              ))}
              {(data?.notifications ?? []).length === 0 && (
                <li className="text-sm text-muted-foreground">Nothing yet.</li>
              )}
            </ul>
            {unread > 0 && (
              <button
                type="button"
                onClick={async () => {
                  await markRead({});
                  refresh();
                }}
                className="mt-4 text-sm font-semibold text-primary hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="surface-card p-6">
            <h2 className="font-display text-lg font-semibold text-foreground">Donor milestones</h2>
            <ul className="mt-4 space-y-3">
              {(data?.milestones ?? []).map((m) => (
                <li key={m.label} className="flex items-center gap-3">
                  <CheckCircle2
                    className={`h-4 w-4 ${m.achieved ? "text-success" : "text-muted-foreground/40"}`}
                  />
                  <span className="flex-1 text-sm text-foreground">{m.label}</span>
                  <span className="text-xs text-muted-foreground">{m.progress}%</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="surface-card p-6">
            <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <ShieldCheck className="h-5 w-5 text-primary" /> Privacy & preferences
            </h2>
            <label className="mt-4 block text-sm font-medium text-foreground">
              Display name on public donations
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} className={field} />
            </label>
            <label className="mt-3 block text-sm font-medium text-foreground">
              Phone (never shown publicly)
              <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} className={field} />
            </label>
            <label className="mt-3 block text-sm font-medium text-foreground">
              Default donation visibility
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as typeof visibility)}
                className={field}
              >
                <option value="public">Public — show my display name</option>
                <option value="anonymous">Anonymous — show the amount only</option>
                <option value="private">Private — hide the donation entirely</option>
              </select>
            </label>
            <fieldset className="mt-4">
              <legend className="text-sm font-medium text-foreground">Update channels</legend>
              <div className="mt-2 space-y-2">
                {channels.map((c) => (
                  <label key={c} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={prefs.includes(c)}
                      disabled={c === "Email"}
                      onChange={() =>
                        setPrefs((prev) =>
                          prev.includes(c) ? prev.filter((p) => p !== c) : [...prev, c],
                        )
                      }
                      className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
                    />
                    {c}
                    {c === "Email" && <span className="text-xs">(required)</span>}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="mt-4 flex items-start gap-3 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
              />
              I consent to receiving FundEzer communications about campaigns I support.
            </label>
            <button
              type="button"
              onClick={() => profileMutation.mutate()}
              className="mt-5 w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft"
            >
              Save preferences
            </button>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
