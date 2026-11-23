import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Eye, FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePortal, type PortalDocument } from "@/lib/patient/portal-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal/documents")({
  head: () => ({
    meta: [
      { title: "My documents — FundEzer" },
      {
        name: "description",
        content:
          "View the documents attached to your FundEzer application and replace any that need attention.",
      },
      { property: "og:title", content: "My documents" },
      {
        property: "og:description",
        content: "All documents attached to your application, with status.",
      },
    ],
  }),
  component: DocumentsPage,
});

const categories = ["All", "Medical", "Identity", "Treatment", "Supporting"] as const;

const statusStyles: Record<PortalDocument["status"], string> = {
  Verified: "bg-success-soft text-success",
  "Under review": "bg-warning-soft text-warning",
  "Action needed": "bg-destructive/10 text-destructive",
};

function DocumentsPage() {
  const { documents } = usePortal();
  const [filter, setFilter] = useState<(typeof categories)[number]>("All");
  const [preview, setPreview] = useState<PortalDocument | null>(null);

  const visible =
    filter === "All"
      ? documents
      : documents.filter((d) => d.category === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              filter === c
                ? "border-primary bg-primary-soft font-medium text-primary"
                : "border-border text-muted-foreground hover:bg-secondary",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {visible.map((d) => (
          <li
            key={d.id}
            className="rounded-2xl border border-border bg-card p-4 sm:p-5"
          >
            <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary">
                <FileText className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="min-w-0 truncate font-semibold text-card-foreground">
                    {d.name}
                  </p>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                      statusStyles[d.status],
                    )}
                  >
                    {d.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {d.category} · {d.type} · Uploaded {d.date}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPreview(d)}>
                    <Eye className="size-4" /> View
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toast.success(`Replacement requested for ${d.name}`)}
                  >
                    <RefreshCw className="size-4" /> Replace
                  </Button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{preview?.name}</DialogTitle>
            <DialogDescription>
              {preview?.category} · {preview?.type}
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
    </div>
  );
}
