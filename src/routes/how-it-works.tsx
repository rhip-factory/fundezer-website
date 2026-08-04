import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/PageShell";

export const Route = createFileRoute("/how-it-works")({
  component: HowItWorks,
  head: () => ({
    meta: [
      { title: "How FundEzer works — application to treatment" },
      {
        name: "description",
        content:
          "See how a FundEzer campaign is created: patient application, AI story builder, hospital assessment, fraud screening, publication and milestone payments.",
      },
      { property: "og:title", content: "How FundEzer works" },
      {
        property: "og:description",
        content: "The full FundEzer workflow from patient application to hospital payment.",
      },
      { property: "og:url", content: "/how-it-works" },
    ],
    links: [{ rel: "canonical", href: "/how-it-works" }],
  }),
});

const tracks = [
  {
    audience: "For patients",
    steps: [
      ["Choose location and hospital", "Select Nigeria and Abuja, then pick one of our verified partner hospitals. Other states open as we onboard more hospitals."],
      ["Register securely", "Provide your name, contact details, NIN, date of birth, address, emergency contact and next of kin."],
      ["Answer guided questions", "Instead of 'tell your story', our AI asks what your illness is, when it was diagnosed, who diagnosed it and how it affects your life."],
      ["Review your story", "The AI writes a clear, dignified story of up to 200 words that you can edit before submitting."],
      ["Upload documents", "Diagnosis, lab reports, prescriptions, scans, pictures and a government ID. Videos and referral letters are optional."],
      ["Submit and track", "Your application is sent to the hospital. Track status, funds raised and treatment progress from your dashboard."],
    ],
  },
  {
    audience: "For hospitals",
    steps: [
      ["Receive the application", "Your reviewer is notified and opens the patient story, medical reports, identity documents and images."],
      ["Complete the assessment", "Record diagnosis, recommended investigations and procedure, expected admission, urgency and expected recovery."],
      ["Submit cost estimate", "Enter minimum and maximum costs for labs, imaging, medication, procedure, consumables, physiotherapy and other items."],
      ["Review the AI treatment plan", "The system drafts a diagnosis summary, investigations, timeline, medication schedule and milestones for your approval."],
      ["Approve the recommended goal", "FundEzer recommends a target around 20% above your maximum estimate. Approve it, or reject with a reason."],
      ["Update treatment and get paid", "Post progress, upload images and receive payments against completed treatment milestones."],
    ],
  },
  {
    audience: "For donors",
    steps: [
      ["Browse verified campaigns", "Search by hospital, condition, location or amount needed. Every listing carries a hospital verified badge."],
      ["Give with card or transfer", "Choose an amount and pay securely. Mobile wallet payments arrive in a later phase."],
      ["Get your receipt", "You receive a receipt and a thank-you message immediately after donating."],
      ["Follow the treatment", "Hospitals post treatment updates and progress images so you see exactly what your money did."],
    ],
  },
];

function HowItWorks() {
  return (
    <PageShell>
      <PageHero
        eyebrow="How it works"
        title="Verified before published. Paid to hospitals, not people."
        description="FundEzer sits between patients, hospitals and donors. Nothing goes live until a hospital has assessed the case and our fraud engine has screened it."
      />

      <section className="container-page space-y-16 py-16">
        {tracks.map((track) => (
          <div key={track.audience}>
            <h2 className="text-2xl font-semibold text-foreground md:text-3xl">{track.audience}</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {track.steps.map(([title, body], i) => (
                <div key={title} className="surface-card p-6">
                  <span className="font-display text-sm font-semibold text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 font-display text-base font-semibold text-foreground">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="surface-card p-8">
          <h2 className="text-2xl font-semibold text-foreground">AI fraud screening</h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Every application is scored from 0 to 100 before it can be published. High-risk cases go
            to a human fraud analyst for manual review.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Duplicate stories",
              "Duplicate images",
              "Duplicate IDs",
              "Duplicate hospital reports",
              "Image manipulation",
              "Document forgery",
              "Metadata comparison",
              "AI-generated documents",
              "Suspicious devices",
              "Repeated phone numbers",
              "Repeated NIN",
              "Repeated campaigns",
            ].map((item) => (
              <li
                key={item}
                className="rounded-xl bg-muted px-4 py-3 text-sm font-medium text-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/apply"
            className="rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft"
          >
            Apply for sponsorship
          </Link>
          <Link
            to="/campaigns"
            className="rounded-full border border-primary/30 px-6 py-3.5 text-sm font-semibold text-primary"
          >
            Browse campaigns
          </Link>
        </div>
      </section>
    </PageShell>
  );
}