import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  FileText,
  HeartHandshake,
  Stethoscope,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePortal, type NotificationKind } from "@/lib/patient/portal-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — FundEzer" },
      {
        name: "description",
        content:
          "Every update about your application, campaign, donations and treatment in one place.",
      },
      { property: "og:title", content: "Notifications" },
      {
        property: "og:description",
        content: "Application, campaign, donation and treatment updates.",
      },
    ],
  }),
  component: NotificationsPage,
});

const icons: Record<NotificationKind, typeof Bell> = {
  application: FileText,
  campaign: HeartHandshake,
  donation: Wallet,
  treatment: Stethoscope,
};

function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead } = usePortal();
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <p className="min-w-0 truncate text-sm text-muted-foreground">
          {unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
            : "You're all caught up"}
        </p>
        <Button
          variant="ghost"
          size="sm"
          disabled={unreadCount === 0}
          onClick={markAllRead}
        >
          Mark all as read
        </Button>
      </div>

      <ul className="space-y-3">
        {notifications.map((n) => {
          const Icon = icons[n.kind];
          return (
            <li key={n.id}>
              <button
                onClick={() => {
                  markRead(n.id);
                  navigate({ to: n.target });
                }}
                className={cn(
                  "grid w-full grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-2xl border p-4 text-left transition-colors",
                  n.read
                    ? "border-border bg-card hover:bg-secondary/40"
                    : "border-primary/25 bg-primary-soft/50 hover:bg-primary-soft",
                )}
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-card">
                  <Icon className="size-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        "min-w-0 truncate",
                        n.read
                          ? "font-medium text-foreground"
                          : "font-semibold text-foreground",
                      )}
                    >
                      {n.title}
                    </p>
                    {!n.read && (
                      <span className="size-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{n.time}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
