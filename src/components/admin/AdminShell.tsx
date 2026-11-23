import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABELS, initialsOf, useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Building2,
  HeartHandshake,
  ArrowLeftRight,
  Megaphone,
  Wallet,
  ScrollText,
  Settings,
  LogOut,
  Menu,
  Bell,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import logo from "@/assets/fundezer-logo.png.asset.json";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listTransfers } from "@/lib/admin/transfers.functions";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/patients", label: "Patients", icon: Users },
  { to: "/admin/applications", label: "Applications", icon: ClipboardList },
  { to: "/admin/hospitals", label: "Hospitals", icon: Building2 },
  { to: "/admin/causes", label: "Causes", icon: HeartHandshake },
  { to: "/admin/transfers", label: "Hospital Transfers", icon: ArrowLeftRight },
  { to: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/admin/donations", label: "Donations", icon: Wallet },
  { to: "/admin/audit-logs", label: "Audit Log", icon: ScrollText },
] as const;

function NavList({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const fetchTransfers = useServerFn(listTransfers);
  const { data: transfers = [] } = useQuery({
    queryKey: ["transfers"],
    queryFn: () => fetchTransfers(),
  });
  const pending = (transfers as Array<{ status: string }>).filter((t) =>
    ["Submitted", "Under Review", "Receiving Hospital Pending"].includes(t.status),
  ).length;

  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map((item) => {
        const active = item.to === "/admin" ? pathname === "/admin" : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none",
              active
                ? "bg-primary text-primary-foreground shadow-card"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
            {item.to === "/admin/transfers" && pending > 0 ? (
              <span
                className={cn(
                  "num ml-auto rounded-full px-2 py-0.5 text-xs font-semibold",
                  active ? "bg-primary-foreground/20" : "bg-primary-soft text-accent-foreground",
                )}
              >
                {pending}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { identity, session } = useAuth();
  const name = identity?.profile.full_name ?? session?.user.email ?? "Signed in";
  const roleLabel = identity?.roles.length
    ? (ROLE_LABELS[identity.roles[0] as string] ?? identity.roles[0])
    : "No role assigned";

  const signOut = async () => {
    onNavigate?.();
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    await navigate({ to: "/login", replace: true });
  };

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="px-5 py-5">
        <Link to="/" onClick={onNavigate} className="block">
          <img src={logo.url} alt="FundEzer" className="h-9 w-auto object-contain object-left" />
        </Link>
        <p className="mt-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Admin Portal
        </p>
      </div>
      <div className="flex-1 overflow-y-auto pb-4">
        <NavList onNavigate={onNavigate} />
      </div>
      <div className="border-t border-sidebar-border p-3">
        <Link
          to="/admin/profile"
          onClick={onNavigate}
          className="mb-1 flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-sidebar-accent"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {initialsOf(name)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-sidebar-foreground">
              {name}
            </span>
            <span className="block truncate text-xs text-muted-foreground">{roleLabel}</span>
          </span>
        </Link>
        <Link
          to="/admin/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
        >
          <Settings className="size-4" />
          Settings
        </Link>
        <button
          type="button"
          onClick={() => void signOut()}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-danger-soft hover:text-destructive"
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { identity, session } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current =
    NAV.find((n) => (n.to === "/admin" ? pathname === "/admin" : pathname.startsWith(n.to)))?.label ??
    (pathname.startsWith("/admin/settings") ? "Settings" : "Admin Profile");
  const name = identity?.profile.full_name ?? session?.user.email ?? "Signed in";
  const roleLabel = identity?.roles.length
    ? (ROLE_LABELS[identity.roles[0] as string] ?? identity.roles[0])
    : "Administrator";

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-sidebar-border lg:block">
        <SidebarBody />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetTitle className="sr-only">FundEzer Admin navigation</SheetTitle>
                <SidebarBody onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">FundEzer Admin</p>
              <p className="truncate text-sm font-semibold text-foreground">{current}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Notifications"
              onClick={() =>
                toast.info("Notifications", {
                  description: "Prototype: notification feed is not wired up.",
                })
              }
            >
              <Bell className="size-4" />
            </Button>
            <Link
              to="/admin/profile"
              aria-label="Open admin profile"
              className="hidden items-center gap-2 rounded-md border border-border bg-secondary px-2 py-1.5 transition-colors hover:bg-accent sm:flex"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {initialsOf(name)}
              </span>
              <span className="min-w-0 text-left">
                <span className="block max-w-40 truncate text-xs font-semibold text-foreground">{name}</span>
                <span className="block max-w-40 truncate text-[11px] text-muted-foreground">{roleLabel}</span>
              </span>
            </Link>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
