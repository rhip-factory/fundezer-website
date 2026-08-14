import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  Loader2,
  Lock,
  Paperclip,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { hospitals } from "@/lib/data";
import { generateStory } from "@/lib/story.functions";

export const Route = createFileRoute("/apply")({
  component: Apply,
  head: () => ({
    meta: [
      { title: "Apply for treatment sponsorship — Fundezer website" },
      {
        name: "description",
        content:
          "Start a hospital-verified sponsorship request in Abuja. Register, answer guided questions, review your AI-written story and upload your medical documents.",
      },
      { property: "og:title", content: "Apply for sponsorship — Fundezer website" },
      {
        property: "og:description",
        content: "Begin a verified treatment sponsorship request with an Abuja partner hospital.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "/apply" },
    ],
    links: [{ rel: "canonical", href: "/apply" }],
  }),
});

const steps = [
  { title: "Create account", blurb: "So you can save and track your campaign" },
  { title: "Location", blurb: "Where treatment will happen" },
  { title: "Hospital", blurb: "Your verifying partner hospital" },
  { title: "Your details", blurb: "Patient and next-of-kin information" },
  { title: "Medical story", blurb: "Answer questions, we draft the story" },
  { title: "Documents", blurb: "Proof for hospital verification" },
  { title: "Review", blurb: "Check everything and submit" },
];

const contactRelationships = [
  "Spouse",
  "Parent",
  "Child",
  "Sibling",
  "Other relative",
  "Friend",
  "Guardian",
];

const storyQuestions = [
  { q: "What illness do you have?", hint: "e.g. Stage 2 breast cancer" },
  { q: "When were you diagnosed?", hint: "e.g. March 2025" },
  { q: "Who diagnosed you?", hint: "Doctor or hospital name" },
  { q: "Have you received treatment before?", hint: "What has been done so far" },
  { q: "How does the illness affect your life?", hint: "Work, family, daily routine" },
  { q: "Why do you need financial support?", hint: "Your situation in one or two lines" },
  { q: "What happens if treatment is delayed?", hint: "What your doctor has told you" },
];

const requiredDocs = ["Diagnosis", "Lab reports", "Prescriptions", "Scans", "Pictures", "Government ID"];
const optionalDocs = ["Videos", "Referral letters", "Other supporting documents"];

const tones = ["Warm and hopeful", "Calm and factual", "Urgent but dignified"] as const;
type Tone = (typeof tones)[number];

const field =
  "mt-1.5 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15";

const DRAFT_KEY = "fundezer.apply.draft.v1";

function Label({ children, optional }: { children: string; optional?: boolean }) {
  return (
    <span className="text-xs font-semibold text-muted-foreground">
      {children}
      {optional && <span className="ml-1 font-normal text-muted-foreground/70">(optional)</span>}
    </span>
  );
}

function FieldError({ children }: { children?: string | undefined }) {
  if (!children) return null;
  return (
    <span className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive">
      <AlertCircle className="h-3.5 w-3.5" /> {children}
    </span>
  );
}

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

type Errors = {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirm?: string;
  account?: string;
  state?: string;
  hospital?: string;
  dFullName?: string;
  dEmail?: string;
  dPhone?: string;
  dAddress?: string;
  story?: string;
};

type Details = {
  fullName: string;
  email: string;
  phone: string;
  nin: string;
  dob: string;
  gender: string;
  address: string;
};

function Apply() {
  const runGenerate = useServerFn(generateStory);

  const [step, setStep] = useState(0);
  const [state, setState] = useState("Abuja (FCT)");
  const [hospital, setHospital] = useState("");
  const [answers, setAnswers] = useState<string[]>(Array(storyQuestions.length).fill(""));
  const [tone, setTone] = useState<Tone>("Warm and hopeful");
  const [story, setStory] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiWritten, setAiWritten] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [docs, setDocs] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Errors>({});
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [account, setAccount] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [accountCreated, setAccountCreated] = useState(false);
  const [details, setDetails] = useState<Details>({
    fullName: "",
    email: "",
    phone: "",
    nin: "",
    dob: "",
    gender: "Female",
    address: "",
  });
  const topRef = useRef<HTMLDivElement>(null);
  const hydrated = useRef(false);

  const outsideAbuja = state !== "Abuja (FCT)";
  const answered = answers.filter((a) => a.trim()).length;
  const requiredUploaded = requiredDocs.filter((d) => docs[d]).length;
  const words = wordCount(story);
  const progress = Math.round((step / (steps.length - 1)) * 100);

  // Restore draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.state) setState(d.state);
        if (d.hospital) setHospital(d.hospital);
        if (Array.isArray(d.answers)) setAnswers(d.answers);
        if (d.story) setStory(d.story);
        if (d.details) setDetails((p) => ({ ...p, ...d.details }));
        if (d.tone) setTone(d.tone);
      }
    } catch {
      /* ignore */
    }
    hydrated.current = true;
  }, []);

  // Autosave draft
  useEffect(() => {
    if (!hydrated.current) return;
    const id = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ state, hospital, answers, story, details, tone }),
        );
        setSavedAt(
          new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        );
      } catch {
        /* ignore */
      }
    }, 600);
    return () => clearTimeout(id);
  }, [state, hospital, answers, story, details, tone]);

  function createAccount() {
    const { fullName, email, phone, password, confirm } = account;
    const next: Errors = {};
    if (!fullName.trim()) next.fullName = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid email address.";
    if (!/^(\+?234|0)[7-9][0-1]\d{8}$/.test(phone.trim().replace(/\s/g, "")))
      next.phone = "Enter a valid Nigerian number, e.g. 0808 888 8306.";
    if (password.length < 8) next.password = "Use at least 8 characters.";
    if (password !== confirm) next.confirm = "Passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setAccountCreated(true);
    setDetails((p) => ({
      ...p,
      fullName: p.fullName || fullName,
      email: p.email || email,
      phone: p.phone || phone,
    }));
    toast.success("Account created — your progress is saved as you go.");
  }

  async function makeStory() {
    if (!answers[0]?.trim()) {
      setErrors({ story: "Tell us what illness you have first." });
      toast.error("Answer the first question to generate your story.");
      return;
    }
    setErrors({});
    setGenerating(true);
    try {
      const res = await runGenerate({
        data: { answers, tone, hospital, patientName: details.fullName || account.fullName },
      });
      setStory(res.story);
      setAiWritten(res.ai);
      toast.success(
        res.ai ? "Draft written — edit it freely." : "Draft created from your answers — edit freely.",
      );
    } catch {
      toast.error("We could not write the story just now. Try again in a moment.");
    } finally {
      setGenerating(false);
    }
  }

  function validateStep(i: number) {
    const next: Errors = {};
    if (i === 0 && !accountCreated) next.account = "Create your account to continue.";
    if (i === 1 && outsideAbuja) next.state = "FundEzer is only available in Abuja (FCT) today.";
    if (i === 2 && !hospital) next.hospital = "Choose the hospital that will treat you.";
    if (i === 3) {
      if (!details.fullName.trim()) next.dFullName = "Enter the patient's full name.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim()))
        next.dEmail = "Enter a valid email address.";
      if (!details.phone.trim()) next.dPhone = "Enter a phone number.";
      if (!details.address.trim()) next.dAddress = "Enter a residential address.";
    }
    if (i === 4 && wordCount(story) < 40)
      next.story = "Generate or write a story of at least 40 words.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function go(to: number) {
    if (to > step && !validateStep(step)) return;
    setStep(to);
    setErrors({});
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const summary = useMemo(
    () => [
      ["Patient", details.fullName || "Not provided"],
      ["Contact", details.email || "Not provided"],
      ["Location", state],
      ["Hospital", hospital || "Not selected"],
      ["Story", story ? `${words} words${aiWritten ? " · AI drafted" : ""}` : "Not drafted"],
      ["Required documents", `${requiredUploaded} of ${requiredDocs.length} attached`],
    ],
    [details, state, hospital, story, words, aiWritten, requiredUploaded],
  );

  if (submitted) {
    return (
      <PageShell>
        <section className="container-page max-w-2xl py-24 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary-deep">
            <Check className="h-7 w-7" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-semibold text-foreground">
            Application submitted
          </h1>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Status: <strong className="text-foreground">Submitted · Hospital notified</strong>.{" "}
            {hospital || "Your hospital"} will review your documents and complete a clinical
            assessment.
          </p>
          <ol className="mt-10 space-y-4 text-left">
            {[
              ["Fraud screening", "Automated checks on your identity and documents · 24 hours"],
              ["Hospital assessment", `${hospital || "Your hospital"} confirms diagnosis and cost · 2–4 days`],
              ["Campaign goes live", "You get a shareable link and live funding tracker"],
            ].map(([t, d], i) => (
              <li key={t} className="surface-card flex gap-4 p-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-deep">
                  {i + 1}
                </span>
                <div>
                  <p className="font-display font-semibold text-foreground">{t}</p>
                  <p className="text-sm text-muted-foreground">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div ref={topRef} />

      {/* Compact hero + sticky progress */}
      <section className="border-b border-border bg-[image:var(--gradient-soft)]">
        <div className="container-page py-12 md:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Start a campaign
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-[1.1] text-foreground md:text-4xl">
            {steps[step]?.title}
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">{steps[step]?.blurb}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Private until your hospital approves
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Funds paid to the hospital
            </span>
            {savedAt && (
              <span className="inline-flex items-center gap-1.5 text-primary">
                <Check className="h-3.5 w-3.5" /> Draft saved {savedAt}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="container-page py-3">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>
              Step {step + 1} of {steps.length}
            </span>
            <span>{progress}% complete</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.max(progress, 4)}%` }}
            />
          </div>
        </div>
      </div>

      <section className="container-page grid gap-10 py-12 lg:grid-cols-[240px_1fr]">
        {/* Step rail */}
        <nav aria-label="Application steps" className="hidden lg:block">
          <ol className="sticky top-24 space-y-1">
            {steps.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <li key={s.title}>
                  <button
                    type="button"
                    onClick={() => (i < step ? go(i) : undefined)}
                    disabled={i > step}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                      active
                        ? "bg-primary-soft font-semibold text-primary-deep"
                        : done
                          ? "text-foreground hover:bg-muted"
                          : "text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                        done
                          ? "bg-primary text-primary-foreground"
                          : active
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                    {s.title}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="max-w-3xl">
          <div className="surface-card p-6 md:p-8">
            {step === 0 && (
              <div className="space-y-5">
                <p className="text-sm text-muted-foreground">
                  Sign up first so your application is saved and you can follow hospital review and
                  funds raised.
                </p>
                <div className="grid gap-5 sm:grid-cols-2">
                  {(
                    [
                      ["Full name", "fullName", "text", "Amina Kabir"],
                      ["Email", "email", "email", "you@example.com"],
                      ["Phone number", "phone", "tel", "0808 888 8306"],
                      ["Password", "password", "password", "At least 8 characters"],
                    ] as const
                  ).map(([label, key, type, ph]) => (
                    <label key={key} className="block">
                      <Label>{label}</Label>
                      <input
                        type={type}
                        placeholder={ph}
                        value={account[key]}
                        disabled={accountCreated}
                        onChange={(e) => setAccount({ ...account, [key]: e.target.value })}
                        className={field}
                      />
                      <FieldError>{errors[key]}</FieldError>
                    </label>
                  ))}
                  <label className="block sm:col-span-2">
                    <Label>Confirm password</Label>
                    <input
                      type="password"
                      value={account.confirm}
                      disabled={accountCreated}
                      onChange={(e) => setAccount({ ...account, confirm: e.target.value })}
                      className={field}
                    />
                    <FieldError>{errors.confirm}</FieldError>
                  </label>
                </div>
                {accountCreated ? (
                  <p className="inline-flex items-center gap-2 rounded-xl bg-primary-soft px-4 py-3 text-sm font-semibold text-primary-deep">
                    <Check className="h-4 w-4" /> Account created. Continue to your campaign.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={createAccount}
                    className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
                  >
                    Sign up and continue
                  </button>
                )}
                <FieldError>{errors.account}</FieldError>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <label className="block">
                  <Label>Country</Label>
                  <select className={field} defaultValue="Nigeria">
                    <option>Nigeria</option>
                  </select>
                </label>
                <label className="block">
                  <Label>State</Label>
                  <select value={state} onChange={(e) => setState(e.target.value)} className={field}>
                    <option>Abuja (FCT)</option>
                    <option>Lagos</option>
                    <option>Kano</option>
                    <option>Rivers</option>
                    <option>Enugu</option>
                  </select>
                </label>
                {outsideAbuja && (
                  <p className="flex gap-2 rounded-xl bg-warning/15 p-4 text-sm text-foreground">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    FundEzer is currently available only in Abuja. Choose Abuja (FCT) to continue —
                    other states open as we onboard more hospitals.
                  </p>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="grid gap-3">
                  {hospitals.map((h) => {
                    const selected = hospital === h.name;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => setHospital(h.name)}
                        aria-pressed={selected}
                        className={`flex items-center justify-between gap-4 rounded-xl border p-4 text-left transition-all ${
                          selected
                            ? "border-primary bg-primary-soft shadow-soft"
                            : "border-input hover:-translate-y-0.5 hover:border-primary/40"
                        }`}
                      >
                        <span>
                          <span className="block font-display font-semibold text-foreground">
                            {h.name}
                          </span>
                          <span className="block text-sm text-muted-foreground">{h.area}</span>
                        </span>
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input"
                          }`}
                        >
                          {selected && <Check className="h-3.5 w-3.5" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <FieldError>{errors.hospital}</FieldError>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-5 sm:grid-cols-2">
                {(
                  [
                    ["Full name", "fullName", "text", "dFullName"],
                    ["Email", "email", "email", "dEmail"],
                    ["Phone", "phone", "tel", "dPhone"],
                    ["NIN", "nin", "text", undefined],
                    ["Date of birth", "dob", "date", undefined],
                  ] as const
                ).map(([label, key, type, err]) => (
                  <label key={key} className="block">
                    <Label>{label}</Label>
                    <input
                      type={type}
                      value={details[key]}
                      onChange={(e) => setDetails({ ...details, [key]: e.target.value })}
                      className={field}
                    />
                    <FieldError>{err ? errors[err] : undefined}</FieldError>
                  </label>
                ))}
                <label className="block">
                  <Label>Gender</Label>
                  <select
                    value={details.gender}
                    onChange={(e) => setDetails({ ...details, gender: e.target.value })}
                    className={field}
                  >
                    <option>Female</option>
                    <option>Male</option>
                    <option>Prefer not to say</option>
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <Label>Residential address</Label>
                  <input
                    type="text"
                    value={details.address}
                    onChange={(e) => setDetails({ ...details, address: e.target.value })}
                    className={field}
                  />
                  <FieldError>{errors.dAddress}</FieldError>
                </label>

                {(["Next of kin", "Emergency contact"] as const).map((group) => (
                  <div key={group} className="sm:col-span-2">
                    <h3 className="font-display text-base font-semibold text-foreground">{group}</h3>
                    <div className="mt-3 grid gap-5 sm:grid-cols-3">
                      <label className="block">
                        <Label>Relationship</Label>
                        <select className={field} defaultValue="">
                          <option value="" disabled>
                            Select relationship
                          </option>
                          {contactRelationships.map((r) => (
                            <option key={r}>{r}</option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <Label>Name</Label>
                        <input type="text" className={field} />
                      </label>
                      <label className="block">
                        <Label>Phone number</Label>
                        <input type="tel" className={field} />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="max-w-lg text-sm text-muted-foreground">
                    Answer in your own words — short is fine. Our AI writes a clear 150–200 word
                    story from your answers, and you can edit every line.
                  </p>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {answered}/{storyQuestions.length} answered
                  </span>
                </div>

                <div className="space-y-4">
                  {storyQuestions.map(({ q, hint }, i) => (
                    <label key={q} className="block">
                      <Label>{q}</Label>
                      <textarea
                        rows={2}
                        placeholder={hint}
                        value={answers[i]}
                        onChange={(e) => {
                          const next = [...answers];
                          next[i] = e.target.value;
                          setAnswers(next);
                        }}
                        className={field}
                      />
                    </label>
                  ))}
                </div>

                <div className="rounded-2xl border border-border bg-muted/40 p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <Label>Tone of voice</Label>
                    <div className="flex flex-wrap gap-2">
                      {tones.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTone(t)}
                          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                            tone === t
                              ? "bg-primary text-primary-foreground"
                              : "bg-card text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={makeStory}
                    disabled={generating}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Writing your story…
                      </>
                    ) : story ? (
                      <>
                        <RefreshCw className="h-4 w-4" /> Rewrite with this tone
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" /> Generate my story
                      </>
                    )}
                  </button>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Your answers are used only to write this story. Nothing medical is invented.
                  </p>
                </div>

                {generating && !story && (
                  <div className="space-y-2.5" aria-hidden>
                    {[100, 96, 88, 92, 70].map((w, i) => (
                      <div
                        key={i}
                        className="h-3 animate-pulse rounded-full bg-muted"
                        style={{ width: `${w}%` }}
                      />
                    ))}
                  </div>
                )}

                {story && (
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Label>Your story (editable)</Label>
                      {aiWritten && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-deep">
                          <Sparkles className="h-3 w-3" /> AI drafted
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={10}
                      value={story}
                      onChange={(e) => setStory(e.target.value)}
                      className={field}
                    />
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${
                            words >= 150 && words <= 220 ? "bg-success" : "bg-primary"
                          }`}
                          style={{ width: `${Math.min((words / 200) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {words} / 200 words
                      </span>
                    </div>
                  </div>
                )}
                <FieldError>{errors.story}</FieldError>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-3 rounded-xl bg-primary-soft px-4 py-3 text-sm font-semibold text-primary-deep">
                  <span className="inline-flex items-center gap-2">
                    <FileCheck2 className="h-4 w-4" /> {requiredUploaded} of {requiredDocs.length}{" "}
                    required documents attached
                  </span>
                </div>
                {(
                  [
                    ["Required", requiredDocs],
                    ["Optional", optionalDocs],
                  ] as const
                ).map(([group, list]) => (
                  <div key={group}>
                    <p className="text-sm font-semibold text-foreground">{group}</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {list.map((d) => {
                        const uploaded = docs[d];
                        return (
                          <label
                            key={d}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4 transition-colors ${
                              uploaded
                                ? "border-primary bg-primary-soft/50"
                                : "border-input hover:border-primary/50"
                            }`}
                          >
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                                uploaded
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {uploaded ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-foreground">{d}</span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {uploaded ? (
                                  <span className="inline-flex items-center gap-1">
                                    <Paperclip className="h-3 w-3" /> {uploaded}
                                  </span>
                                ) : (
                                  "PDF, JPG or PNG"
                                )}
                              </span>
                            </span>
                            <input
                              type="file"
                              className="sr-only"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) setDocs((p) => ({ ...p, [d]: f.name }));
                              }}
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step === 6 && (
              <div className="space-y-5">
                <dl className="divide-y divide-border rounded-xl border border-border">
                  {summary.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 px-4 py-3 text-sm">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="text-right font-semibold text-foreground">{v}</dd>
                    </div>
                  ))}
                </dl>
                {story && (
                  <div className="rounded-xl bg-muted/50 p-4 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                    {story}
                  </div>
                )}
                <p className="rounded-xl bg-primary-soft p-4 text-sm text-primary-deep">
                  On submission your application is screened for fraud and sent to your hospital for
                  clinical assessment and costing. You will be notified at each stage.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(true)}
                  className="w-full rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
                >
                  Submit application
                </button>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
              <button
                type="button"
                disabled={step === 0}
                onClick={() => go(step - 1)}
                className="inline-flex items-center gap-1.5 rounded-full border border-input px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              {step < steps.length - 1 && (
                <button
                  type="button"
                  onClick={() => go(step + 1)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
