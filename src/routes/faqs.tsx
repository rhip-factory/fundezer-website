import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { PageShell, PageHero } from "@/components/site/PageShell";
import { faqs } from "@/lib/data";

export const Route = createFileRoute("/faqs")({
  component: Faqs,
  head: () => ({
    meta: [
      { title: "FAQs — how donations, verification and payouts work | Fundezer website" },
      {
        name: "description",
        content:
          "Answers about FundEzer verification, hospital payouts, campaign goals, payment methods and applying for sponsorship in Abuja.",
      },
      { property: "og:title", content: "Fundezer website FAQs" },
      {
        property: "og:description",
        content: "Common questions about donating to and applying for FundEzer campaigns.",
      },
      { property: "og:url", content: "/faqs" },
    ],
    links: [{ rel: "canonical", href: "/faqs" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
});

function Faqs() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <PageShell>
      <PageHero
        eyebrow="FAQs"
        title="Questions donors, patients and hospitals ask us"
        description="If your question is not answered here, our team in Abuja will respond within one working day."
      />

      <section className="container-page max-w-3xl py-16">
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={f.q} className="surface-card overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="font-display font-semibold text-foreground">{f.q}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-primary transition-transform ${open === i ? "rotate-180" : ""}`}
                />
              </button>
              {open === i && (
                <p className="border-t border-border px-6 py-5 text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}