import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/PageShell";

export const Route = createFileRoute("/privacy")({
  component: Privacy,
  head: () => ({
    meta: [
      { title: "Privacy policy — Fundezer website" },
      {
        name: "description",
        content:
          "How FundEzer collects, encrypts and protects patient medical records, identity data and donor information under Nigerian data protection requirements.",
      },
      { property: "og:title", content: "Privacy policy — Fundezer website" },
      { property: "og:description", content: "How we handle medical and personal data." },
      { property: "og:url", content: "/privacy" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
});

const sections = [
  [
    "Information we collect",
    "For patients we collect your name, email, phone number, NIN, date of birth, gender, address, emergency contact, next of kin, medical documents and treatment records. For donors we collect your name, email and payment confirmation details. For hospital users we collect professional identity and role information.",
  ],
  [
    "How we use your information",
    "To verify identity, allow your hospital to assess your case, screen applications for fraud, publish an approved campaign, process donations to hospitals, and send notifications about your application, campaign and treatment.",
  ],
  [
    "What donors can see",
    "Published campaigns show your story, diagnosis summary, treatment plan, hospital name, goal and progress. They never show your NIN, full address, contact details, next of kin or raw medical documents.",
  ],
  [
    "Security",
    "Personal and medical data is encrypted in transit and at rest. Access is controlled by role-based permissions, and all approvals and payments are recorded in an audit trail.",
  ],
  [
    "Sharing",
    "We share the minimum necessary data with the partner hospital treating you, our payment gateway, and communication providers for email, SMS and push notifications. We do not sell personal data.",
  ],
  [
    "Retention and your rights",
    "Records are retained for as long as needed for treatment, financial and audit purposes. You may request access to, correction of, or deletion of your personal data by contacting us, subject to applicable Nigerian data protection requirements.",
  ],
];

function Privacy() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Legal"
        title="Privacy policy"
        description="FundEzer handles medical records and identity data. This policy explains what we collect and how it is protected."
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