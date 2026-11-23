import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Sparkles } from "lucide-react";

import { ApplyShell } from "@/components/apply-shell";
import { useServerFn } from "@tanstack/react-start";

import { draftCampaign } from "@/lib/patient/campaign-draft.functions";
import { buildStory, usePortal } from "@/lib/patient/portal-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/apply/generating")({
  head: () => ({
    meta: [
      { title: "Creating your story — FundEzer" },
      {
        name: "description",
        content:
          "FundEzer is turning your answers into a clear, respectful story for donors.",
      },
      { property: "og:title", content: "Creating your story" },
      {
        property: "og:description",
        content: "Your answers are being turned into a donor-friendly story.",
      },
    ],
  }),
  component: GeneratingStep,
});

const stages = [
  "Reviewing your answers...",
  "Creating your story...",
  "Making sure your story stays true to what you shared...",
];

function GeneratingStep() {
  const { flow, profile, setStory, setCampaign } = usePortal();
  const draft = useServerFn(draftCampaign);
  const [stage, setStage] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const story = buildStory(flow.answers, profile.fullName);
    setStory(story);
    const timers = [
      setTimeout(() => setStage(1), 1200),
      setTimeout(() => setStage(2), 2400),
    ];
    draft({ data: { story } })
      .then((res) => {
        if (cancelled) return;
        setCampaign({
          campaignTitle: flow.campaignTitle || res.title,
          summary: flow.summary || res.summary,
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) navigate({ to: "/apply/story-review" });
      });
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ApplyShell
      step={2}
      title="Creating your story"
      description="This only takes a moment. Your words stay yours — we only make them clearer."
    >
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="grid size-11 place-items-center rounded-xl bg-primary-soft">
          <Sparkles className="size-5 text-primary" />
        </div>

        <ul className="mt-6 space-y-4">
          {stages.map((label, i) => (
            <li key={label} className="flex items-center gap-3">
              {i === stage ? (
                <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
              ) : (
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    i < stage ? "bg-primary" : "bg-border",
                  )}
                />
              )}
              <span
                className={cn(
                  "text-sm",
                  i <= stage
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-8 space-y-3">
          {[100, 92, 96, 70].map((w, i) => (
            <div
              key={i}
              className="h-3 animate-pulse rounded-full bg-secondary"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      </div>
    </ApplyShell>
  );
}
