import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { usePortal } from "@/lib/patient/portal-store";

export const Route = createFileRoute("/portal/settings")({
  head: () => ({
    meta: [
      { title: "Settings — FundEzer" },
      {
        name: "description",
        content:
          "Manage how FundEzer notifies you about your application, campaign and treatment updates.",
      },
      { property: "og:title", content: "Settings" },
      {
        property: "og:description",
        content: "Notification preferences and account options.",
      },
    ],
  }),
  component: SettingsPage,
});

const prefs = [
  {
    id: "application",
    label: "Application updates",
    body: "Status changes and hospital verification results.",
  },
  {
    id: "donations",
    label: "Donation alerts",
    body: "A notification each time someone donates to your campaign.",
  },
  {
    id: "treatment",
    label: "Treatment updates",
    body: "Notes your hospital adds to your treatment record.",
  },
  {
    id: "email",
    label: "Email summaries",
    body: "A weekly email summary of your campaign progress.",
  },
];

function SettingsPage() {
  const { profile } = usePortal();
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    application: true,
    donations: true,
    treatment: true,
    email: false,
  });
  const [logoutOpen, setLogoutOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
          NOTIFICATION PREFERENCES
        </h2>
        <ul className="mt-4 divide-y divide-border">
          {prefs.map((p) => (
            <li
              key={p.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{p.label}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{p.body}</p>
              </div>
              <Switch
                checked={enabled[p.id] ?? false}
                aria-label={p.label}
                onCheckedChange={(v) => {
                  setEnabled((prev) => ({ ...prev, [p.id]: v }));
                  toast.success(`${p.label} ${v ? "enabled" : "disabled"}`);
                }}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
          ACCOUNT
        </h2>
        <dl className="mt-4 space-y-3">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-sm text-muted-foreground">Signed in as</dt>
            <dd className="text-sm font-medium text-foreground">
              {profile.email}
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-sm text-muted-foreground">Phone</dt>
            <dd className="text-sm font-medium text-foreground">
              {profile.phone}
            </dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => toast.info("A password reset link has been sent.")}
          >
            Change password
          </Button>
          <Button variant="ghost" onClick={() => setLogoutOpen(true)}>
            Log out
          </Button>
        </div>
      </section>

      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Log out of FundEzer?</DialogTitle>
            <DialogDescription>
              You can sign back in at any time to continue tracking your
              application.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoutOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => navigate({ to: "/" })}>Log out</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
