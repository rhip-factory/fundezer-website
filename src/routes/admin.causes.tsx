import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ConfirmDialog,
  EmptyState,
  FilterBar,
  FilterSelect,
  FundingProgress,
  LabeledInput,
  PageHeader,
  SearchInput,
  SectionCard,
  StatusBadge,
} from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createCause as createCauseFn,
  listCauses,
  setCauseStatus as setCauseStatusFn,
  updateCause as updateCauseFn,
  type CauseRecord,
} from "@/lib/admin/causes.functions";
import { causeImageOptions } from "@/data/fundezer";
import { naira, shortDate } from "@/lib/admin/format";

export const Route = createFileRoute("/admin/causes")({
  head: () => ({
    meta: [
      { title: "Causes — FundEzer Admin Portal" },
      {
        name: "description",
        content:
          "Create, edit and manage FundEzer cause pools, funding targets and the patients each cause supports.",
      },
      { property: "og:title", content: "Causes — FundEzer Admin Portal" },
      {
        property: "og:description",
        content: "Manage cause pools, funding targets and supported patients.",
      },
    ],
  }),
  component: CausesPage,
});

interface Draft {
  name: string;
  description: string;
  image: string;
  status: "Active" | "Inactive";
  fundingTarget: number;
}

const emptyDraft: Draft = {
  name: "",
  description: "",
  image: causeImageOptions[0]!.id,
  status: "Active",
  fundingTarget: 50_000_000,
};

function CausesPage() {
  const queryClient = useQueryClient();
  const fetchCauses = useServerFn(listCauses);
  const createFn = useServerFn(createCauseFn);
  const updateFn = useServerFn(updateCauseFn);
  const statusFn = useServerFn(setCauseStatusFn);

  const causesQuery = useQuery({
    queryKey: ["causes"],
    queryFn: () => fetchCauses(),
  });
  const causes = causesQuery.data ?? [];

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["causes"] });
  const failed = (error: unknown) =>
    toast.error("Could not save cause", {
      description: error instanceof Error ? error.message : "Please try again.",
    });

  const createMutation = useMutation({
    mutationFn: (draft: Draft) => createFn({ data: draft }),
    onSuccess: async (cause) => {
      await refresh();
      setOpen(false);
      toast.success("Cause created", { description: `${cause.name} has been added.` });
    },
    onError: failed,
  });

  const updateMutation = useMutation({
    mutationFn: (input: Draft & { id: string }) => updateFn({ data: input }),
    onSuccess: async (cause) => {
      await refresh();
      setOpen(false);
      toast.success("Cause updated", { description: `${cause.name} has been saved.` });
    },
    onError: failed,
  });

  const statusMutation = useMutation({
    mutationFn: (input: { id: string; status: "Active" | "Inactive" }) => statusFn({ data: input }),
    onSuccess: async (cause) => {
      await refresh();
      toast.success(cause.status === "Active" ? "Cause activated" : "Cause deactivated", {
        description: `${cause.name} is now ${cause.status.toLowerCase()}.`,
      });
    },
    onError: (error) =>
      toast.error("Could not update status", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  const saving = createMutation.isPending || updateMutation.isPending;
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<CauseRecord | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toggling, setToggling] = useState<CauseRecord | null>(null);

  const rows = useMemo(
    () =>
      causes.filter((c) => {
        const q = query.trim().toLowerCase();
        return (
          (!q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)) &&
          (status === "all" || c.status === status)
        );
      }),
    [causes, query, status],
  );

  const startCreate = () => {
    setEditing(null);
    setDraft(emptyDraft);
    setErrors({});
    setOpen(true);
  };

  const startEdit = (c: CauseRecord) => {
    setEditing(c);
    setDraft({
      name: c.name,
      description: c.description,
      image: c.image,
      status: c.status,
      fundingTarget: c.fundingTarget,
    });
    setErrors({});
    setOpen(true);
  };

  const submit = () => {
    const next: Record<string, string> = {};
    if (draft.name.trim().length < 3) next["name"] = "Enter a cause name of at least 3 characters.";
    if (draft.description.trim().length < 20)
      next["description"] = "Add a description of at least 20 characters.";
    if (!Number.isFinite(draft.fundingTarget) || draft.fundingTarget <= 0)
      next["fundingTarget"] = "Funding target must be greater than zero.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (editing) updateMutation.mutate({ ...draft, id: editing.id });
    else createMutation.mutate(draft);
  };

  return (
    <>
      <PageHeader
        title="Causes"
        description="Cause pools group donations that fund patients across multiple hospitals."
        actions={
          <Button onClick={startCreate}>
            <Plus className="size-4" /> New cause
          </Button>
        }
      />

      <SectionCard bodyClassName="p-0">
        <FilterBar>
          <SearchInput value={query} onChange={setQuery} placeholder="Search causes" />
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={["Active", "Inactive"].map((v) => ({ value: v, label: v }))}
          />
          <span className="num ml-auto text-xs text-muted-foreground">
            {rows.length} of {causes.length}
          </span>
        </FilterBar>

        {causesQuery.isLoading ? (
          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        ) : causesQuery.isError ? (
          <EmptyState
            title="Could not load causes"
            description="Something went wrong while loading causes from the database."
            action={<Button onClick={() => causesQuery.refetch()}>Try again</Button>}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            searching
            title="No causes found"
            description="Create a new cause or clear your filters."
            action={<Button onClick={startCreate}>New cause</Button>}
          />
        ) : (
          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((c) => {
              const supported = c.patientsSupported;
              return (
                <Card key={c.id} className="gap-0 border-border p-4 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-foreground">{c.name}</h3>
                      <p className="num text-xs text-muted-foreground">
                        CAU-{c.id.slice(0, 6).toUpperCase()} · updated {shortDate(c.lastUpdated)}
                      </p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{c.description}</p>
                  <div className="mt-4">
                    <FundingProgress raised={c.pool} target={c.fundingTarget} />
                  </div>
                  <dl className="num mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                    <div>
                      <dt className="text-xs text-muted-foreground">Pool</dt>
                      <dd className="text-sm font-medium text-foreground">
                        {naira(c.pool, true)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Donations</dt>
                      <dd className="text-sm font-medium text-foreground">{c.totalDonations}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Patients</dt>
                      <dd className="text-sm font-medium text-foreground">
                        {supported}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => startEdit(c)}>
                      Edit
                    </Button>
                    <Button
                      variant={c.status === "Active" ? "ghost" : "secondary"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setToggling(c)}
                      disabled={statusMutation.isPending}
                    >
                      {c.status === "Active" ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </SectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto shadow-overlay sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit cause" : "Create cause"}</DialogTitle>
            <DialogDescription>
              Causes group donations into a shared pool that funds eligible patients.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <LabeledInput label="Cause name" error={errors["name"] ?? ""}>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Cancer Care"
              />
            </LabeledInput>
            <LabeledInput label="Description" error={errors["description"] ?? ""}>
              <Textarea
                rows={4}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="What this cause funds and who it supports"
              />
            </LabeledInput>
            <LabeledInput
              label="Funding target (₦)"
              error={errors["fundingTarget"] ?? ""}
              hint="Total amount this pool aims to raise."
            >
              <Input
                type="number"
                min={0}
                value={draft.fundingTarget}
                onChange={(e) => setDraft({ ...draft, fundingTarget: Number(e.target.value) })}
              />
            </LabeledInput>
            <div className="grid gap-4 sm:grid-cols-2">
              <LabeledInput label="Image theme">
                <Select
                  value={draft.image}
                  onValueChange={(v) => setDraft({ ...draft, image: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {causeImageOptions.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </LabeledInput>
              <LabeledInput label="Status">
                <Select
                  value={draft.status}
                  onValueChange={(v) => setDraft({ ...draft, status: v as Draft["status"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </LabeledInput>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Create cause"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toggling}
        onOpenChange={(o) => !o && setToggling(null)}
        title={toggling?.status === "Active" ? "Deactivate cause?" : "Activate cause?"}
        description={
          toggling?.status === "Active"
            ? `${toggling?.name} will stop accepting new donations. Existing pool funds are unaffected.`
            : `${toggling?.name ?? "This cause"} will be visible to donors again.`
        }
        confirmLabel={toggling?.status === "Active" ? "Deactivate" : "Activate"}
        destructive={toggling?.status === "Active"}
        onConfirm={() => {
          if (toggling)
            statusMutation.mutate({
              id: toggling.id,
              status: toggling.status === "Active" ? "Inactive" : "Active",
            });
          setToggling(null);
        }}
      />
    </>
  );
}
