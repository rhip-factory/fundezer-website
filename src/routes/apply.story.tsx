import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { ApplyShell } from "@/components/apply-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { storyQuestions, usePortal } from "@/lib/patient/portal-store";

export const Route = createFileRoute("/apply/story")({
  head: () => ({
    meta: [
      { title: "Let's understand your situation — FundEzer" },
      {
        name: "description",
        content:
          "Answer seven simple guided questions in your own words so FundEzer can draft your donor story.",
      },
      { property: "og:title", content: "Your medical story" },
      {
        property: "og:description",
        content: "Guided questions that help donors understand your situation.",
      },
    ],
  }),
  component: StoryStep,
});

function StoryStep() {
  const { flow, setAnswer } = usePortal();
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const q = storyQuestions[index]!;
  const value = flow.answers[index] ?? "";
  const isLast = index === storyQuestions.length - 1;

  const next = () => {
    if (!value.trim()) {
      toast.error("Please answer this question before continuing.");
      return;
    }
    if (isLast) {
      navigate({ to: "/apply/generating" });
      return;
    }
    setIndex(index + 1);
  };

  return (
    <ApplyShell
      step={2}
      title="Let's understand your situation"
      description="Answer a few simple questions in your own words. We'll use your answers to create a clear story that helps donors understand your situation."
      footer={
        <>
          {index === 0 ? (
            <Button variant="ghost" asChild>
              <Link to="/apply/registration">Back</Link>
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setIndex(index - 1)}>
              Back
            </Button>
          )}
          <Button onClick={next}>{isLast ? "Create my story" : "Continue"}</Button>
        </>
      }
    >
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <p className="text-xs font-medium tracking-wide text-primary">
            Question {index + 1} of {storyQuestions.length}
          </p>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{
                width: `${((index + 1) / storyQuestions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <h2 className="mt-6 text-xl font-semibold leading-snug text-card-foreground">
          {q.question}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{q.helper}</p>

        <Textarea
          aria-label={q.question}
          value={value}
          onChange={(e) => setAnswer(index, e.target.value)}
          placeholder={q.placeholder}
          rows={5}
          className="mt-5 resize-none text-base"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          There are no wrong answers. Write as much or as little as you like.
        </p>
      </div>
    </ApplyShell>
  );
}
