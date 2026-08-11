import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  FileSearch,
  HandHeart,
  HeartHandshake,
  Repeat,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/partner-hero.jpg";
import transparencyImage from "@/assets/partner-transparency.jpg";
import safetyNetImage from "@/assets/partner-safetynet.jpg";
import organisationsImage from "@/assets/partner-organisations.jpg";

export const Route = createFileRoute("/partner-donor")({
  component: PartnerDonor,
  head: () => ({
    meta: [
      { title: "Become a Fundezer website Partner Donor" },
      {
        name: "description",
        content:
          "Support verified medical campaigns as an individual, a recurring donor, or a corporate/organisation partner.",
      },
      { property: "og:title", content: "Become a Fundezer website Partner Donor" },
      {
        property: "og:description",
        content:
          "Support verified medical campaigns as an individual, a recurring donor, or a corporate/organisation partner.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://fundezer-sparkle.lovable.app/partner-donor" },
    ],
    links: [{ rel: "canonical", href: "https://fundezer-sparkle.lovable.app/partner-donor" }],
  }),
});

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const heroBeats = [
  "Every day, someone walks into a hospital hoping for good news. Sometimes they get it.",
  "Sometimes, the doctor says, \u201cWe can treat this.\u201d And then comes the question that can change everything: \u201cHow much will it cost?\u201d",
  "For some families, the answer is more than they can afford. Treatment is delayed. A procedure is postponed.",
  "A patient goes home to look for money \u2014 calling relatives, friends, churches, colleagues, anyone who might help. And while they\u2019re looking, the clock keeps moving.",
  "FundEzer was created to change that. Every campaign is connected to a verified hospital, and donations go toward the patient\u2019s medical care \u2014 never handed directly to the patient.",
  "Your generosity can go beyond simply giving. You can help make treatment possible.",
];

const trustItems = [
  { icon: Building2, title: "Campaigns connected to verified hospitals" },
  { icon: FileSearch, title: "Medical information and documentation reviewed during verification" },
  { icon: Sparkles, title: "Technology that flags suspicious or potentially fraudulent campaigns" },
  { icon: BadgeCheck, title: "Donors receive updates as treatment progresses" },
];

const fundable = [
  "Diagnostic investigations",
  "Laboratory tests",
  "Imaging and scans",
  "Surgical procedures",
  "Medical treatment",
  "Medication",
  "Hospital care",
  "Physiotherapy",
  "Follow-up treatment",
  "Other medically necessary services",
];

const orgProgrammes = [
  ["Employee Giving", "Enable employees to contribute towards verified medical campaigns."],
  ["Corporate Sponsorship", "Sponsor patients or specific categories of medical treatment."],
  ["Matching Donations", "Match contributions made by employees, customers or the public."],
  [
    "Foundation & NGO Funding",
    "Support verified healthcare needs through structured funding programmes.",
  ],
  [
    "Community Giving",
    "Bring your community together around a shared commitment to helping people access treatment.",
  ],
];

const interestOptions = [
  "Support individual patients",
  "Become a recurring donor",
  "Explore corporate/organisation partnership",
  "Receive FundEzer impact updates",
];

const staggeredLines = [
  "It could be someone\u2019s mother.",
  "Someone\u2019s father.",
  "Someone\u2019s child.",
  "Someone\u2019s brother.",
  "Someone\u2019s sister.",
  "Someone\u2019s friend.",
  "Or someone you\u2019ve never met.",
];

function PartnerDonor() {
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      const t = window.setTimeout(() => scrollToId(hash), 120);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, []);

  return (
    <PageShell>
      {/* 1. Hero */}
      <section className="border-b border-border bg-[image:var(--gradient-soft)]">
        <div className="container-page grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Partner donors
            </p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-[1.1] text-foreground md:text-5xl">
              You may not know their name. But you can still change their story.
            </h1>
            <div className="mt-6 max-w-xl space-y-3">
              {heroBeats.map((line) => (
                <p key={line} className="text-base leading-relaxed text-muted-foreground md:text-lg">
                  {line}
                </p>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <button
                type="button"
                onClick={() => scrollToId("join")}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lift transition-transform hover:-translate-y-0.5"
              >
                Become a Partner Donor <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollToId("ways-to-help")}
                className="text-sm font-semibold text-primary hover:underline"
              >
                See ways to give
              </button>
            </div>
          </div>

          <div className="relative">
            <img
              src={heroImage}
              alt="A nurse holding the hand of a smiling patient in a hospital ward"
              width={1280}
              height={1280}
              className="aspect-4/5 w-full rounded-3xl object-cover shadow-lift sm:aspect-square lg:aspect-4/5"
            />
            <div className="absolute -bottom-6 left-4 right-4 rounded-2xl border border-border bg-card/95 p-5 shadow-lift backdrop-blur sm:left-8 sm:right-auto sm:max-w-xs">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-primary-deep" />
                <p className="text-sm font-medium leading-snug text-foreground">
                  Every campaign is connected to a verified hospital &mdash; funds go to care, never
                  cash.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* 2. What if help was already there */}
      <section className="container-page py-20 md:py-24">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-semibold text-foreground md:text-4xl">
            What if help was already there?
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
            Imagine a world where a patient who cannot afford treatment doesn&rsquo;t have to start
            from zero. Imagine that when a verified patient needs help, there is already a community
            of people willing to step forward. That&rsquo;s what we&rsquo;re building. When you
            become a FundEzer Partner Donor, you become part of that community &mdash; supporting
            individual campaigns when they speak to you, or giving consistently as a recurring
            donor.
          </p>
        </div>

        <dl className="mt-12 grid max-w-2xl grid-cols-3 gap-6">
          {["₦1,000", "₦10,000", "₦50,000"].map((value) => (
            <div key={value}>
              <dt className="font-display text-2xl font-semibold text-foreground">{value}</dt>
              <dd className="mt-1 text-xs leading-snug text-muted-foreground">
                can be a contribution
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-12 max-w-2xl text-xl font-semibold text-foreground md:text-2xl">
          One person doesn&rsquo;t have to carry the entire burden alone.
        </p>
      </section>

      {/* 3. Choose how you want to help */}
      <section id="ways-to-help" className="scroll-mt-24 border-y border-border bg-card py-20 md:py-24">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Ways to give
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-foreground md:text-4xl">
              Choose how you want to help
            </h2>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            <div className="surface-card flex flex-col p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary-deep">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-display text-xl font-semibold text-foreground">
                Support when you can
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                See verified medical campaigns and choose the patients or treatments you want to
                support.
              </p>
              <Link
                to="/campaigns"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
              >
                I want to help a patient
              </Link>
            </div>

            <div className="surface-card flex flex-col p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary-deep">
                <Repeat className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-display text-xl font-semibold text-foreground">
                Become a recurring donor
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                Set aside an amount you&rsquo;re comfortable giving regularly. Your recurring
                contribution helps create a more dependable pool of support for patients who need
                medical funding.
              </p>
              <button
                type="button"
                onClick={() => scrollToId("join")}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
              >
                Become a recurring donor
              </button>
            </div>

            <div className="surface-card flex flex-col p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary-deep">
                <HandHeart className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-display text-xl font-semibold text-foreground">
                Become a Partner Donor
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                Are you a company, foundation, NGO, church, community, or professional association?
                Partner with FundEzer to support healthcare funding at a larger scale &mdash;
                sponsor campaigns, fund specific medical needs, or create a structured giving
                programme.
              </p>
              <button
                type="button"
                onClick={() => scrollToId("for-organisations")}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
              >
                Become a partner
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Transparency */}
      <section className="container-page py-20 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <h2 className="text-3xl font-semibold text-foreground md:text-4xl">
              Your giving should not disappear into a black hole
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
              One of the biggest problems with informal medical fundraising isn&rsquo;t a lack of
              generosity. It&rsquo;s a lack of trust. You give money and wonder: Did it reach the
              person? Was the medical need genuine? Was the money actually used for treatment?
              FundEzer is designed around transparency.
            </p>
          </div>
          <img
            src={transparencyImage}
            alt="A doctor reviewing medical scans and documentation during verification"
            width={1280}
            height={960}
            loading="lazy"
            className="aspect-4/3 w-full rounded-3xl object-cover shadow-lift"
          />
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item) => (
            <div key={item.title} className="surface-card p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary-deep">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-base font-semibold text-foreground">
                {item.title}
              </h3>
            </div>
          ))}
        </div>
        <p className="mt-10 max-w-2xl text-lg font-semibold text-foreground">
          You give. We help you see the difference your giving is making.
        </p>
      </section>

      {/* 5. Safety net */}
      <section className="border-y border-border bg-card py-20 md:py-24">
        <div className="container-page grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <h2 className="text-3xl font-semibold text-foreground md:text-4xl">
              Don&rsquo;t just give once. Help build a safety net.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
              Medical emergencies don&rsquo;t send invitations. A person can be perfectly healthy
              today and need urgent treatment tomorrow &mdash; a child gets sick, a parent needs
              surgery, a young person has an accident, a family faces a bill they never planned for.
              We cannot know who will need help next. But we can build a community that&rsquo;s
              ready when that moment comes.
            </p>
          </div>
          <div className="relative overflow-hidden rounded-3xl shadow-lift">
            <img
              src={safetyNetImage}
              alt="A family embracing in a hospital corridor after receiving good news"
              width={1280}
              height={960}
              loading="lazy"
              className="aspect-4/3 w-full object-cover"
            />
            <blockquote className="absolute inset-x-4 bottom-4 rounded-2xl border border-primary/30 bg-card/95 p-6 backdrop-blur">
              <ShieldCheck className="h-6 w-6 text-primary-deep" />
              <p className="mt-3 font-display text-lg leading-relaxed text-foreground">
                Your recurring donation helps us move from &ldquo;Who can help this person?&rdquo;
                to &ldquo;How can we help this person?&rdquo;
              </p>
            </blockquote>
          </div>

        </div>
      </section>

      {/* 6. What support can fund */}
      <section className="container-page py-20 md:py-24">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-semibold text-foreground md:text-4xl">
            What your support can help fund
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
            Depending on the verified patient&rsquo;s needs and hospital assessment, FundEzer
            campaigns may support medical costs such as:
          </p>
        </div>
        <ul className="mt-10 grid max-w-3xl gap-x-10 gap-y-3 sm:grid-cols-2">
          {fundable.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-foreground">
              <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-8 text-xs text-muted-foreground">
          Your donation is linked to a specific verified campaign or funding programme.
        </p>
      </section>

      {/* 7. Signup */}
      <SignupSection />

      {/* 8. For organisations */}
      <section id="for-organisations" className="container-page scroll-mt-24 py-20 md:py-24">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            For organisations
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-foreground md:text-4xl">
            Your organisation can help make healthcare more accessible.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
            Companies, foundations, NGOs, religious organisations, associations and community groups
            can partner with FundEzer to create a structured healthcare giving programme. Together,
            we can build programmes around:
          </p>
        </div>
        <img
          src={organisationsImage}
          alt="A corporate team volunteering together for a healthcare giving programme"
          width={1280}
          height={864}
          loading="lazy"
          className="mt-10 aspect-21/9 w-full rounded-3xl object-cover shadow-lift"
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {orgProgrammes.map(([title, body]) => (
            <div key={title} className="surface-card p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary-deep">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-lg font-semibold text-foreground">
          Let&rsquo;s turn corporate giving into measurable healthcare impact.
        </p>
        <button
          type="button"
          onClick={() => scrollToId("join")}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lift transition-transform hover:-translate-y-0.5"
        >
          Become a Partner Donor <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      {/* 9. Closing CTA */}
      <section className="container-page pb-20 md:pb-24">
        <div className="overflow-hidden rounded-3xl bg-[image:var(--gradient-primary)] px-8 py-14 text-center md:px-16">
          <HeartHandshake className="mx-auto h-10 w-10 text-primary-foreground/90" />
          <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-semibold text-primary-foreground md:text-4xl">
            The next person who needs help could be someone&rsquo;s everything.
          </h2>
          <div className="mx-auto mt-8 max-w-md space-y-1.5">
            {staggeredLines.map((line, i) => (
              <p
                key={line}
                className="text-primary-foreground/90"
                style={{ opacity: 1 - i * 0.07 }}
              >
                {line}
              </p>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-xl text-primary-foreground/85">
            You may never know their name. You may never meet them. But your contribution could help
            give them something priceless: a chance to receive the treatment they need.
          </p>
          <p className="mx-auto mt-6 max-w-xl text-lg font-semibold text-primary-foreground">
            Be the reason help is available when it matters.
          </p>
          <button
            type="button"
            onClick={() => scrollToId("join")}
            className="mt-8 rounded-full bg-card px-6 py-3.5 text-sm font-semibold text-primary shadow-soft"
          >
            I&rsquo;m Ready to Help
          </button>
          <p className="mt-6 text-xs text-primary-foreground/80">
            Empowering Hospitals. Enabling Patients. Saving Lives.
          </p>
        </div>
      </section>
    </PageShell>
  );
}

const field =
  "mt-1.5 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary";

function SignupSection() {
  const [email, setEmail] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggle = (option: string) =>
    setInterests((prev) =>
      prev.includes(option) ? prev.filter((i) => i !== option) : [...prev, option],
    );

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) || trimmed.length > 255) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from("partner_donor_signups")
      .insert({ email: trimmed, interests });
    setSubmitting(false);
    if (error) {
      toast.error("Something went wrong. Please try again.");
      return;
    }
    toast.success("Welcome to the FundEzer donor community.");
    setEmail("");
    setInterests([]);
  };

  return (
    <section id="join" className="scroll-mt-24 border-y border-border bg-card py-20 md:py-24">
      <div className="container-page grid gap-12 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Stay connected to the impact
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-foreground md:text-4xl">
            Your email. Your connection to the impact.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
            When you provide your email address, you can receive updates on your FundEzer donations
            &mdash; confirmations, campaign progress, funding milestones, treatment updates where
            available, completion updates, impact stories, and news about new patients who need
            support. You won&rsquo;t just know that you gave &mdash; you&rsquo;ll be able to follow
            the journey.
          </p>
        </div>

        <form onSubmit={onSubmit} className="surface-card p-6 md:p-8">
          <label className="block text-sm font-medium text-foreground">
            Email address
            <input
              type="email"
              required
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={field}
            />
          </label>

          <fieldset className="mt-6">
            <legend className="text-sm font-medium text-foreground">I would like to:</legend>
            <div className="mt-3 space-y-2.5">
              {interestOptions.map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-3 text-sm text-muted-foreground"
                >
                  <input
                    type="checkbox"
                    checked={interests.includes(option)}
                    onChange={() => toggle(option)}
                    className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
                  />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={submitting}
            className="mt-7 w-full rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Join the FundEzer Donor Community"}
          </button>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            By submitting your email, you agree to receive FundEzer donation and impact updates. You
            can unsubscribe at any time.
          </p>
        </form>
      </div>
    </section>
  );
}
