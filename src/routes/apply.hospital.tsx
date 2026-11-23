import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, Check, MapPin, Search } from "lucide-react";

import { ApplyShell } from "@/components/apply-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hospitals, usePortal } from "@/lib/patient/portal-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/apply/hospital")({
  head: () => ({
    meta: [
      { title: "Select your hospital — FundEzer" },
      {
        name: "description",
        content:
          "Choose the verified Abuja partner hospital where you are receiving treatment.",
      },
      { property: "og:title", content: "Select your hospital" },
      {
        property: "og:description",
        content: "Choose a verified FundEzer partner hospital in Abuja.",
      },
    ],
  }),
  component: HospitalStep,
});

function HospitalStep() {
  const { flow, setHospital, partnerHospitals, hospitalsLoading, hospitalsError } =
    usePortal();
  const [selected, setSelected] = useState<string | null>(flow.hospitalId);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const results = partnerHospitals.filter((h) =>
    h.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <ApplyShell
      step={1}
      title="Select your hospital"
      description="Choose the hospital where you are receiving or have been advised to receive treatment."
      footer={
        <>
          <Button variant="ghost" asChild>
            <Link to="/apply/location">Back</Link>
          </Button>
          <Button
            disabled={!selected}
            onClick={() => {
              if (selected) setHospital(selected);
              navigate({ to: "/apply/registration" });
            }}
          >
            Continue
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search hospitals"
            aria-label="Search hospitals"
            className="pl-9"
          />
        </div>

        <div className="space-y-3">
          {results.map((h) => {
            const active = selected === h.id;
            return (
              <button
                key={h.id}
                onClick={() => setSelected(h.id)}
                aria-pressed={active}
                className={cn(
                  "w-full rounded-2xl border bg-card p-4 text-left transition-colors sm:p-5",
                  active
                    ? "border-primary bg-primary-soft/50 ring-1 ring-primary"
                    : "border-border hover:border-primary-muted",
                )}
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-card-foreground">
                      {h.name}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0" /> {h.city}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {h.specialty}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-success">
                      <BadgeCheck className="size-3.5" /> Verified Hospital
                    </span>
                  </div>
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full border",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border",
                    )}
                  >
                    {active && <Check className="size-3.5" />}
                  </span>
                </div>
              </button>
            );
          })}

          {hospitalsLoading && (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Loading partner hospitals…
            </p>
          )}
          {hospitalsError && (
            <p className="p-8 text-center text-sm text-destructive">{hospitalsError}</p>
          )}
          {!hospitalsLoading && !hospitalsError && results.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="text-sm font-medium text-foreground">
                {partnerHospitals.length === 0
                  ? "No partner hospitals are available yet"
                  : "No hospitals match that search"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Only hospitals registered on the FundEzer Hospital Portal appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </ApplyShell>
  );
}
