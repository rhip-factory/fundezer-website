import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const primaryLinks = [
  { to: "/campaigns", label: "Find a Patient" },
  { to: "/causes", label: "Support a Cause" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/hospitals", label: "Partner hospitals" },
] as const;

const moreLinks = [
  { to: "/success-stories", label: "Success stories" },
  { to: "/partner-donor", label: "Partner donors" },
  { to: "/about", label: "About FundEzer" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const { signedIn } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="container-page flex min-h-20 items-center justify-between gap-6 py-3">
        <Logo />

        <nav className="hidden items-center gap-6 lg:flex">
          {primaryLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="border-b border-transparent py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary [&.active]:border-primary [&.active]:text-foreground"
            >
              {l.label}
            </Link>
          ))}
          <div className="group relative">
            <button type="button" className="inline-flex items-center gap-1 py-2 text-sm font-semibold text-muted-foreground hover:text-primary">
              More <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <div className="invisible absolute left-1/2 top-full w-48 -translate-x-1/2 border border-border bg-card p-2 opacity-0 shadow-lift transition-all group-hover:visible group-hover:opacity-100">
              {moreLinks.map((l) => (
                <Link key={l.to} to={l.to} className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">{l.label}</Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {signedIn ? (
            <>
              <Link
                to="/wallet"
                className="px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
              >
                Wallet
              </Link>
              <button
                type="button"
                onClick={() => supabase.auth.signOut()}
                className="px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
            >
              Log in
            </Link>
          )}
          <Link
            to="/apply"
            className="bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
          >
            Start a Campaign
          </Link>
        </div>


        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-border p-2 text-foreground lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-card lg:hidden">
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
                <Link
                  to="/wallet"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                >
                  Wallet
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void supabase.auth.signOut();
                  }}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-accent"
                >
                  Log out
                </button>
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
            <Link
              to="/apply"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground"
            >
              Start a Campaign
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}