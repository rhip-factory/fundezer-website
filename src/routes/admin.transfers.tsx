import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
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
  PageHeader,
  SearchInput,
  SectionCard,
  StatusBadge,
  TableShell,
  Td,
  Th,
  Tr,
} from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  TRANSFER_FLOW,
  TRANSFER_STATUSES,
  listTransferHospitals,
  listTransfers,
  setTransferStatus,
  type TransferStatusValue,
} from "@/lib/admin/transfers.functions";
import { dateTime, shortDate } from "@/lib/admin/format";

export const Route = createFileRoute("/admin/transfers")({
  head: () => ({
    meta: [
      { title: "Hospital Transfers — FundEzer Admin Portal" },
      {
        name: "description",
        content:
          "Review, approve and track patient transfer requests between partner hospitals, from submission to treatment completion.",
      },
      { property: "og:title", content: "Hospital Transfers — FundEzer Admin Portal" },
      {
        property: "og:description",
        content: "Review, approve and track patient transfers between partner hospitals.",
      },
    ],
  }),
  component: TransfersPage,
});

const OPEN_STATUSES = ["Submitted", "Under Review", "Receiving Hospital Pending"];

function TransfersPage() {
  const fetchTransfers = useServerFn(listTransfers);
  const fetchHospitals = useServerFn(listTransferHospitals);
  const updateStatus = useServerFn(setTransferStatus);
  const queryClient = useQueryClient();

  const transfersQuery = useQuery({ queryKey: ["transfers"], queryFn: () => fetchTransfers() });
  const hospitalsQuery = useQuery({
    queryKey: ["transfer-hospitals"],
    queryFn: () => fetchHospitals(),
  });
  const transfers = transfersQuery.data ?? [];
  const hospitals = hospitalsQuery.data ?? [];

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [urgency, setUrgency] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [choice, setChoice] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<null | "approve" | "reject" | "info" | "decline">(null);

  const mutation = useMutation({
    mutationFn: (input: {
      id: string;
      status: TransferStatusValue;
      note?: string;
      receivingHospitalId?: string | null;
      actedByHospital?: boolean;
    }) => updateStatus({ data: input }),
    onSuccess: async (record) => {
      await queryClient.invalidateQueries({ queryKey: ["transfers"] });
      await queryClient.invalidateQueries({ queryKey: ["audit"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setNote("");
      toast.success(`Transfer ${record.status}`, {
        description: `${record.reference} updated.`,
      });
    },
    onError: (error: unknown) =>
      toast.error("Could not update transfer", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  const rows = useMemo(
    () =>
      transfers.filter((t) => {
        const q = query.trim().toLowerCase();
        const matchQ =
          !q ||
          [t.reference, t.serviceName, t.patientName, t.reason].some((v) =>
            (v ?? "").toLowerCase().includes(q),
          );
        return (
          matchQ &&
          (status === "all" ||
            (status === "open" ? OPEN_STATUSES.includes(t.status) : t.status === status)) &&
          (urgency === "all" || t.urgency === urgency)
        );
      }),
    [transfers, query, status, urgency],
  );

  const active = transfers.find((t) => t.id === selected) ?? null;

  const candidates = useMemo(() => {
    if (!active) return [];
    const order: Record<string, number> = {
      Available: 0,
      "Temporarily Unavailable": 1,
      "Not Available": 2,
    };
    const list = hospitals
      .filter((h) => h.id !== active.fromHospitalId && h.verification !== "Suspended")
      .map((h) => ({
        hospital: h,
        status: (active.serviceId ? h.capabilities[active.serviceId] : undefined) ?? "Not Available",
        recommended: false,
      }));
    list.sort((a, b) => {
      const s = (order[a.status] ?? 3) - (order[b.status] ?? 3);
      if (s !== 0) return s;
      if (a.hospital.status !== b.hospital.status) return a.hospital.status === "active" ? -1 : 1;
      return b.hospital.beds - a.hospital.beds;
    });
    const first = list.find((c) => c.status === "Available" && c.hospital.status === "active");
    if (first) first.recommended = true;
    return list;
  }, [active, hospitals]);

  const recommendedId = candidates.find((c) => c.recommended)?.hospital.id ?? null;
  const stageIndex = active ? TRANSFER_FLOW.indexOf(active.status) : -1;
  const nextStage: TransferStatusValue | null =
    stageIndex >= 0 && stageIndex < TRANSFER_FLOW.length - 1
      ? (TRANSFER_FLOW[stageIndex + 1] as TransferStatusValue)
      : null;

  const close = () => {
    setSelected(null);
    setNote("");
    setChoice(null);
  };

  const busy = mutation.isPending;

  const footer = active ? (
    <>
      {active.status === "Submitted" ? (
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => mutation.mutate({ id: active.id, status: "Under Review" })}
        >
          Move to review
        </Button>
      ) : null}
      {["Submitted", "Under Review"].includes(active.status) ? (
        <>
          <Button
            variant="outline"
            onClick={() => setConfirm("info")}
            disabled={busy || note.trim().length < 5}
          >
            Request info
          </Button>
          <Button variant="ghost" disabled={busy} onClick={() => setConfirm("reject")}>
            Reject
          </Button>
          <Button
            onClick={() => setConfirm("approve")}
            disabled={busy || !(choice ?? recommendedId)}
          >
            Approve transfer
          </Button>
        </>
      ) : null}
      {active.status === "Receiving Hospital Pending" ? (
        <>
          <Button variant="ghost" disabled={busy} onClick={() => setConfirm("decline")}>
            <X className="size-4" /> Hospital declines
          </Button>
          <Button
            disabled={busy}
            onClick={() =>
              mutation.mutate({
                id: active.id,
                status: "Accepted",
                ...(note.trim() ? { note: note.trim() } : {}),
                actedByHospital: true,
              })
            }
          >
            <Check className="size-4" /> Hospital accepts
          </Button>
        </>
      ) : null}
      {nextStage ? (
        <Button
          disabled={busy}
          onClick={() =>
            mutation.mutate({
              id: active.id,
              status: nextStage,
              actedByHospital:
                nextStage === "Treatment Commenced" || nextStage === "Completed" ? true : false,
            })
          }
        >
          Mark {nextStage}
        </Button>
      ) : null}
    </>
  ) : null;

  return (
    <>
      <PageHeader
        title="Hospital Transfers"
        description="Route patients to facilities with the capability to treat them."
      />

      <SectionCard bodyClassName="p-0">
        <FilterBar>
          <SearchInput value={query} onChange={setQuery} placeholder="Search transfers" />
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "open", label: "Awaiting action" },
              ...TRANSFER_STATUSES.map((v) => ({ value: v, label: v })),
            ]}
          />
          <FilterSelect
            label="Urgency"
            value={urgency}
            onChange={setUrgency}
            options={["Low", "Medium", "High", "Critical"].map((v) => ({ value: v, label: v }))}
          />
          <span className="num ml-auto text-xs text-muted-foreground">
            {rows.length} of {transfers.length}
          </span>
        </FilterBar>

        {transfersQuery.isLoading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : transfersQuery.isError ? (
          <EmptyState
            title="Could not load transfers"
            description="Something went wrong while loading transfer requests."
            action={<Button onClick={() => transfersQuery.refetch()}>Try again</Button>}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            searching={transfers.length > 0}
            title={transfers.length === 0 ? "No transfer requests yet" : "No transfer requests match"}
            description={
              transfers.length === 0
                ? "Transfer requests raised by partner hospitals will appear here."
                : "Adjust the status or urgency filter to see more requests."
            }
          />
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>Request</Th>
                <Th>Patient</Th>
                <Th>From</Th>
                <Th>Service</Th>
                <Th>Urgency</Th>
                <Th>Status</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <Tr
                  key={t.id}
                  onClick={() => {
                    setSelected(t.id);
                    setNote("");
                    setChoice(t.receivingHospitalId);
                  }}
                >
                  <Td className="num font-medium">{t.reference}</Td>
                  <Td className="max-w-[14rem] truncate">{t.patientName}</Td>
                  <Td className="max-w-[16rem] truncate text-muted-foreground">
                    {t.fromHospitalName}
                  </Td>
                  <Td>{t.serviceName}</Td>
                  <Td>
                    <StatusBadge status={t.urgency} />
                  </Td>
                  <Td>
                    <StatusBadge status={t.status} />
                  </Td>
                  <Td className="num text-muted-foreground">{shortDate(t.requestedAt)}</Td>
                </Tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </SectionCard>

      <DetailDrawer
        open={!!active}
        onOpenChange={(o) => !o && close()}
        title={active ? `Transfer ${active.reference}` : ""}
        subtitle={active ? `${active.patientName} · ${active.serviceName}` : ""}
        footer={footer}
      >
        {active ? (
          <>
            <DrawerSection title="Request details">
              <FieldGrid>
                <Field label="Patient" value={active.patientName} />
                <Field label="Campaign" value={active.campaignTitle} />
                <Field label="From hospital" value={active.fromHospitalName} />
                <Field label="Required service" value={active.serviceName} />
                <Field label="Urgency" value={<StatusBadge status={active.urgency} />} />
                <Field label="Status" value={<StatusBadge status={active.status} />} />
                <Field label="Treatment phase" value={active.treatmentPhase} />
                <Field label="Requested" value={shortDate(active.requestedAt)} />
                <Field label="Reason" value={active.reason} className="sm:col-span-2" />
                {active.adminDecision ? (
                  <Field
                    label="Latest admin note"
                    value={active.adminDecision}
                    className="sm:col-span-2"
                  />
                ) : null}
                {active.receivingHospitalName ? (
                  <Field
                    label="Receiving hospital"
                    value={active.receivingHospitalName}
                    className="sm:col-span-2"
                  />
                ) : null}
              </FieldGrid>
            </DrawerSection>

            {["Submitted", "Under Review"].includes(active.status) ? (
              <DrawerSection title="Matching hospitals">
                <div className="space-y-2">
                  {candidates.slice(0, 6).map((c) => {
                    const picked = (choice ?? recommendedId) === c.hospital.id;
                    return (
                      <button
                        key={c.hospital.id}
                        type="button"
                        onClick={() => setChoice(c.hospital.id)}
                        className={cn(
                          "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors",
                          picked
                            ? "border-primary bg-primary-soft/60"
                            : "border-border hover:bg-secondary",
                        )}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {c.hospital.name}
                            {c.recommended ? (
                              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary-foreground uppercase">
                                Recommended
                              </span>
                            ) : null}
                          </p>
                          <p className="num truncate text-xs text-muted-foreground">
                            {c.hospital.city} · {c.hospital.beds} beds · {c.hospital.status}
                          </p>
                        </div>
                        <StatusBadge status={c.status} />
                      </button>
                    );
                  })}
                  {candidates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No other partner hospitals are available yet.
                    </p>
                  ) : null}
                </div>
              </DrawerSection>
            ) : null}

            {["Submitted", "Under Review", "Receiving Hospital Pending"].includes(active.status) ? (
              <DrawerSection title="Admin note">
                <Textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional note attached to the next action (required to request information)."
                />
              </DrawerSection>
            ) : null}

            <DrawerSection title="Workflow">
              <ol className="space-y-2">
                {TRANSFER_FLOW.map((s) => {
                  const done = active.timeline.some((e) => e.status === s);
                  return (
                    <li key={s} className="flex items-center gap-3">
                      <span
                        className={cn(
                          "grid size-5 shrink-0 place-items-center rounded-full",
                          done ? "bg-success-soft text-success" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {done ? <Check className="size-3" /> : null}
                      </span>
                      <span
                        className={cn(
                          "text-sm",
                          done ? "font-medium text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {s}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </DrawerSection>

            <DrawerSection title="Timeline">
              <div className="space-y-3">
                {[...active.timeline].reverse().map((e) => (
                  <div key={e.id} className="rounded-md border border-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StatusBadge status={e.status} />
                      <span className="num text-xs text-muted-foreground">{dateTime(e.at)}</span>
                    </div>
                    <p className="mt-2 text-sm text-foreground">{e.by}</p>
                    {e.note ? <p className="mt-1 text-sm text-muted-foreground">{e.note}</p> : null}
                  </div>
                ))}
                {active.timeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No timeline events recorded yet.</p>
                ) : null}
              </div>
            </DrawerSection>
          </>
        ) : null}
      </DetailDrawer>

      <ConfirmDialog
        open={confirm === "approve"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Approve transfer?"
        description={`The receiving hospital will be asked to accept ${active ? active.patientName : "the patient"}.`}
        confirmLabel="Approve"
        onConfirm={() => {
          const receiving = choice ?? recommendedId;
          if (active && receiving) {
            mutation.mutate({
              id: active.id,
              status: "Receiving Hospital Pending",
              receivingHospitalId: receiving,
              ...(note.trim() ? { note: note.trim() } : {}),
            });
          }
          setConfirm(null);
        }}
      />
      <ConfirmDialog
        open={confirm === "reject"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Reject transfer request?"
        description="The requesting hospital will be notified that this transfer will not proceed."
        confirmLabel="Reject"
        destructive
        onConfirm={() => {
          if (active)
            mutation.mutate({
              id: active.id,
              status: "Rejected",
              note: note.trim() || "Rejected by admin.",
            });
          setConfirm(null);
        }}
      />
      <ConfirmDialog
        open={confirm === "info"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Request more information?"
        description="Your note will be recorded on the request and it stays under review."
        confirmLabel="Send request"
        onConfirm={() => {
          if (active)
            mutation.mutate({
              id: active.id,
              status: "Under Review",
              note: `Information requested: ${note.trim()}`,
            });
          setConfirm(null);
        }}
      />
      <ConfirmDialog
        open={confirm === "decline"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Receiving hospital declines?"
        description="The transfer will be marked as rejected and can be re-routed to another facility."
        confirmLabel="Record decline"
        destructive
        onConfirm={() => {
          if (active)
            mutation.mutate({
              id: active.id,
              status: "Rejected",
              note: note.trim() || "Receiving hospital declined the transfer.",
              actedByHospital: true,
            });
          setConfirm(null);
        }}
      />
    </>
  );
}
