import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Info } from "lucide-react";

import { ApplyShell } from "@/components/apply-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePortal } from "@/lib/patient/portal-store";

export const Route = createFileRoute("/apply/location")({
  head: () => ({
    meta: [
      { title: "Where are you receiving treatment? — FundEzer" },
      {
        name: "description",
        content:
          "Select the country and state where you are receiving treatment to begin your FundEzer application.",
      },
      { property: "og:title", content: "Select your treatment location" },
      {
        property: "og:description",
        content: "FundEzer is currently available in Abuja, Nigeria.",
      },
    ],
  }),
  component: LocationStep,
});

const states = [
  "Abuja",
  "Lagos",
  "Kano",
  "Rivers",
  "Kaduna",
  "Enugu",
  "Oyo",
];

function LocationStep() {
  const { flow, setLocation } = usePortal();
  const [country, setCountry] = useState(flow.country || "Nigeria");
  const [state, setState] = useState(flow.state || "");
  const navigate = useNavigate();

  const unsupported = state !== "" && state !== "Abuja";
  const canContinue = country === "Nigeria" && state === "Abuja";

  return (
    <ApplyShell
      step={1}
      title="Where are you receiving treatment?"
      description="FundEzer is currently available in Abuja. Select your location to continue."
      footer={
        <>
          <Button variant="ghost" asChild>
            <Link to="/">Back</Link>
          </Button>
          <Button
            disabled={!canContinue}
            onClick={() => {
              setLocation(country, state);
              navigate({ to: "/apply/hospital" });
            }}
          >
            Continue
          </Button>
        </>
      }
    >
      <div className="space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger id="country">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Nigeria">Nigeria</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            FundEzer currently operates in Nigeria only.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Select value={state} onValueChange={setState}>
            <SelectTrigger id="state">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {states.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {unsupported && (
          <div className="flex gap-3 rounded-xl border border-warning/40 bg-warning-soft p-4">
            <Info className="mt-0.5 size-4 shrink-0 text-warning" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                FundEzer is currently available only in Abuja.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                We're starting with selected hospitals in Abuja and plan to
                expand to more locations.
              </p>
            </div>
          </div>
        )}
      </div>
    </ApplyShell>
  );
}
