import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

const columns = [
  {
    title: "Platform",
    links: [
      { to: "/campaigns", label: "Browse campaigns" },
      { to: "/causes", label: "Support a Cause" },
      { to: "/how-it-works", label: "How it works" },
      { to: "/hospitals", label: "Partner hospitals" },
      { to: "/partner-donor", label: "Partner Donors" },
    ],
  },
  {
    title: "Portals",
    links: [
      { to: "/apply", label: "Apply for Care" },
      { to: "/portal", label: "Patient Portal" },
      { to: "/donor", label: "Donor Hub" },
      { to: "/wallet", label: "Donor Wallet" },
      { to: "/admin", label: "Admin Hub" },
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
    <footer className="mt-24 border-t-4 border-primary bg-foreground text-background">
      <div className="container-page grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] md:py-20">
        <div>
          <Logo />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-background/65">
            Africa's trust-first healthcare crowdfunding platform. Donations are paid directly to
            verified hospitals, never to individuals.
          </p>
          <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-background/80">
            Abuja pilot · Nigeria
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-background">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-background/60 transition-colors hover:text-background"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-background/15">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-background/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} FundEzer. All rights reserved.</p>
          <p>Funds are disbursed to hospitals against approved treatment milestones.</p>
        </div>
      </div>
    </footer>
  );
}