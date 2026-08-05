import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

const columns = [
  {
    title: "Platform",
    links: [
      { to: "/campaigns", label: "Browse campaigns" },
      { to: "/how-it-works", label: "How it works" },
      { to: "/apply", label: "Start a Campaign" },
      { to: "/hospitals", label: "Partner hospitals" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about", label: "About FundEzer" },
      { to: "/success-stories", label: "Success stories" },
      { to: "/faqs", label: "FAQs" },
      { to: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/privacy", label: "Privacy policy" },
      { to: "/terms", label: "Terms of use" },
      { to: "/register", label: "Create an account" },
      { to: "/login", label: "Log in" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-card">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Africa's trust-first healthcare crowdfunding platform. Donations are paid directly to
            verified hospitals, never to individuals.
          </p>
          <p className="mt-4 text-xs font-medium uppercase tracking-widest text-primary">
            Abuja pilot · Nigeria
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} FundEzer. All rights reserved.</p>
          <p>Funds are disbursed to hospitals against approved treatment milestones.</p>
        </div>
      </div>
    </footer>
  );
}