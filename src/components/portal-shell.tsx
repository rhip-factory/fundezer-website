import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  ChevronDown,
  FileText,
  FolderOpen,
  HeartHandshake,
  Home,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Stethoscope,
  User,
  X,
} from "lucide-react";

import { FundezerLogo } from "@/components/fundezer-logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { usePortal } from "@/lib/patient/portal-store";
import { cn } from "@/lib/utils";

const mainNav = [
  { label: "Home", to: "/portal", icon: Home },
  { label: "Application", to: "/portal/application", icon: FileText },
  { label: "Campaign", to: "/portal/campaign", icon: HeartHandshake },
  { label: "Treatment", to: "/portal/treatment", icon: Stethoscope },
  { label: "Documents", to: "/portal/documents", icon: FolderOpen },
  { label: "Notifications", to: "/portal/notifications", icon: Bell },
] as const;

const bottomNav = [
  { label: "Profile", to: "/portal/profile", icon: User },
  { label: "Settings", to: "/portal/settings", icon: Settings },
] as const;

const titles: Record<string, string> = {
  "/portal": "Home",
  "/portal/application": "Application",
  "/portal/campaign": "Campaign",
  "/portal/treatment": "Treatment",
  "/portal/documents": "Documents",
  "/portal/notifications": "Notifications",
  "/portal/profile": "Profile",
  "/portal/settings": "Settings",
};

function NavItems({
  collapsed,
  onNavigate,
  items,
}: {
  collapsed: boolean;
  onNavigate?: (() => void) | undefined;
  items: readonly { label: string; to: string; icon: typeof Home }[];
}) {
  const { unreadCount } = usePortal();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const active =
          item.to === "/portal"
            ? pathname === "/portal" || pathname === "/portal/"
            : pathname.startsWith(item.to);
        const link = (
          <Link
            to={item.to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              collapsed && "justify-center px-0",
              active
                ? "bg-primary-soft font-semibold text-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <item.icon
              className={cn(
                "size-[18px] shrink-0",
                active ? "text-primary" : "text-muted-foreground",
              )}
            />
            {!collapsed && <span className="truncate">{item.label}</span>}
            {item.label === "Notifications" && unreadCount > 0 && (
              <span
                className={cn(
                  "ml-auto grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground",
                  collapsed && "ml-0 absolute right-2 top-1 size-4 text-[10px]",
                )}
              >
                {unreadCount}
              </span>
            )}
          </Link>
        );

        return (
          <li key={item.to} className="relative">
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              link
            )}
          </li>
        );
      })}
    </ul>
  );
}

function SidebarContent({
  collapsed,
  onNavigate,
  onLogout,
}: {
  collapsed: boolean;
  onNavigate?: (() => void) | undefined;
  onLogout: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "px-5 py-6",
          collapsed && "flex flex-col items-center px-2",
        )}
      >
        <Link to="/portal" onClick={onNavigate} className="block">
          <FundezerLogo className={cn("h-7", collapsed && "h-6")} />
        </Link>
        {!collapsed && (
          <p className="mt-2 text-xs tracking-wide text-muted-foreground">
            Patient Portal
          </p>
        )}
      </div>

      <div className={cn("px-3", collapsed && "px-2")}>
        <div className="mb-3 h-px bg-border" />
        <NavItems
          items={mainNav}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </div>

      <div className={cn("mt-auto px-3 pb-5", collapsed && "px-2")}>
        <div className="mb-3 h-px bg-border" />
        <NavItems
          items={bottomNav}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        <button
          onClick={onLogout}
          className={cn(
            "mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          <LogOut className="size-[18px] shrink-0" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </div>
  );
}

export function PortalShell({ children }: { children: ReactNode }) {
  const { sidebarCollapsed, toggleSidebar, unreadCount, profile } = usePortal();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const title = titles[pathname.replace(/\/$/, "") || "/portal"] ?? "Portal";

  const confirmLogout = async () => {
    setLogoutOpen(false);
    setDrawerOpen(false);
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen w-full bg-background">
        {/* Desktop sidebar */}
        <aside
          className={cn(
            "sticky top-0 hidden h-screen shrink-0 border-r border-border bg-sidebar transition-[width] duration-200 lg:block",
            sidebarCollapsed ? "w-[76px]" : "w-[252px]",
          )}
        >
          <SidebarContent
            collapsed={sidebarCollapsed}
            onLogout={() => setLogoutOpen(true)}
          />
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-foreground/40"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-[270px] bg-sidebar shadow-xl">
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation"
                className="absolute right-3 top-4 rounded-md p-2 text-muted-foreground hover:bg-secondary"
              >
                <X className="size-4" />
              </button>
              <SidebarContent
                collapsed={false}
                onNavigate={() => setDrawerOpen(false)}
                onLogout={() => setLogoutOpen(true)}
              />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
              <div className="flex min-w-0 items-center gap-2">
                <button
                  onClick={() => setDrawerOpen(true)}
                  aria-label="Open navigation"
                  className="rounded-md p-2 text-foreground hover:bg-secondary lg:hidden"
                >
                  <Menu className="size-5" />
                </button>
                <button
                  onClick={toggleSidebar}
                  aria-label={
                    sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                  }
                  className="hidden rounded-md p-2 text-muted-foreground hover:bg-secondary lg:block"
                >
                  {sidebarCollapsed ? (
                    <PanelLeftOpen className="size-5" />
                  ) : (
                    <PanelLeftClose className="size-5" />
                  )}
                </button>
                <span className="lg:hidden">
                  <FundezerLogo className="h-6" />
                </span>
                <h1 className="hidden truncate text-base font-semibold text-foreground lg:block">
                  {title}
                </h1>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Link
                  to="/portal/notifications"
                  aria-label="Notifications"
                  className="relative rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <Bell className="size-5" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-secondary">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                      AY
                    </span>
                    <span className="hidden max-w-[140px] truncate font-medium text-foreground sm:block">
                      {profile.fullName}
                    </span>
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/portal/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/portal/settings">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLogoutOpen(true)}>
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
            <h1 className="mb-4 text-lg font-semibold text-foreground lg:hidden">
              {title}
            </h1>
            {children}
          </main>
        </div>
      </div>

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
            <Button onClick={confirmLogout}>Log out</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
