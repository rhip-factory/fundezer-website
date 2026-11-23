import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { hasOngoingCampaign, openPatientPortal } from "@/lib/patient-portal";
import { getSiteNavigation } from "@/lib/site-navigation";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function Header() {
  const [open, setOpen] = useState(false);
  const { signedIn, user, isAdmin } = useAuth();
  const [isPatient, setIsPatient] = useState(false);
  const { primary: primaryLinks, more: moreLinks } = getSiteNavigation(signedIn);

  useEffect(() => {
    if (!user) { setIsPatient(false); return; }
    let active = true;
    hasOngoingCampaign().then((v) => { if (active) setIsPatient(v); });
    return () => { active = false; };
  }, [user]);

  const dashboardButton = (cls: string) =>
    isPatient ? (
      <Button variant="ghost" type="button" onClick={() => { setOpen(false); void openPatientPortal(); }} className={cls}>
        Patient dashboard
      </Button>
    ) : null;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="container-page flex min-h-20 items-center justify-between gap-3 py-3">
        <Logo />

        <nav aria-label="Main navigation" className="hidden shrink-0 items-center gap-4 whitespace-nowrap xl:flex">
          {primaryLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="border-b border-transparent py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary [&.active]:border-primary [&.active]:text-foreground"
            >
              {l.label}
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-1 px-0 text-sm font-semibold text-muted-foreground hover:bg-transparent hover:text-primary">
              More <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48">
              {moreLinks.map((l) => (
                <DropdownMenuItem key={l.to} asChild>
                  <Link to={l.to} className="px-3 py-2 text-sm font-medium">{l.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="hidden shrink-0 items-center gap-1 whitespace-nowrap xl:flex">
          {signedIn ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  Admin Hub
                </Link>
              )}
              <Link
                to="/donor"
                className="px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
              >
                Donor Hub
              </Link>
              <Link
                to="/wallet"
                className="px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
              >
                Wallet
              </Link>
              <Button variant="ghost"
                type="button"
                onClick={() => supabase.auth.signOut()}
                className="px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
              >
                Log out
              </Button>
            </>
          ) : (
            <Link
              to="/auth"
              className="px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
            >
              Log in
            </Link>
          )}
          {isPatient ? dashboardButton("h-auto rounded-none bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary hover:text-primary-foreground") : (
          <Link
            to="/apply"
            className="bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
          >
            Start a Campaign
          </Link>
          )}
        </div>


        <Button variant="outline" size="icon"
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="shrink-0 text-foreground xl:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {open && (
        <div className="border-t border-border bg-card xl:hidden">
          <div className="container-page flex flex-col gap-1 py-4">
            {[...primaryLinks, ...moreLinks].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
              >
                {l.label}
              </Link>
            ))}
            <Link to="/my-impact" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent">My Impact</Link>
            {signedIn ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="rounded-lg bg-primary/10 px-3 py-2.5 text-sm font-bold uppercase tracking-wider text-primary hover:bg-primary/20"
                  >
                    Admin Hub
                  </Link>
                )}
                <Link
                  to="/donor"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                >
                  Donor Hub
                </Link>
                <Link
                  to="/wallet"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                >
                  Wallet
                </Link>
                <Button variant="ghost"
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void supabase.auth.signOut();
                  }}
                  className="h-auto justify-start rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-accent"
                >
                  Log out
                </Button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
              >
                Log in
              </Link>
            )}
            {isPatient ? dashboardButton("mt-2 h-auto rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary hover:text-primary-foreground") : (
            <Link
              to="/apply"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground"
            >
              Start a Campaign
            </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}