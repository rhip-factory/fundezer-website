import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/PageShell";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({
    meta: [
      { title: "About FundEzer — Africa's trust-first health financing" },
      {
        name: "description",
        content:
          "FundEzer's vision, mission and product principles: verified hospitals, transparent closed-loop payments and AI-assisted verification for Nigerian patients.",
      },
      { property: "og:title", content: "About FundEzer" },
      {
        property: "og:description",
        content: "Why we built a hospital-centric healthcare crowdfunding platform for Africa.",
      },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
});

const principles = [
  ["Trust first", "Every campaign must be verified before publication."],
  ["Hospital-centric", "Hospitals are the primary validation and treatment partners."],
  ["Transparency by design", "Donors should always know how funds are being used."],
  ["AI as an enabler", "AI improves verification and experience without replacing clinical judgement."],
  ["Patient dignity", "The application process is respectful, guided and easy to complete."],
  ["Scalable foundation", "The Abuja pilot is a reusable architecture for Nigeria and Africa."],
];

function About() {
  return (
    <PageShell>
      <PageHero
        eyebrow="About us"
        title="Africa's most trusted healthcare financing platform"
        description="FundEzer exists so that no patient is denied treatment because they cannot afford healthcare."
      />

      <section className="container-page grid gap-10 py-16 lg:grid-cols-2">
        <div className="surface-card p-8">
          <h2 className="text-2xl font-semibold text-foreground">Our vision</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            To become Africa's most trusted healthcare financing platform, where no patient is
            denied treatment because they cannot afford healthcare.
          </p>
        </div>
        <div className="surface-card p-8">
          <h2 className="text-2xl font-semibold text-foreground">Our mission</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            To enable verified hospitals to connect financially challenged patients with individuals
            and organisations willing to sponsor life-saving treatment through an AI-powered,
            transparent and fraud-resistant platform.
          </p>
        </div>
      </section>

      <section className="border-y border-border bg-card py-16">
        <div className="container-page">
          <h2 className="text-2xl font-semibold text-foreground md:text-3xl">
            The problem we are solving
          </h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">
            Many Nigerians delay or abandon treatment because healthcare is largely financed out of
            pocket, while informal fundraising channels lack verification and transparency. FundEzer
            answers that with AI-assisted verification, direct hospital payments and real-time
            transparency.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Patients cannot afford treatment",
              "Hospitals lose patients",
              "Families resort to WhatsApp fundraising",
              "Donors fear fraud",
              "Hospitals carry bad debt",
              "NGOs cannot easily verify requests",
            ].map((p) => (
              <div key={p} className="rounded-xl border border-border bg-background p-5 text-sm font-medium text-foreground">
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="text-2xl font-semibold text-foreground md:text-3xl">Product principles</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {principles.map(([title, body]) => (
            <div key={title} className="surface-card p-6">
              <h3 className="font-display text-base font-semibold text-primary">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>

        <div className="surface-card mt-12 p-8">
          <h2 className="text-2xl font-semibold text-foreground">Where we are going</h2>
          <div className="mt-6 grid gap-8 md:grid-cols-3">
            {[
              ["Now — Abuja pilot", ["Verified partner hospitals", "Patient sponsorship requests", "AI story builder and fraud screening", "Donor campaigns and wallets"]],
              ["Phase 2", ["Additional Nigerian cities", "NGO sponsorship programmes", "Corporate CSR campaigns", "Diaspora fundraising and USSD"]],
              ["Phase 3", ["Nationwide rollout", "Cross-border fundraising", "Insurance and government partnerships", "AI-assisted donor matching"]],
            ].map(([title, items]) => (
              <div key={title as string}>
                <h3 className="font-display text-base font-semibold text-foreground">
                  {title as string}
                </h3>
                <ul className="mt-3 space-y-2">
                  {(items as string[]).map((i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      · {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}