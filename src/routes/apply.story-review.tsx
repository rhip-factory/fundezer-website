import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { ApplyShell } from "@/components/apply-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { storyQuestions, usePortal, wordCount } from "@/lib/patient/portal-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/apply/story-review")({
  head: () => ({
    meta: [
      { title: "Review your story — FundEzer" },
      {
        name: "description",
        content:
          "Read, edit and approve the AI-assisted story FundEzer drafted from your answers.",
      },
      { property: "og:title", content: "Review your story" },
      {
        property: "og:description",
        content: "Edit your AI-assisted story before submitting.",
      },
    ],
  }),
  component: StoryReview,
});

function StoryReview() {
  const { flow, setStory, setCampaign } = usePortal();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(flow.story);
  const [answersOpen, setAnswersOpen] = useState(false);
  const navigate = useNavigate();

  const words = wordCount(draft);
  const overLimit = words > 200;

  const save = () => {
    if (overLimit) {
      toast.error("Please keep your story to 200 words or fewer.");
      return;
    }
    setStory(draft.trim());
    setEditing(false);
    toast.success("Your story has been updated.");
  };

  return (
    <ApplyShell
      step={2}
      wide
      title="Review your story"
      description="This is what donors will read. Make sure it sounds like you."
      footer={
        <>
          <Button variant="ghost" asChild>
            <Link to="/apply/story">Back</Link>
          </Button>
          <Button
            disabled={editing}
            onClick={() => {
              if (!flow.campaignTitle.trim()) { toast.error("Please give your campaign a name."); return; }
              if (!flow.summary.trim()) { toast.error("Please add a short campaign description."); return; }
              navigate({ to: "/apply/documents" });
            }}
          >
            Continue
          </Button>
        </>
      }
    >
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" /> AI-assisted story
            </span>
            <p className="mt-2 text-xs text-muted-foreground">
              FundEzer used your answers to create this draft. You can review and
              edit it before submitting.
            </p>
          </div>
        </div>

        {editing ? (
          <>
            <Textarea
              aria-label="Edit your story"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={12}
              className="mt-5 text-base leading-relaxed"
            />
            <div className="mt-2 flex items-center justify-between">
              <p
                className={cn(
                  "text-xs",
                  overLimit
                    ? "font-medium text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {words} / 200 words
              </p>
              {overLimit && (
                <p className="text-xs font-medium text-destructive">
                  Maximum 200 words.
                </p>
              )}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={save}>Save changes</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setDraft(flow.story);
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-card-foreground">
              {flow.story}
            </p>
            <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-5">
              <Button
                variant="outline"
                onClick={() => {
                  setDraft(flow.story);
                  setEditing(true);
                }}
              >
                Edit story
              </Button>
              <Button variant="ghost" onClick={() => setAnswersOpen(true)}>
                View my answers
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="mt-5 space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div>
          <h2 className="text-base font-semibold text-card-foreground">Your campaign</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            This is what donors see first. The description was drafted from your story without personal details — edit anything you like. Your hospital reviews your application, sets the amount to raise and takes your campaign live.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="camp-title">Campaign name</Label>
          <Input id="camp-title" maxLength={160} value={flow.campaignTitle} onChange={(e) => setCampaign({ campaignTitle: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="camp-summary">Short description</Label>
          <Textarea id="camp-summary" rows={4} maxLength={1000} value={flow.summary} onChange={(e) => setCampaign({ summary: e.target.value })} />
        </div>
      </div>

      <Dialog open={answersOpen} onOpenChange={setAnswersOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Your answers</DialogTitle>
            <DialogDescription>
              These are the answers we used to draft your story.
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-4">
            {storyQuestions.map((q, i) => (
              <li key={q.id}>
                <p className="text-sm font-semibold text-foreground">
                  {i + 1}. {q.question}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {flow.answers[i]?.trim() || "No answer given."}
                </p>
              </li>
            ))}
          </ol>
        </DialogContent>
      </Dialog>
    </ApplyShell>
  );
}
