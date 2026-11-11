import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ApplyShell } from "@/components/apply-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { submitApplication } from "@/lib/patient/applications.functions";
import { documentSpecs, usePortal } from "@/lib/patient/portal-store";

export const Route = createFileRoute("/apply/review")({
  head: () => ({
    meta: [
      { title: "Review your application — FundEzer" },
      {
        name: "description",
        content:
          "Check your location, personal details, story and documents before sending your application to your hospital.",
      },
      { property: "og:title", content: "Review your application" },
      {
        property: "og:description",
        content: "Confirm your details before submitting to your hospital.",
      },
    ],
  }),
  component: ReviewStep,
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-2 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function Section({
  title,
  editTo,
  children,
}: {
  title: string;
  editTo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h2 className="truncate text-sm font-semibold tracking-wide text-muted-foreground">
          {title}
        </h2>
        <Button variant="ghost" size="sm" asChild>
          <Link to={editTo}>Edit</Link>
        </Button>
      </div>
      <div className="mt-3 divide-y divide-border">{children}</div>
    </section>
  );
}

function ReviewStep() {
  const { flow, profile, hospitalName, markSubmitted } = usePortal();
  const [confirmed, setConfirmed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const submitApplicationFn = useServerFn(submitApplication);

  const uploaded = documentSpecs.filter(
    (d) => flow.uploads[d.id]?.status === "uploaded",
  );

  const submit = async () => {
    setSubmitting(true);
    try {
      await submitApplicationFn({
        data: {
          title: flow.campaignTitle,
          story: flow.story,
          summary: flow.summary,
          hospitalName: hospitalName,
          hospitalId: flow.hospitalId ?? "",
          country: flow.country || "Nigeria",
          state: flow.state || "",
          fullName: profile.fullName,
          email: profile.email,
          phone: profile.phone,
          dateOfBirth: profile.dateOfBirth,
          gender: profile.gender,
          city: flow.state || "",
          condition: flow.answers[0] ?? "",
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["my-application"] });
      markSubmitted();
      navigate({ to: "/apply/success" });
    } catch (error) {
      setSubmitting(false);
      setModalOpen(false);
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      toast.error(
        /unauthorized/i.test(message)
          ? "Please sign in again before submitting your application."
          : message,
      );
    }
  };

  return (
    <ApplyShell
      step={4}
      wide
      title="Review your application"
      description="Make sure everything looks correct before sending your application to the hospital."
      footer={
        <>
          <Button variant="ghost" asChild>
            <Link to="/apply/documents">Back</Link>
          </Button>
          <Button disabled={!confirmed} onClick={() => setModalOpen(true)}>
            Submit application
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Section title="LOCATION" editTo="/apply/location">
          <Row label="Country" value={flow.country || "Nigeria"} />
          <Row label="State" value={flow.state || "Abuja"} />
          <Row label="Hospital" value={hospitalName} />
        </Section>

        <Section title="PERSONAL INFORMATION" editTo="/apply/registration">
          <Row label="Full name" value={profile.fullName} />
          <Row label="Email" value={profile.email} />
          <Row label="Phone" value={profile.phone} />
          <Row label="NIN" value={profile.nin} />
          <Row label="Date of birth" value={profile.dateOfBirth} />
          <Row label="Gender" value={profile.gender} />
          <Row label="Address" value={profile.address} />
          <Row
            label="Emergency contact"
            value={`${profile.emergencyName} · ${profile.emergencyRelation} · ${profile.emergencyPhone}`}
          />
          <Row
            label="Next of kin"
            value={`${profile.kinName} · ${profile.kinRelation} · ${profile.kinPhone}`}
          />
        </Section>

        <Section title="CAMPAIGN" editTo="/apply/story-review">
          <Row label="Campaign name" value={flow.campaignTitle || "Not set"} />
          <Row label="Description" value={flow.summary || "Not set"} />
          <Row label="Amount to raise" value="Set by your hospital after review" />
        </Section>

        <Section title="MEDICAL STORY" editTo="/apply/story-review">
          <p className="py-2 text-sm leading-relaxed text-foreground">
            {flow.story || "No story generated yet."}
          </p>
        </Section>

        <Section title="DOCUMENTS" editTo="/apply/documents">
          {uploaded.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">
              No documents uploaded yet.
            </p>
          ) : (
            uploaded.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-2 py-2 text-sm text-foreground"
              >
                <CheckCircle2 className="size-4 shrink-0 text-success" />
                <span className="min-w-0 truncate font-medium">{d.title}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {flow.uploads[d.id]?.fileName}
                </span>
              </div>
            ))
          )}
        </Section>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-card p-5">
          <Checkbox
            checked={confirmed}
            onCheckedChange={(v) => setConfirmed(v === true)}
            className="mt-0.5"
          />
          <span className="text-sm leading-relaxed text-foreground">
            I confirm that the information I've provided is accurate to the best
            of my knowledge.
          </span>
        </label>
      </div>

      <Dialog open={modalOpen} onOpenChange={(o) => !submitting && setModalOpen(o)}>
        <DialogContent className="sm:max-w-md">
          {submitting ? (
            <div className="py-8 text-center">
              <Loader2 className="mx-auto size-6 animate-spin text-primary" />
              <p className="mt-4 text-sm font-medium text-foreground">
                Submitting application...
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Sending your application to {hospitalName}.
              </p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Submit your application?</DialogTitle>
                <DialogDescription>
                  Your application will be sent to your selected hospital for
                  review.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Go back
                </Button>
                <Button onClick={submit}>Submit application</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </ApplyShell>
  );
}
