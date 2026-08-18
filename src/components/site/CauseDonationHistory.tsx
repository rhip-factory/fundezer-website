import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { HeartHandshake, Repeat } from "lucide-react";
import { formatNaira } from "@/lib/data";
import { loadCauseDonations, type CauseDonation } from "@/lib/causes";

export function CauseDonationHistory() {
  const [donations, setDonations] = useState<CauseDonation[]>([]);

  useEffect(() => {
    setDonations(loadCauseDonations());
  }, []);

  const totalGiven = donations.reduce((sum, d) => sum + d.amount, 0);
  const causesSupported = new Set(donations.map((d) => d.causeId)).size;
  const recurringGifts = donations.filter((d) => d.recurring).length;

  return (
    <section className="container-page pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold text-foreground">Cause donations</h2>
        <Link to="/causes" className="text-sm font-semibold text-primary hover:underline">
          Support a cause →
        </Link>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-6 sm:max-w-xl">
        {[
          ["Given to causes", formatNaira(totalGiven)],
          ["Causes supported", String(causesSupported)],
          ["Recurring gifts", String(recurringGifts)],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-display text-2xl font-semibold text-foreground">{value}</dd>
          </div>
        ))}
      </dl>

      {donations.length === 0 ? (
        <div className="surface-card mt-8 p-10 text-center">
          <HeartHandshake className="mx-auto h-9 w-9 text-primary" />
          <p className="mt-4 font-display text-lg font-semibold text-foreground">
            You haven&rsquo;t given to a cause yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Cause donations go into a healthcare funding pool such as Cancer Care or Emergency Care,
            supporting verified patients who meet the eligibility criteria.
          </p>
          <Link
            to="/causes"
            className="mt-6 inline-flex rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft"
          >
            Support a Cause
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {donations.map((d) => (
            <li
              key={d.id}
              className="surface-card flex flex-wrap items-center justify-between gap-3 p-5"
            >
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                  {d.recurring ? (
                    <>
                      <Repeat className="h-3.5 w-3.5" /> Recurring donation
                    </>
                  ) : (
                    "Cause donation"
                  )}
                </p>
                <p className="mt-1 font-display text-lg font-semibold text-foreground">
                  {d.causeName}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(d.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })} ·{" "}
                  {d.method} · {d.anonymous ? "Anonymous" : "Public"} · Ref {d.id}
                </p>
              </div>
              <p className="font-display text-lg font-semibold text-foreground">
                {formatNaira(d.amount)}
                {d.recurring ? "/month" : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
