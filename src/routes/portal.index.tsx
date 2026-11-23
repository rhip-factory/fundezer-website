import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  FileText,
  HeartHandshake,
  Stethoscope,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { naira, relativeTime, usePortal } from "@/lib/patient/portal-store";

export const Route = createFileRoute("/portal/")({
  head: () => ({
    meta: [
      { title: "Patient dashboard — FundEzer" },
      {
        name: "description",
        content:
          "Track your FundEzer application, campaign funding and treatment updates from one patient dashboard.",
      },
      { property: "og:title", content: "Your FundEzer dashboard" },
      {
        property: "og:description",
        content: "Application status, funding progress and treatment updates.",
      },
    ],
  }),
  component: PortalHome,
});

function PortalHome() {
  const { profile, notifications, unreadCount, portal } = usePortal();

  const campaign = portal?.campaign ?? null;
  const application = portal?.application ?? null;
  const latest = portal?.treatmentUpdates[0] ?? null;

  const goal = campaign?.target ?? 0;
  const raised = campaign?.raised ?? 0;
  const percent = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  const firstName =
    (profile.fullName || portal?.patient?.displayName || "").split(" ")[0] ||
    "there";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-card-foreground">
              Welcome back, {firstName}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Here's where your application and campaign stand today.
            </p>
          </div>
          {campaign?.status === "Active" && (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
              <CheckCircle2 className="size-3.5" /> Campaign live
            </span>
          )}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <div className="flex items-center gap-2">
            <HeartHandshake className="size-4 text-primary" />
            <h3 className="text-sm font-semibold tracking-wide text-muted-foreground">
              CAMPAIGN PROGRESS
            </h3>
          </div>
          {campaign ? (
            <>
              <p className="mt-3 text-2xl font-semibold text-card-foreground">
                {naira(raised)}
                <span className="text-base font-normal text-muted-foreground">
                  {" "}
                  of {naira(goal)}
                </span>
              </p>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                <span>{percent}% funded</span>
                <span>
                  {campaign.donors} donor{campaign.donors === 1 ? "" : "s"}
                </span>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Your campaign appears here once your application is approved and
              published.
            </p>
          )}
          <Button variant="outline" size="sm" className="mt-5" asChild>
            <Link to="/portal/campaign">
              View campaign <ArrowRight className="size-4" />
            </Link>
          </Button>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <h3 className="text-sm font-semibold tracking-wide text-muted-foreground">
              APPLICATION
            </h3>
          </div>
          {application ? (
            <>
              <p className="mt-3 font-semibold text-card-foreground">
                {application.status}
              </p>
              <dl className="mt-3 space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between gap-3">
                  <dt>ID</dt>
                  <dd className="font-medium text-foreground">
                    {application.reference}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Hospital</dt>
                  <dd className="truncate font-medium text-foreground">
                    {application.hospitalName ?? "To be confirmed"}
                  </dd>
                </div>
              </dl>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              You have not submitted an application yet.
            </p>
          )}
          <Button variant="outline" size="sm" className="mt-5" asChild>
            <Link to={application ? "/portal/application" : "/apply/location"}>
              {application ? "Track application" : "Start an application"}{" "}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Stethoscope className="size-4 text-primary" />
            <h3 className="text-sm font-semibold tracking-wide text-muted-foreground">
              LATEST TREATMENT UPDATE
            </h3>
          </div>
          {latest ? (
            <>
              <p className="mt-3 text-xs text-muted-foreground">
                {relativeTime(latest.publishedAt ?? latest.createdAt)}
                {latest.hospitalName ? ` · ${latest.hospitalName}` : ""}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {latest.summary}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Your hospital has not shared a treatment update yet.
            </p>
          )}
          <Button variant="outline" size="sm" className="mt-5" asChild>
            <Link to="/portal/treatment">
              View treatment record <ArrowRight className="size-4" />
            </Link>
          </Button>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-primary" />
            <h3 className="text-sm font-semibold tracking-wide text-muted-foreground">
              NOTIFICATIONS
            </h3>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread update${unreadCount > 1 ? "s" : ""}`
              : "You're all caught up"}
          </p>
          <ul className="mt-3 space-y-3">
            {notifications.slice(0, 3).map((n) => (
              <li key={n.id} className="text-sm">
                <p className="font-medium text-foreground">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.time}</p>
              </li>
            ))}
          </ul>
          <Button variant="outline" size="sm" className="mt-5" asChild>
            <Link to="/portal/notifications">
              See all <ArrowRight className="size-4" />
            </Link>
          </Button>
        </article>
      </div>
    </div>
  );
}
