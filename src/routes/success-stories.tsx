import { createFileRoute, Link } from "@tanstack/react-router";
import { Quote } from "lucide-react";
import { PageShell, PageHero } from "@/components/site/PageShell";
import { successStories, formatShort } from "@/lib/data";

export const Route = createFileRoute("/success-stories")({
  component: SuccessStories,
  head: () => ({
    meta: [
      { title: "Success stories — patients treated through FundEzer" },
      {
        name: "description",
        content:
          "Read from patients whose treatment was fully funded through FundEzer campaigns and paid directly to their Abuja partner hospital.",
      },
      { property: "og:title", content: "Success stories — FundEzer" },
      {
        property: "og:description",
        content: "Patients treated because donors funded verified hospital campaigns.",
      },
      { property: "og:url", content: "/success-stories" },
    ],
    links: [{ rel: "canonical", href: "/success-stories" }],
  }),
});

function SuccessStories() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Success stories"
        title="Treatment completed. Bills paid. Lives continuing."
        description="Every story below started as a hospital-verified campaign and ended with funds paid directly to the treating hospital."
      />

      <section className="container-page py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {successStories.map((s) => (
            <article key={s.name} className="surface-card flex flex-col p-7">
              <Quote className="h-7 w-7 text-primary/40" />
              <p className="mt-4 flex-1 leading-relaxed text-foreground">"{s.quote}"</p>
              <div className="mt-6 border-t border-border pt-5">
                <p className="font-display font-semibold text-foreground">{s.name}</p>
                <p className="text-sm text-muted-foreground">
                  {s.condition} · {s.hospital}
                </p>
                <p className="mt-3 text-sm font-semibold text-primary">
                  {formatShort(s.raised)} raised from {s.donors} donors
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-3xl bg-[image:var(--gradient-primary)] px-8 py-12 text-center">
          <h2 className="text-3xl font-semibold text-primary-foreground">
            The next story is waiting for funding
          </h2>
          <Link
            to="/campaigns"
            className="mt-6 inline-block rounded-full bg-card px-6 py-3.5 text-sm font-semibold text-primary"
          >
            Browse open campaigns
          </Link>
        </div>
      </section>
    </PageShell>
  );
}