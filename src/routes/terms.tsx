import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/PageShell";

export const Route = createFileRoute("/terms")({
  component: Terms,
  head: () => ({
    meta: [
      { title: "Terms of use — Fundezer website" },
      {
        name: "description",
        content:
          "The terms governing FundEzer campaigns, donations, hospital payouts, refunds and acceptable use of the platform.",
      },
      { property: "og:title", content: "Terms of use — Fundezer website" },
      { property: "og:description", content: "Rules for patients, hospitals and donors." },
      { property: "og:url", content: "/terms" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
});

const sections = [
  [
    "Using FundEzer",
    "FundEzer is a platform connecting patients treated at verified partner hospitals with donors. During the pilot, eligibility is limited to patients receiving care at partner hospitals in Abuja, Nigeria.",
  ],
  [
    "No direct disbursement to patients",
    "FundEzer does not disburse funds to patients, families or representatives. All donations are paid to the verified hospital treating the patient, released against approved treatment milestones.",
  ],
  [
    "Verification and approval",
    "A campaign is only published after the partner hospital completes a clinical assessment and cost estimate, approves the recommended goal, and the application passes fraud screening. FundEzer may pause, suspend or remove a campaign at any time where verification concerns arise.",
  ],
  [
    "Donations",
    "Donations are voluntary, are not tax advice, and are generally non-refundable once paid to a hospital. Where treatment cannot proceed, remaining wallet balances are handled in consultation with the hospital and directed to the patient's continuing care.",
  ],
  [
    "Accurate information",
    "Patients must provide truthful information and genuine documents. Submitting falsified documents or duplicate identities may result in removal from the platform and referral to the relevant authorities.",
  ],
  [
    "Limitation of liability",
    "FundEzer facilitates funding and transparency. Clinical decisions, treatment outcomes and quality of care are the responsibility of the treating hospital and its licensed practitioners.",
  ],
];

function Terms() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Legal"
        title="Terms of use"
        description="These terms apply to everyone using FundEzer: patients, hospital teams and donors."
      />
      <section className="container-page max-w-3xl space-y-8 py-16">
        {sections.map(([title, body]) => (
          <div key={title}>
            <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>
    </PageShell>
  );
}