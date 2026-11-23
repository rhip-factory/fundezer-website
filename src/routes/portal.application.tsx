import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, Check, Circle, Loader2 } from "lucide-react";

import { getMyApplication } from "@/lib/patient/applications.functions";
import { usePortal } from "@/lib/patient/portal-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal/application")({
  head: () => ({
    meta: [
      { title: "Application status — FundEzer" },
      {
        name: "description",
        content:
          "Follow each stage of your FundEzer application, from submission through hospital verification to a live campaign.",
      },
      { property: "og:title", content: "Application status" },
      {
        property: "og:description",
        content: "Every stage of your application in one timeline.",
      },
    ],
  }),
  component: ApplicationPage,
});

const stages = [
  {
    title: "Application submitted",
    body: "Your application and documents were received by FundEzer.",
  },
  {
    title: "Hospital verification",
    body: "Your hospital reviews your diagnosis and treatment plan.",
  },
  {
    title: "Application approved",
    body: "Your application is approved and prepared for publishing.",
  },
  {
    title: "Campaign live",
    body: "Your campaign is published and accepting donations.",
  },
  {
    title: "Funding complete",
    body: "Your campaign reaches its goal and funds are released to the hospital.",
  },
];

/** Maps the database application status onto the five-stage patient timeline. */
function stageIndexFor(status: string) {
  switch (status) {
    case "Submitted":
      return 0;
    case "Under Review":
    case "Information Requested":
      return 1;
    case "Verified":
      return 2;
    case "Approved":
      return 3;
    case "Rejected":
    case "Withdrawn":
      return 1;
    default:
      return 0;
  }
}

function formatDate(value: string | null) {
  if (!value) return "Pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Pending";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function ApplicationPage() {
  const { profile, hospitalName } = usePortal();
  const fetchApplication = useServerFn(getMyApplication);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["my-application"],
    queryFn: () => fetchApplication({}),
  });

  if (isPending) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <Loader2 className="mx-auto size-6 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">
          Loading your application…
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <AlertCircle className="mx-auto size-6 text-destructive" />
        <p className="mt-4 text-sm font-medium text-foreground">
          We could not load your application
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {error instanceof Error
            ? error.message
            : "Please refresh the page and try again."}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-sm font-medium text-foreground">
          You have not submitted an application yet
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Once you submit your application, its progress will appear here.
        </p>
      </div>
    );
  }

  const current = stageIndexFor(data.status);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
          APPLICATION SUMMARY
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            ["Application ID", data.reference],
            ["Submitted", formatDate(data.submittedAt)],
            ["Hospital", data.hospitalName ?? hospitalName],
            ["Patient", profile.fullName],
            ["Current status", data.status],
            ["Treatment", data.title],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 text-sm font-medium text-foreground">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
          PROGRESS
        </h2>
        <ol className="mt-5 space-y-0">
          {stages.map((s, i) => {
            const done = i <= current;
            return (
              <li
                key={s.title}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-4"
              >
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full",
                      done ? "bg-primary" : "border border-border bg-secondary",
                    )}
                  >
                    {done ? (
                      <Check className="size-4 text-primary-foreground" />
                    ) : (
                      <Circle className="size-3 text-muted-foreground" />
                    )}
                  </span>
                  {i < stages.length - 1 && (
                    <span
                      className={cn(
                        "my-1 w-px flex-1",
                        done ? "bg-primary/40" : "bg-border",
                      )}
                    />
                  )}
                </div>
                <div className={cn("min-w-0", i < stages.length - 1 && "pb-6")}>
                  <p
                    className={cn(
                      "font-semibold",
                      done ? "text-card-foreground" : "text-muted-foreground",
                    )}
                  >
                    {s.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {i === 0
                      ? formatDate(data.submittedAt)
                      : i === current
                        ? formatDate(data.statusChangedAt)
                        : "Pending"}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {s.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
