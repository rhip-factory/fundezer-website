import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileText,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { ApplyShell } from "@/components/apply-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { documentSpecs, usePortal, type DocSpec } from "@/lib/patient/portal-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/apply/documents")({
  head: () => ({
    meta: [
      { title: "Upload your documents — FundEzer" },
      {
        name: "description",
        content:
          "Upload the diagnosis, lab reports, scans and ID your hospital needs to verify your application.",
      },
      { property: "og:title", content: "Upload your documents" },
      {
        property: "og:description",
        content: "Documents help your hospital verify your treatment needs.",
      },
    ],
  }),
  component: DocumentsStep,
});

function DocRow({
  spec,
  onPreview,
  onRemove,
}: {
  spec: DocSpec;
  onPreview: (spec: DocSpec) => void;
  onRemove: (spec: DocSpec) => void;
}) {
  const { flow, startUpload } = usePortal();
  const slot = flow.uploads[spec.id] ?? { status: "empty", progress: 0 };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary">
          <FileText className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-card-foreground">{spec.title}</p>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-medium",
                spec.required
                  ? "bg-primary-soft text-primary"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              {spec.required ? "Required" : "Optional"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {spec.description}
          </p>

          {slot.status === "empty" && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button size="sm" variant="outline" onClick={() => startUpload(spec.id)}>
                <Upload className="size-4" /> Upload
              </Button>
              <span className="text-xs text-muted-foreground">Not uploaded</span>
            </div>
          )}

          {slot.status === "uploading" && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs font-medium text-foreground">
                <span>Uploading...</span>
                <span>{slot.progress}%</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-200"
                  style={{ width: `${slot.progress}%` }}
                />
              </div>
            </div>
          )}

          {slot.status === "uploaded" && (
            <div className="mt-3">
              <div className="flex flex-wrap items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-success" />
                <span className="min-w-0 truncate text-sm font-medium text-foreground">
                  {slot.fileName}
                </span>
                <span className="text-xs text-success">Uploaded successfully</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => onPreview(spec)}>
                  <Eye className="size-4" /> Preview
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    startUpload(spec.id);
                    toast.info("Replacing document...");
                  }}
                >
                  Replace
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemove(spec)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" /> Remove
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DocumentsStep() {
  const { requiredUploaded, requiredTotal, missingRequired, removeUpload, flow } =
    usePortal();
  const [preview, setPreview] = useState<DocSpec | null>(null);
  const [toRemove, setToRemove] = useState<DocSpec | null>(null);
  const [showMissing, setShowMissing] = useState(false);
  const navigate = useNavigate();

  const required = documentSpecs.filter((d) => d.required);
  const optional = documentSpecs.filter((d) => !d.required);

  const proceed = () => {
    if (missingRequired.length > 0) {
      setShowMissing(true);
      toast.error("Complete your required documents");
      return;
    }
    navigate({ to: "/apply/review" });
  };

  return (
    <ApplyShell
      step={3}
      wide
      title="Upload your documents"
      description="These documents help the hospital verify your treatment needs and application."
      footer={
        <>
          <Button variant="ghost" asChild>
            <Link to="/apply/story-review">Back</Link>
          </Button>
          <Button onClick={proceed}>Continue</Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <p className="text-sm font-semibold text-card-foreground">
              {requiredUploaded} of {requiredTotal} required documents uploaded
            </p>
            <span className="shrink-0 text-sm text-muted-foreground">
              {Math.round((requiredUploaded / requiredTotal) * 100)}%
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${(requiredUploaded / requiredTotal) * 100}%` }}
            />
          </div>
        </div>

        {showMissing && missingRequired.length > 0 && (
          <div className="flex gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Complete your required documents
              </p>
              <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                {missingRequired.map((d) => (
                  <li key={d.id}>{d.title}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
            REQUIRED DOCUMENTS
          </h2>
          {required.map((spec) => (
            <DocRow
              key={spec.id}
              spec={spec}
              onPreview={setPreview}
              onRemove={setToRemove}
            />
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
            OPTIONAL
          </h2>
          {optional.map((spec) => (
            <DocRow
              key={spec.id}
              spec={spec}
              onPreview={setPreview}
              onRemove={setToRemove}
            />
          ))}
        </section>
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{preview?.title}</DialogTitle>
            <DialogDescription>
              {preview ? flow.uploads[preview.id]?.fileName : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="grid h-64 place-items-center rounded-xl border border-dashed border-border bg-secondary/50 text-center">
            <div>
              <FileText className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-foreground">
                Document preview
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                A preview is not available for this document.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!toRemove} onOpenChange={(o) => !o && setToRemove(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove this document?</DialogTitle>
            <DialogDescription>
              {toRemove?.title} will be removed from your application. You can
              upload it again at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToRemove(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (toRemove) removeUpload(toRemove.id);
                setToRemove(null);
                toast.success("Document removed.");
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ApplyShell>
  );
}
