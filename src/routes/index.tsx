import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Building2,
  HandHeart,
  HeartHandshake,
  Repeat,
  ShieldCheck,
  Sparkles,
  Wallet,
  ArrowRight,
} from "lucide-react";

import { PageShell } from "@/components/site/PageShell";
import { CampaignCard } from "@/components/site/CampaignCard";
import { campaigns, hospitals } from "@/lib/data";
import heroImage from "@/assets/hero-care.jpg";
import donorKnownImage from "@/assets/donor-known.jpg";
import donorStrangerImage from "@/assets/donor-stranger.jpg";
import donorCorporateImage from "@/assets/donor-corporate.jpg";
import donorSpontaneousImage from "@/assets/donor-spontaneous.jpg";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Fundezer website" },
      {
        name: "description",
        content:
          "Fund verified patient treatments in Abuja. Every donation goes directly to the partner hospital, tracked in real time. Help from all.",
      },
      { property: "og:title", content: "Fundezer website" },
      {
        property: "og:description",
        content:
          "Fund verified patient treatments in Abuja. Every donation goes directly to the partner hospital, tracked in real time. Help from all.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

const pillars = [
  {
    icon: ShieldCheck,
    title: "Funds never touch individual accounts",
    body: "Donations are paid directly to the verified hospital treating the patient never to an individual's account.",
  },
  {
    icon: Building2,
    title: "Hospitals validate every case",
    body: "A partner hospital reviews documents, writes the clinical assessment and approves the cost estimate before a campaign exists.",
  },
  {
    icon: Sparkles,
    title: "AI screens for fraud",
    body: "Duplicate stories, manipulated images, forged documents and repeated identities are flagged and risk-scored before publication.",
  },
  {
    icon: Wallet,
    title: "A wallet per campaign",
    body: "Goal, funds raised, payments made and remaining balance are visible to everyone, released against treatment milestones.",
  },
];

const donorGroups = [
  {
    image: donorKnownImage,
    alt: "Family and friends gathered around a relative recovering from treatment",
    title: "Help Someone You Know",
    body: "When someone close to you needs medical care, you can rally your family, friends, colleagues, and community around their treatment. Support their verified FundEzer campaign and help them get the care they need.",
    cta: "Support Someone You Know",
    to: "/campaigns",
  },
  {
    image: donorStrangerImage,
    alt: "Neighbours in a community sharing support with one another",
    title: "Help Someone You May Never Meet",
    body: "You don\u2019t have to know a patient to make a difference. Explore verified medical campaigns and contribute to people who need support, wherever their story may be.",
    cta: "Support a Patient",
    to: "/campaigns",
  },
  {
    image: donorCorporateImage,
    alt: "A small team planning a community giving initiative together",
    title: "Make Healthcare Giving Go Further",
    body: "Companies and organisations can partner with FundEzer to support verified medical needs at scale. Sponsor campaigns, fund treatment programmes, or create a structured giving initiative for your organisation.",
    cta: "Become a Corporate Sponsor",
    to: "/partner-donor",
    hash: "for-organisations",
  },
  {
    image: donorSpontaneousImage,
    alt: "A woman making a donation from her phone in a cafe",
    title: "Give When You\u2019re Ready to Help",
    body: "Sometimes, you simply want to help. Stop by, discover verified patients who need support, and make a contribution toward someone\u2019s treatment.",
    cta: "Give Now",
    to: "/campaigns",
  },
] satisfies Array<{
  image: string;
  alt: string;
  title: string;
  body: string;
  cta: string;
  to: "/campaigns" | "/partner-donor";
  hash?: string;
}>;


function Index() {
  const featured = campaigns.slice(0, 3);

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-[image:var(--gradient-soft)]">
        <div className="container-page grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3.5 py-1.5 text-xs font-semibold text-primary-deep">
              <BadgeCheck className="h-3.5 w-3.5" /> Abuja pilot · 4 verified partner hospitals
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.05] text-foreground md:text-6xl">
              No patient should be turned away because they{" "}
              <span className="text-gradient">cannot afford care</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              FundEzer connects financially challenged patients with donors through verified
              hospital partnerships. Every naira you give is paid straight to the hospital;
              transparent, milestone-based, fraud-resistant.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/campaigns"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lift transition-transform hover:-translate-y-0.5"
              >
                Donate to a patient <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/apply"
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card px-6 py-3.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft"
              >
                Start a Campaign
              </Link>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6">
              {[
                ["₦42M+", "raised for treatment"],
                ["1,100+", "donors so far"],
                ["100%", "paid to hospitals"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="font-display text-2xl font-semibold text-foreground">{value}</dt>
                  <dd className="mt-1 text-xs leading-snug text-muted-foreground">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <img
              src={heroImage}
              alt="A nurse reassuring a patient in an Abuja partner hospital"
              width={1600}
              height={1200}
              className="w-full rounded-3xl object-cover shadow-lift"
            />
            <div className="absolute -bottom-6 left-6 right-12 rounded-2xl border border-border bg-card p-4 shadow-lift">
              <p className="flex items-center gap-2 text-xs font-semibold text-primary">
                <ShieldCheck className="h-4 w-4" /> Closed-loop payments
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Hospitals are paid as treatment milestones are completed and verified.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust pillars */}
      <section className="container-page py-20 md:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Why donors trust FundEzer
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-foreground md:text-4xl">
            Trust first, hospital-centric, transparent by design.
          </h2>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => (
            <div key={p.title} className="surface-card p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary-deep">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-base font-semibold text-foreground">
                {p.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured campaigns */}
      <section className="border-y border-border bg-card py-20 md:py-24">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Verified campaigns
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-foreground md:text-4xl">
                Patients waiting for treatment today
              </h2>
            </div>
            <Link
              to="/campaigns"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              Browse all campaigns <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-page py-20 md:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-foreground md:text-4xl">
            From application to treatment in six guided steps
          </h2>
        </div>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            ["Patient applies", "Select Abuja and a partner hospital, register, and answer guided questions."],
            ["AI helps build the story", "Answers become a clear 200-word story the patient reviews and edits."],
            ["Hospital assesses", "Doctors add the diagnosis, plan and minimum/maximum cost estimate."],
            ["Goal recommended", "FundEzer suggests a target around 20% above the maximum estimate."],
            ["Campaign goes live", "After fraud screening and hospital approval, the campaign publishes."],
            ["Hospital gets paid", "Funds are released per milestone and progress is posted to donors."],
          ].map(([title, body], i) => (
            <li key={title} className="surface-card p-6">
              <span className="font-display text-sm font-semibold text-primary">
                Step {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 font-display text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10">
          <Link
            to="/how-it-works"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            See the full workflow <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Ways to give */}
      <section className="border-y border-border bg-card py-20 md:py-24">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Ways to give
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-foreground md:text-4xl">
              Give beyond a single campaign.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Support the patients in front of you today, or help build a safety net for the ones
              who&rsquo;ll need it tomorrow.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="surface-card flex flex-col p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary-deep">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-base font-semibold text-foreground">
                Support when you can
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                See verified medical campaigns and choose the patients or treatments you want to
                support.
              </p>
              <Link
                to="/campaigns"
                className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
              >
                I want to help a patient
              </Link>
            </div>

            <div className="surface-card flex flex-col p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary-deep">
                <Repeat className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-base font-semibold text-foreground">
                Become a recurring donor
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                Set aside an amount you&rsquo;re comfortable giving regularly and help build a
                dependable pool of support.
              </p>
              <Link
                to="/partner-donor"
                hash="join"
                className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
              >
                Become a recurring donor
              </Link>
            </div>

            <div className="surface-card flex flex-col p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary-deep">
                <HandHeart className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-base font-semibold text-foreground">
                Become a Partner Donor
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                Companies, foundations, NGOs, churches and associations can partner with FundEzer to
                fund healthcare at scale.
              </p>
              <Link
                to="/partner-donor"
                className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
              >
                Become a partner
              </Link>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/partner-donor"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              Learn more about all the ways to give <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Different people, one purpose */}
      <section className="container-page py-20 md:py-24">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold text-foreground md:text-4xl">
            Different People. One Purpose.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Whether you&rsquo;re supporting someone you know or helping someone you&rsquo;ve never
            met, every contribution can help make treatment possible.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {donorGroups.map((g) => (
            <article
              key={g.title}
              className="surface-card group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="overflow-hidden">
                <img
                  src={g.image}
                  alt={g.alt}
                  width={1024}
                  height={768}
                  loading="lazy"
                  className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-display text-base font-semibold text-foreground">{g.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {g.body}
                </p>
                <Link
                  to={g.to}
                  hash={g.hash}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:bg-primary-deep hover:-translate-y-0.5"
                >
                  {g.cta}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Hospitals strip */}


      <section className="border-y border-border bg-card py-16">
        <div className="container-page">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Founding partner hospitals · Abuja
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {hospitals.map((h) => (
              <div key={h.id} className="rounded-2xl border border-border p-5 text-center">
                <p className="font-display font-semibold text-foreground">{h.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{h.area}</p>
                <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified partner
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-20 md:py-24">
        <div className="overflow-hidden rounded-3xl bg-[image:var(--gradient-primary)] px-8 py-14 text-center md:px-16">
          <HeartHandshake className="mx-auto h-10 w-10 text-primary-foreground/90" />
          <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-semibold text-primary-foreground md:text-4xl">
            Help from all. Treatment for one patient at a time.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/85">
            Give to a verified campaign, or bring your hospital onto the platform and stop losing
            patients to unpaid bills.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/campaigns"
              className="rounded-full bg-card px-6 py-3.5 text-sm font-semibold text-primary shadow-soft"
            >
              Donate now
            </Link>
            <Link
              to="/contact"
              className="rounded-full border border-primary-foreground/40 px-6 py-3.5 text-sm font-semibold text-primary-foreground"
            >
              Partner with us
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
