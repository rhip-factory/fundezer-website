import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { deletePatient } from "@/lib/admin/deletions.functions";
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
import { Skeleton } from "@/components/ui/skeleton";
import { listPatients } from "@/lib/admin/patients.functions";
import { shortDate } from "@/lib/admin/format";
import { Check, Circle } from "lucide-react";

export const Route = createFileRoute("/admin/patients")({
  head: () => ({
    meta: [
      { title: "Patients — FundEzer Admin Portal" },
      {
        name: "description",
        content:
          "Browse anonymised patient records, treatment journeys, hospital history and linked funding campaigns.",
      },
      { property: "og:title", content: "Patients — FundEzer Admin Portal" },
      {
        property: "og:description",
        content: "Anonymised patient records, treatment journeys and linked campaigns.",
      },
    ],
  }),
  component: PatientsPage,
});

const STATUSES = ["Active", "Under Treatment", "Transferred", "Recovered", "Closed"];

function PatientsPage() {
  const fetchPatients = useServerFn(listPatients);
  const patientsQuery = useQuery({ queryKey: ["patients"], queryFn: () => fetchPatients() });
  const patients = patientsQuery.data ?? [];

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [causeFilter, setCauseFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const queryClient = useQueryClient();
  const removeFn = useServerFn(deletePatient);
  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeFn({ data: { id } }),
    onSuccess: async () => {
      setSelected(null);
      await queryClient.invalidateQueries();
      toast.success("Patient deleted");
    },
    onError: (error) =>
      toast.error("Could not delete patient", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  const causeOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of patients) if (p.causeId) map.set(p.causeId, p.causeName);
    return [...map].map(([value, label]) => ({ value, label }));
  }, [patients]);

  const rows = useMemo(
    () =>
      patients.filter((p) => {
        const q = query.trim().toLowerCase();
        const matchQ =
          !q ||
          [p.displayName, p.reference, p.condition].some((v) => v.toLowerCase().includes(q));
        return (
          matchQ &&
          (status === "all" || p.status === status) &&
          (causeFilter === "all" || p.causeId === causeFilter)
        );
      }),
    [patients, query, status, causeFilter],
  );

  const active = patients.find((p) => p.id === selected) ?? null;

  return (
    <>
      <PageHeader
        title="Patients"
        description="Anonymised patient records linked to hospitals, causes and campaigns."
      />

      <SectionCard bodyClassName="p-0">
        <FilterBar>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search patients or references"
          />
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={STATUSES.map((v) => ({ value: v, label: v }))}
          />
          <FilterSelect
            label="Cause"
            value={causeFilter}
            onChange={setCauseFilter}
            options={causeOptions}
          />
          <span className="num ml-auto text-xs text-muted-foreground">
            {rows.length} of {patients.length}
          </span>
        </FilterBar>

        {patientsQuery.isLoading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : patientsQuery.isError ? (
          <EmptyState
            title="Could not load patients"
            description="Something went wrong while loading patient records."
            action={<Button onClick={() => patientsQuery.refetch()}>Try again</Button>}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            searching
            title="No patients match your filters"
            description="Try a different search term or clear the status and cause filters."
          />
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>Patient</Th>
                <Th>Reference</Th>
                <Th>Hospital</Th>
                <Th>Cause</Th>
                <Th>Treatment stage</Th>
                <Th>Status</Th>
                <Th>Updated</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <Tr key={p.id} onClick={() => setSelected(p.id)}>
                  <Td className="font-medium">{p.displayName}</Td>
                  <Td className="num text-muted-foreground">{p.reference}</Td>
                  <Td className="max-w-[16rem] truncate">{p.hospitalName}</Td>
                  <Td>{p.causeName}</Td>
                  <Td className="text-muted-foreground">{p.treatmentStage}</Td>
                  <Td>
                    <StatusBadge status={p.status} />
                  </Td>
                  <Td className="num text-muted-foreground">{shortDate(p.lastUpdated)}</Td>
                </Tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </SectionCard>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this patient permanently?"
        description="The patient and all their applications, campaigns, transfers, treatment records and documents will be erased. Donation records are kept but unlinked. This cannot be undone."
        confirmLabel="Delete patient"
        destructive
        onConfirm={() => {
          if (active) deleteMutation.mutate(active.id);
          setConfirmDelete(false);
        }}
      />

      <DetailDrawer
        open={!!active}
        onOpenChange={(o) => !o && setSelected(null)}
        title={active?.displayName ?? ""}
        subtitle={active ? `${active.reference} · ${active.condition}` : ""}
        footer={
          active ? (
            <Button
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
              disabled={deleteMutation.isPending}
            >
              Delete patient
            </Button>
          ) : null
        }
      >
        {active ? (
          <>
            <DrawerSection title="Overview">
              <FieldGrid>
                <Field label="Age band" value={active.ageBand} />
                <Field label="Gender" value={active.gender} />
                <Field label="Hospital" value={active.hospitalName} />
                <Field label="Cause" value={active.causeName} />
                <Field label="Treatment stage" value={active.treatmentStage} />
                <Field label="Status" value={<StatusBadge status={active.status} />} />
                <Field label="Urgency" value={<StatusBadge status={active.urgency} />} />
                <Field label="Campaign" value={active.campaignTitle} />
                <Field
                  label="Medical summary"
                  value={active.medicalSummary || "—"}
                  className="sm:col-span-2"
                />
              </FieldGrid>
            </DrawerSection>

            <DrawerSection title="Treatment journey">
              {active.journey.length === 0 ? (
                <p className="text-sm text-muted-foreground">No journey stages recorded yet.</p>
              ) : (
                <ol className="space-y-3">
                  {active.journey.map((j, i) => (
                    <li key={`${j.stage}-${i}`} className="flex items-start gap-3">
                      <span
                        className={
                          j.done
                            ? "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success-soft text-success"
                            : "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"
                        }
                      >
                        {j.done ? <Check className="size-3" /> : <Circle className="size-2" />}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{j.stage}</p>
                        <p className="num text-xs text-muted-foreground">
                          {j.date ? shortDate(j.date) : j.status}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </DrawerSection>

            <DrawerSection title="Clinical updates">
              {active.updates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No clinical updates recorded.</p>
              ) : (
                <div className="space-y-3">
                  {active.updates.map((u) => (
                    <div key={u.id} className="rounded-md border border-border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{u.author}</p>
                        <p className="num text-xs text-muted-foreground">{shortDate(u.date)}</p>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{u.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </DrawerSection>

            <DrawerSection title="Hospital history">
              {active.hospitalHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hospital history recorded.</p>
              ) : (
                <div className="space-y-2">
                  {active.hospitalHistory.map((h) => (
                    <div
                      key={h.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {h.hospitalName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{h.reason}</p>
                      </div>
                      <p className="num text-xs whitespace-nowrap text-muted-foreground">
                        {shortDate(h.from)} — {h.to ? shortDate(h.to) : "present"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </DrawerSection>
          </>
        ) : null}
      </DetailDrawer>
    </>
  );
}
