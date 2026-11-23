import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ClipboardList, Clock, Mail } from "lucide-react";

import { ApplyShell } from "@/components/apply-shell";
import { Button } from "@/components/ui/button";
import { usePortal } from "@/lib/patient/portal-store";

export const Route = createFileRoute("/apply/success")({
  head: () => ({
    meta: [
      { title: "Application submitted — FundEzer" },
      {
        name: "description",
        content:
          "Your FundEzer application has been submitted and is now with your hospital for verification.",
      },
      { property: "og:title", content: "Application submitted" },
      {
        property: "og:description",
        content: "Your application is now with your hospital for verification.",
      },
    ],
  }),
  component: SuccessStep,
});

function SuccessStep() {
  const { hospitalName, portal } = usePortal();
  const application = portal?.application ?? null;
  const submittedOn = application?.submittedAt
    ? new Date(application.submittedAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Just now";

  return (
    <ApplyShell
      step={4}
      title="Application submitted"
      description="Thank you. Your application is now with your hospital for verification."
    >
      <div className="rounded-2xl border border-border bg-card p-6 text-center sm:p-8">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-success-soft">
          <CheckCircle2 className="size-7 text-success" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-card-foreground">
          Your application has been received
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {hospitalName} will review your details and documents. You'll be
          notified as soon as there's an update.
        </p>

        <dl className="mx-auto mt-6 max-w-sm space-y-2 rounded-xl bg-secondary/60 p-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-sm text-muted-foreground">Application ID</dt>
            <dd className="text-sm font-semibold text-foreground">
              {application?.reference ?? "Being generated"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-sm text-muted-foreground">Submitted</dt>
            <dd className="text-sm font-medium text-foreground">
              {submittedOn}
            </dd>
          </div>
        </dl>

        <div className="mt-7 space-y-3 text-left">
          <p className="text-sm font-semibold text-foreground">What happens next</p>
          {[
            {
              icon: ClipboardList,
              text: "Your hospital verifies your documents and treatment details.",
            },
            {
              icon: Clock,
              text: "Review usually takes 2–5 working days.",
            },
            {
              icon: Mail,
              text: "Once approved, your campaign goes live and can receive donations.",
            },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft">
                <Icon className="size-4 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link to="/portal">Go to my dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/portal/application">Track my application</Link>
          </Button>
        </div>
      </div>
    </ApplyShell>
  );
}
