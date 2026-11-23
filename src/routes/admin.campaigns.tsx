import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ConfirmDialog,
  DetailDrawer,
  DrawerSection,
  EmptyState,
  Field,
  FieldGrid,
  FilterBar,
  FilterSelect,
  FundingProgress,
  LabeledInput,
  PageHeader,
  SearchInput,
  SectionCard,
  StatusBadge,
  TableShell,
  TableSkeleton,
  Td,
  Th,
  Tr,
} from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
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
import {
  CAMPAIGN_STATUSES,
  createCampaign as createCampaignFn,
  listCampaignOptions,
  listCampaigns,
  setCampaignStatus as setCampaignStatusFn,
  updateCampaign as updateCampaignFn,
  type CampaignRecord,
  type CampaignStatusValue,
} from "@/lib/admin/campaigns.functions";
import { naira, shortDate } from "@/lib/admin/format";
import { deleteCampaign } from "@/lib/admin/deletions.functions";

export const Route = createFileRoute("/admin/campaigns")({
  head: () => ({
    meta: [
      { title: "Campaigns — FundEzer Admin Portal" },
      {
        name: "description",
        content:
          "Moderate patient fundraising campaigns: review drafts, publish, suspend and track amounts raised against target.",
      },
      { property: "og:title", content: "Campaigns — FundEzer Admin Portal" },
      {
        property: "og:description",
        content: "Moderate patient fundraising campaigns and track amounts raised.",
      },
    ],
  }),
  component: CampaignsPage,
});

const NONE = "none";

interface Draft {
  title: string;
  patientId: string;
  hospitalId: string;
  causeId: string;
  target: number;
  status: CampaignStatusValue;
  summary: string;
}

const emptyDraft: Draft = {
  title: "",
  patientId: "",
  hospitalId: NONE,
  causeId: NONE,
  target: 5_000_000,
  status: "Draft",
  summary: "",
};

function CampaignsPage() {
  const queryClient = useQueryClient();
  const fetchCampaigns = useServerFn(listCampaigns);
  const fetchOptions = useServerFn(listCampaignOptions);
  const createFn = useServerFn(createCampaignFn);
  const updateFn = useServerFn(updateCampaignFn);
  const statusFn = useServerFn(setCampaignStatusFn);
  const deleteFn = useServerFn(deleteCampaign);

  const campaignsQuery = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => fetchCampaigns(),
  });
  const optionsQuery = useQuery({
    queryKey: ["campaign-options"],
    queryFn: () => fetchOptions(),
  });
  const campaigns = campaignsQuery.data ?? [];
  const options = optionsQuery.data ?? { patients: [], hospitals: [], causes: [] };

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, setPending] = useState<CampaignStatusValue | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CampaignRecord | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["campaigns"] });
  const failed = (error: unknown) =>
    toast.error("Could not save campaign", {
      description: error instanceof Error ? error.message : "Please try again.",
    });

  const payload = (d: Draft) => ({
    title: d.title.trim(),
    patientId: d.patientId,
    hospitalId: d.hospitalId === NONE ? null : d.hospitalId,
    causeId: d.causeId === NONE ? null : d.causeId,
    target: d.target,
    status: d.status,
    summary: d.summary.trim(),
  });

  const createMutation = useMutation({
    mutationFn: (d: Draft) => createFn({ data: payload(d) }),
    onSuccess: async (campaign) => {
      await refresh();
      setOpen(false);
      toast.success("Campaign created", { description: `${campaign.title} has been added.` });
    },
    onError: failed,
  });

  const updateMutation = useMutation({
    mutationFn: (input: { draft: Draft; id: string }) =>
      updateFn({ data: { ...payload(input.draft), id: input.id } }),
    onSuccess: async (campaign) => {
      await refresh();
      setOpen(false);
      toast.success("Campaign updated", { description: `${campaign.title} has been saved.` });
    },
    onError: failed,
  });

  const statusMutation = useMutation({
    mutationFn: (input: { id: string; status: CampaignStatusValue }) => statusFn({ data: input }),
    onSuccess: async (campaign) => {
      await refresh();
      toast.success("Campaign updated", { description: `${campaign.title} is now ${campaign.status}.` });
    },
    onError: (error) =>
      toast.error("Could not update status", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: async () => {
      setSelected(null);
      await refresh();
      toast.success("Campaign deleted");
    },
    onError: (error) =>
      toast.error("Could not delete campaign", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  const saving = createMutation.isPending || updateMutation.isPending;

  const rows = useMemo(
    () =>
      campaigns.filter((c) => {
        const q = query.trim().toLowerCase();
        return (
          (!q ||
            [c.title, c.id, c.summary, c.patientName].some((v) =>
              (v ?? "").toLowerCase().includes(q),
            )) &&
          (status === "all" || c.status === status)
        );
      }),
    [campaigns, query, status],
  );

  const active = campaigns.find((c) => c.id === selected) ?? null;

  const startCreate = () => {
    setEditing(null);
    setDraft(emptyDraft);
    setErrors({});
    setOpen(true);
  };

  const startEdit = (c: CampaignRecord) => {
    setEditing(c);
    setDraft({
      title: c.title,
      patientId: c.patientId,
      hospitalId: c.hospitalId ?? NONE,
      causeId: c.causeId ?? NONE,
      target: c.target,
      status: c.status,
      summary: c.summary,
    });
    setErrors({});
    setOpen(true);
  };

  const submit = () => {
    const next: Record<string, string> = {};
    if (draft.title.trim().length < 3) next["title"] = "Enter a campaign title of at least 3 characters.";
    if (!draft.patientId) next["patientId"] = "Select the patient this campaign funds.";
    if (!Number.isFinite(draft.target) || draft.target <= 0)
      next["target"] = "Target must be greater than zero.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (editing) updateMutation.mutate({ draft, id: editing.id });
    else createMutation.mutate(draft);
  };

  return (
    <>
      <PageHeader
        title="Campaigns"
        description="Patient fundraising campaigns awaiting moderation or already live."
        actions={
          <Button onClick={startCreate}>
            <Plus className="size-4" /> New campaign
          </Button>
        }
      />

      <SectionCard bodyClassName="p-0">
        <FilterBar>
          <SearchInput value={query} onChange={setQuery} placeholder="Search campaigns" />
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={CAMPAIGN_STATUSES.map((v) => ({ value: v, label: v }))}
          />
          <span className="num ml-auto text-xs text-muted-foreground">
            {rows.length} of {campaigns.length}
          </span>
        </FilterBar>

        {campaignsQuery.isLoading ? (
          <TableSkeleton cols={6} />
        ) : campaignsQuery.isError ? (
          <EmptyState
            title="Could not load campaigns"
            description="Something went wrong while loading campaigns from the database."
            action={<Button onClick={() => campaignsQuery.refetch()}>Try again</Button>}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            searching={campaigns.length > 0}
            title={campaigns.length > 0 ? "No campaigns match" : "No campaigns yet"}
            description={
              campaigns.length > 0
                ? "Try another search term or reset the status filter."
                : "Create a campaign to start raising funds for a patient."
            }
            action={<Button onClick={startCreate}>New campaign</Button>}
          />
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>Campaign</Th>
                <Th>Patient</Th>
                <Th>Cause</Th>
                <Th className="w-56">Progress</Th>
                <Th>Status</Th>
                <Th>Created</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <Tr key={c.id} onClick={() => setSelected(c.id)}>
                  <Td className="max-w-[20rem] truncate font-medium">{c.title}</Td>
                  <Td className="truncate">{c.patientName}</Td>
                  <Td className="text-muted-foreground">{c.causeName}</Td>
                  <Td>
                    <FundingProgress raised={c.raised} target={c.target} compact />
                  </Td>
                  <Td>
                    <StatusBadge status={c.status} />
                  </Td>
                  <Td className="num text-muted-foreground">{shortDate(c.created)}</Td>
                </Tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </SectionCard>

      <DetailDrawer
        open={!!active}
        onOpenChange={(o) => !o && setSelected(null)}
        title={active?.title ?? ""}
        subtitle={active ? `CMP-${active.id.slice(0, 6).toUpperCase()} · ${active.causeName}` : ""}
        footer={
          active ? (
            <>
              <Button variant="outline" onClick={() => startEdit(active)}>
                Edit
              </Button>
              {active.status !== "Active" ? (
                <Button onClick={() => setPending("Active")} disabled={statusMutation.isPending}>
                  Publish
                </Button>
              ) : null}
              {active.status !== "Suspended" ? (
                <Button
                  variant="ghost"
                  onClick={() => setPending("Suspended")}
                  disabled={statusMutation.isPending}
                >
                  Suspend
                </Button>
              ) : null}
              {active.status !== "Completed" ? (
                <Button
                  variant="outline"
                  onClick={() => setPending("Completed")}
                  disabled={statusMutation.isPending}
                >
                  Mark completed
                </Button>
              ) : null}
              <Button
                variant="destructive"
                onClick={() => setConfirmDelete(true)}
                disabled={deleteMutation.isPending}
              >
                Delete
              </Button>
            </>
          ) : null
        }
      >
        {active ? (
          <>
            <DrawerSection title="Campaign details">
              <FieldGrid>
                <Field label="Patient" value={active.patientName} />
                <Field label="Hospital" value={active.hospitalName} />
                <Field label="Target" value={<span className="num">{naira(active.target)}</span>} />
                <Field label="Raised" value={<span className="num">{naira(active.raised)}</span>} />
                <Field label="Status" value={<StatusBadge status={active.status} />} />
                <Field label="Created" value={shortDate(active.created)} />
                <Field label="Summary" value={active.summary || "—"} className="sm:col-span-2" />
              </FieldGrid>
              <div className="mt-4">
                <FundingProgress raised={active.raised} target={active.target} />
              </div>
            </DrawerSection>

            <DrawerSection title="Recent donations">
              {active.donations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No donations recorded for this campaign yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {active.donations.map((d) => (
                    <div
                      key={d.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{d.donor}</p>
                        <p className="num truncate text-xs text-muted-foreground">
                          {shortDate(d.date)} · {d.channel} · {d.paymentStatus}
                        </p>
                      </div>
                      <span className="num text-sm font-medium text-foreground">
                        {naira(d.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </DrawerSection>
          </>
        ) : null}
      </DetailDrawer>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto shadow-overlay sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit campaign" : "Create campaign"}</DialogTitle>
            <DialogDescription>
              Campaigns raise funds for a specific patient, optionally linked to a hospital and cause.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <LabeledInput label="Campaign title" error={errors["title"] ?? ""}>
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="e.g. Chemotherapy for Patient A."
              />
            </LabeledInput>

            <LabeledInput label="Patient" error={errors["patientId"] ?? ""}>
              <Select
                value={draft.patientId}
                onValueChange={(v) => setDraft({ ...draft, patientId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {options.patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </LabeledInput>

            <div className="grid gap-4 sm:grid-cols-2">
              <LabeledInput label="Hospital">
                <Select
                  value={draft.hospitalId}
                  onValueChange={(v) => setDraft({ ...draft, hospitalId: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Not assigned</SelectItem>
                    {options.hospitals.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </LabeledInput>
              <LabeledInput label="Cause">
                <Select
                  value={draft.causeId}
                  onValueChange={(v) => setDraft({ ...draft, causeId: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Not assigned</SelectItem>
                    {options.causes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </LabeledInput>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <LabeledInput label="Target (₦)" error={errors["target"] ?? ""}>
                <Input
                  type="number"
                  min={0}
                  value={draft.target}
                  onChange={(e) => setDraft({ ...draft, target: Number(e.target.value) })}
                />
              </LabeledInput>
              <LabeledInput label="Status">
                <Select
                  value={draft.status}
                  onValueChange={(v) => setDraft({ ...draft, status: v as CampaignStatusValue })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </LabeledInput>
            </div>

            <LabeledInput label="Summary" hint="Internal summary shown to reviewers.">
              <Textarea
                rows={4}
                value={draft.summary}
                onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
                placeholder="What this campaign funds"
              />
            </LabeledInput>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Create campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
        title={`Set campaign to ${pending ?? ""}?`}
        description={
          pending === "Suspended"
            ? "Donations will be paused and the campaign hidden from donors."
            : pending === "Completed"
              ? "The campaign will close to new donations and be archived as completed."
              : "The campaign will go live and start accepting donations."
        }
        confirmLabel={`Set ${pending ?? ""}`}
        destructive={pending === "Suspended"}
        onConfirm={() => {
          if (active && pending) statusMutation.mutate({ id: active.id, status: pending });
          setPending(null);
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this campaign permanently?"
        description="The campaign and its updates, fund requests and documents will be erased. Donation records are kept but unlinked. This cannot be undone."
        confirmLabel="Delete campaign"
        destructive
        onConfirm={() => {
          if (active) deleteMutation.mutate(active.id);
          setConfirmDelete(false);
        }}
      />
    </>
  );
}
