import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";

const links = [
  { to: "/campaigns", label: "Browse campaigns" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/hospitals", label: "Partner hospitals" },
  { to: "/success-stories", label: "Success stories" },
  { to: "/my-impact", label: "My Impact" },
  { to: "/about", label: "About" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="container-page flex h-18 items-center justify-between gap-6 py-3">
        <Logo />

        <nav className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary [&.active]:text-primary"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/login"
            className="rounded-full px-4 py-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            Log in
          </Link>
          <Link
            to="/apply"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
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
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
            >
              Log in
            </Link>
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