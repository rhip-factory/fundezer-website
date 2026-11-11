import { createFileRoute } from "@tanstack/react-router";
import { Stethoscope } from "lucide-react";

import { relativeTime, usePortal } from "@/lib/patient/portal-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal/treatment")({
  head: () => ({
    meta: [
      { title: "Treatment record — FundEzer" },
      {
        name: "description",
        content:
          "Read the treatment notes your hospital has shared, including surgery dates and recovery milestones.",
      },
      { property: "og:title", content: "Treatment record" },
      {
        property: "og:description",
        content: "Hospital-verified updates about your treatment.",
      },
    ],
  }),
  component: TreatmentPage,
});

function TreatmentPage() {
  const { portal } = usePortal();
  const patient = portal?.patient ?? null;
  const updates = portal?.treatmentUpdates ?? [];
  const journey = portal?.journey ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
          TREATMENT OVERVIEW
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Diagnosis</p>
            <p className="mt-1 text-sm text-foreground">
              {patient?.condition ??
                "Your diagnosis appears here once your hospital records it."}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Treatment plan</p>
            <p className="mt-1 text-sm text-foreground">
              {patient?.medicalSummary ??
                "Your treatment plan appears here once your hospital records it."}
            </p>
          </div>
        </div>
      </section>

      {journey.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
            TREATMENT STAGES
          </h2>
          <ul className="mt-4 space-y-3">
            {journey.map((step) => (
              <li
                key={step.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-background px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {step.stage}
                  </p>
                  {step.hospitalName && (
                    <p className="text-xs text-muted-foreground">
                      {step.hospitalName}
                    </p>
                  )}
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
                    step.stageStatus === "Completed"
                      ? "bg-success-soft text-success"
                      : step.stageStatus === "In Progress"
                        ? "bg-primary-soft text-primary"
                        : "bg-secondary text-muted-foreground",
                  )}
                >
                  {step.stageStatus}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
          UPDATES FROM YOUR HOSPITAL
        </h2>
        {updates.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Your hospital has not shared any treatment updates yet.
          </p>
        ) : (
          <ul className="mt-5 space-y-4">
            {updates.map((u) => (
              <li
                key={u.id}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 rounded-xl border border-border bg-background p-4"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft">
                  <Stethoscope className="size-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {relativeTime(u.publishedAt ?? u.createdAt)}
                    {u.hospitalName ? ` · ${u.hospitalName}` : ""}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {u.summary}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-5 text-xs text-muted-foreground">
          Only your verified hospital can add treatment updates.
        </p>
      </section>
    </div>
  );
}
