import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, Sparkles } from "lucide-react";
import { PageShell, PageHero } from "@/components/site/PageShell";
import { hospitals } from "@/lib/data";

export const Route = createFileRoute("/apply")({
  component: Apply,
  head: () => ({
    meta: [
      { title: "Apply for treatment sponsorship — FundEzer" },
      {
        name: "description",
        content:
          "Start a hospital-verified sponsorship request in Abuja. Register, answer guided questions, review your AI-written story and upload your medical documents.",
      },
      { property: "og:title", content: "Apply for sponsorship — FundEzer" },
      {
        property: "og:description",
        content: "Begin a verified treatment sponsorship request with an Abuja partner hospital.",
      },
      { property: "og:url", content: "/apply" },
    ],
    links: [{ rel: "canonical", href: "/apply" }],
  }),
});

const steps = ["Location", "Hospital", "Your details", "Medical story", "Documents", "Submit"];

const storyQuestions = [
  "What illness do you have?",
  "When were you diagnosed?",
  "Who diagnosed you?",
  "Have you received treatment before?",
  "How does the illness affect your life?",
  "Why do you need financial support?",
  "What happens if treatment is delayed?",
];

const requiredDocs = ["Diagnosis", "Lab reports", "Prescriptions", "Scans", "Pictures", "Government ID"];
const optionalDocs = ["Videos", "Referral letters", "Other supporting documents"];

const field =
  "mt-1.5 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary";

function Label({ children }: { children: string }) {
  return <span className="text-xs font-semibold text-muted-foreground">{children}</span>;
}

function Apply() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState("Abuja (FCT)");
  const [hospital, setHospital] = useState("");
  const [answers, setAnswers] = useState<string[]>(Array(storyQuestions.length).fill(""));
  const [story, setStory] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const outsideAbuja = state !== "Abuja (FCT)";

  function generateStory() {
    const [illness = "", when = "", who = "", before = "", effect = "", why = "", delay = ""] =
      answers;
    if (!illness.trim()) {
      toast.error("Tell us what illness you have first.");
      return;
    }
    setStory(
      `I am living with ${illness.trim()}${when.trim() ? `, diagnosed ${when.trim()}` : ""}${
        who.trim() ? ` by ${who.trim()}` : ""
      }. ${before.trim() ? `So far, ${before.trim().toLowerCase()}. ` : ""}${
        effect.trim() ? `The illness has changed my life: ${effect.trim().toLowerCase()}. ` : ""
      }${why.trim() ? `I am asking for support because ${why.trim().toLowerCase()}. ` : ""}${
        delay.trim() ? `If treatment is delayed, ${delay.trim().toLowerCase()}. ` : ""
      }My hospital has reviewed my records and every naira donated will be paid directly to them for my treatment.`,
    );
    toast.success("Draft story created — edit it freely before submitting.");
  }

  if (submitted) {
    return (
      <PageShell>
        <section className="container-page max-w-2xl py-24 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary-deep">
            <Check className="h-7 w-7" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-foreground">Application submitted</h1>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Status: <strong className="text-foreground">Submitted · Hospital notified</strong>.{" "}
            {hospital || "Your hospital"} will review your documents and complete a clinical
            assessment. You will be notified at every stage, and your campaign goes live once the
            hospital approves it and fraud screening is complete.
          </p>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHero
        eyebrow="Apply for sponsorship"
        title="A guided application, reviewed by your hospital"
        description="This is a demonstration of the FundEzer patient journey. Nothing is stored and no documents are uploaded in this preview."
      />

      <section className="container-page max-w-3xl py-12">
        <ol className="flex flex-wrap gap-2">
          {steps.map((s, i) => (
            <li
              key={s}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                    ? "bg-primary-soft text-primary-deep"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}. {s}
            </li>
          ))}
        </ol>

        <div className="surface-card mt-8 p-7">
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Where will you be treated?
              </h2>
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
                <p className="rounded-xl bg-warning/15 p-4 text-sm text-foreground">
                  FundEzer is currently available only in Abuja. Choose Abuja (FCT) to continue —
                  other states open as we onboard more hospitals.
                </p>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Select your hospital
              </h2>
              <div className="grid gap-3">
                {hospitals.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setHospital(h.name)}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      hospital === h.name
                        ? "border-primary bg-primary-soft"
                        : "border-input hover:border-primary/40"
                    }`}
                  >
                    <p className="font-display font-semibold text-foreground">{h.name}</p>
                    <p className="text-sm text-muted-foreground">{h.area}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-5 sm:grid-cols-2">
              <h2 className="font-display text-xl font-semibold text-foreground sm:col-span-2">
                Patient registration
              </h2>
              {(
                [
                  ["Full name", "text"],
                  ["Email", "email"],
                  ["Phone", "tel"],
                  ["NIN", "text"],
                  ["Date of birth", "date"],
                ] as [string, string][]
              ).map(([label, type]) => (
                <label key={label} className="block">
                  <Label>{label}</Label>
                  <input type={type} className={field} />
                </label>
              ))}
              <label className="block">
                <Label>Gender</Label>
                <select className={field}>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Prefer not to say</option>
                </select>
              </label>
              <label className="block sm:col-span-2">
                <Label>Residential address</Label>
                <input type="text" className={field} />
              </label>
              <label className="block">
                <Label>Emergency contact</Label>
                <input type="text" className={field} />
              </label>
              <label className="block">
                <Label>Next of kin</Label>
                <input type="text" className={field} />
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Your medical story
              </h2>
              <p className="text-sm text-muted-foreground">
                Answer in your own words. Our AI turns your answers into a clear story of up to 200
                words that you can edit.
              </p>
              {storyQuestions.map((q, i) => (
                <label key={q} className="block">
                  <Label>{q}</Label>
                  <textarea
                    rows={2}
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
              <button
                type="button"
                onClick={generateStory}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
              >
                <Sparkles className="h-4 w-4" /> Generate my story
              </button>
              {story && (
                <label className="block">
                  <Label>Your story (editable)</Label>
                  <textarea
                    rows={8}
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    className={field}
                  />
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {story.trim().split(/\s+/).length} words
                  </span>
                </label>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Upload your documents
              </h2>
              <div>
                <p className="text-sm font-semibold text-foreground">Required</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {requiredDocs.map((d) => (
                    <div key={d} className="rounded-xl border border-dashed border-input p-4">
                      <p className="text-sm font-medium text-foreground">{d}</p>
                      <input type="file" className="mt-2 w-full text-xs text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Optional</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {optionalDocs.map((d) => (
                    <div key={d} className="rounded-xl border border-dashed border-input p-4">
                      <p className="text-sm font-medium text-foreground">{d}</p>
                      <input type="file" className="mt-2 w-full text-xs text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Review and submit
              </h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Location</dt>
                  <dd className="font-semibold text-foreground">{state}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Hospital</dt>
                  <dd className="font-semibold text-foreground">{hospital || "Not selected"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Story</dt>
                  <dd className="font-semibold text-foreground">
                    {story ? "Drafted" : "Not drafted"}
                  </dd>
                </div>
              </dl>
              <p className="rounded-xl bg-primary-soft p-4 text-sm text-primary-deep">
                On submission your application is screened for fraud and sent to your hospital for
                clinical assessment and costing. You will be notified at each stage.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(true)}
                className="w-full rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft"
              >
                Submit application
              </button>
            </div>
          )}

          <div className="mt-8 flex justify-between border-t border-border pt-6">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
              className="rounded-full border border-input px-5 py-2.5 text-sm font-semibold text-foreground disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              disabled={step === steps.length - 1 || (step === 0 && outsideAbuja) || (step === 1 && !hospital)}
              onClick={() => setStep((s) => s + 1)}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}