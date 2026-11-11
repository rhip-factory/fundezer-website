import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  DetailDrawer,
  DrawerSection,
  EmptyState,
  Field,
  FieldGrid,
  FilterBar,
  FilterSelect,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  APPLICATION_STATUSES,
  listApplications,
  setApplicationStatus as setApplicationStatusFn,
  type ApplicationRecord,
  type ApplicationStatus,
} from "@/lib/admin/applications.functions";
import { dateTime, naira, shortDate } from "@/lib/admin/format";

export const Route = createFileRoute("/admin/applications")({
  head: () => ({
    meta: [
      { title: "Applications — FundEzer Admin Portal" },
      {
        name: "description",
        content:
          "Review patient funding applications submitted to FundEzer, filter by status and move each request through the review workflow.",
      },
      { property: "og:title", content: "Applications — FundEzer Admin Portal" },
      {
        property: "og:description",
        content: "Review, verify and decide on patient funding applications.",
      },
    ],
  }),
  component: ApplicationsPage,
});

const NEXT_STATUSES: Record<ApplicationStatus, ApplicationStatus[]> = {
  Submitted: ["Under Review", "Information Requested", "Rejected", "Withdrawn"],
  "Under Review": ["Information Requested", "Verified", "Rejected", "Withdrawn"],
  "Information Requested": ["Under Review", "Rejected", "Withdrawn"],
  Verified: ["Approved", "Rejected", "Withdrawn"],
  Approved: ["Withdrawn"],
  Rejected: ["Under Review"],
  Withdrawn: ["Under Review"],
};

function ApplicationsPage() {
  const queryClient = useQueryClient();
  const fetchApplications = useServerFn(listApplications);
  const statusFn = useServerFn(setApplicationStatusFn);

  const applicationsQuery = useQuery({
    queryKey: ["applications"],
    queryFn: () => fetchApplications(),
  });
  const applications = useMemo(() => applicationsQuery.data ?? [], [applicationsQuery.data]);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<ApplicationStatus | "">("");
  const [note, setNote] = useState("");

  const selected = applications.find((a) => a.id === openId) ?? null;

  const statusMutation = useMutation({
    mutationFn: (input: { id: string; status: ApplicationStatus; note?: string }) =>
      statusFn({ data: input }),
    onSuccess: async (application) => {
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      setNextStatus("");
      setNote("");
      toast.success("Application updated", {
        description: `${application.title} is now ${application.status}.`,
      });
    },
    onError: (error) =>
      toast.error("Could not update application", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  const rows = useMemo(
    () =>
      applications.filter((a) => {
        const q = query.trim().toLowerCase();
        return (
          (!q ||
            a.title.toLowerCase().includes(q) ||
            a.patientName.toLowerCase().includes(q) ||
            a.patientReference.toLowerCase().includes(q) ||
            a.hospitalName.toLowerCase().includes(q)) &&
          (status === "all" || a.status === status)
        );
      }),
    [applications, query, status],
  );

  const openApplication = (a: ApplicationRecord) => {
    setOpenId(a.id);
    setNextStatus("");
    setNote("");
  };

  return (
    <>
      <PageHeader
        title="Applications"
        description="Funding applications submitted by patients and hospitals, reviewed before a campaign goes live."
      />

      <SectionCard bodyClassName="p-0">
        <FilterBar>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by title, patient or hospital"
          />
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={APPLICATION_STATUSES.map((v) => ({ value: v, label: v }))}
          />
          <span className="num ml-auto text-xs text-muted-foreground">
            {rows.length} of {applications.length}
          </span>
        </FilterBar>

        {applicationsQuery.isLoading ? (
          <TableSkeleton cols={6} />
        ) : applicationsQuery.isError ? (
          <EmptyState
            title="Could not load applications"
            description="Something went wrong while loading applications from the database."
            action={<Button onClick={() => applicationsQuery.refetch()}>Try again</Button>}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            searching={applications.length > 0}
            title={applications.length > 0 ? "No applications found" : "No applications yet"}
            description={
              applications.length > 0
                ? "Clear your filters to see every application."
                : "Applications submitted from the Patient Portal will appear here."
            }
          />
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>Application</Th>
                <Th>Patient</Th>
                <Th>Hospital</Th>
                <Th className="text-right">Requested</Th>
                <Th>Status</Th>
                <Th>Submitted</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <Tr key={a.id} onClick={() => openApplication(a)}>
                  <Td>
                    <span className="block font-medium">{a.title}</span>
                    <span className="num block text-xs text-muted-foreground">
                      APP-{a.id.slice(0, 6).toUpperCase()}
                    </span>
                  </Td>
                  <Td>
                    <span className="block">{a.patientName}</span>
                    <span className="num block text-xs text-muted-foreground">
                      {a.patientReference}
                    </span>
                  </Td>
                  <Td>{a.hospitalName}</Td>
                  <Td className="num text-right">{naira(a.requestedAmount)}</Td>
                  <Td>
                    <StatusBadge status={a.status} />
                  </Td>
                  <Td className="num whitespace-nowrap">{shortDate(a.submittedAt)}</Td>
                </Tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </SectionCard>

      <DetailDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setOpenId(null)}
        title={selected?.title ?? "Application"}
        subtitle={
          selected ? `APP-${selected.id.slice(0, 6).toUpperCase()} · ${selected.patientName}` : ""
        }
      >
        {selected ? (
          <>
            <DrawerSection title="Overview" actions={<StatusBadge status={selected.status} />}>
              <FieldGrid>
                <Field label="Patient" value={selected.patientName} />
                <Field label="Patient reference" value={selected.patientReference} />
                <Field label="Condition" value={selected.patientCondition} />
                <Field label="Urgency" value={<StatusBadge status={selected.patientUrgency} />} />
                <Field label="Hospital" value={selected.hospitalName} />
                <Field label="Service" value={selected.serviceName} />
                <Field label="Cause" value={selected.causeName} />
                <Field label="Requested amount" value={naira(selected.requestedAmount)} />
              </FieldGrid>
            </DrawerSection>

            <DrawerSection title="Request">
              <p className="text-sm text-muted-foreground">
                {selected.description || "No description was provided with this application."}
              </p>
            </DrawerSection>

            <DrawerSection title="Timeline">
              <FieldGrid>
                <Field label="Submitted" value={dateTime(selected.submittedAt)} />
                <Field label="Status changed" value={dateTime(selected.statusChangedAt)} />
                <Field
                  label="Reviewed"
                  value={selected.reviewedAt ? dateTime(selected.reviewedAt) : "Not yet reviewed"}
                />
                <Field
                  label="Decided"
                  value={selected.decidedAt ? dateTime(selected.decidedAt) : "No decision yet"}
                />
              </FieldGrid>
            </DrawerSection>

            {selected.reviewNotes || selected.verificationNotes ? (
              <DrawerSection title="Notes">
                <div className="space-y-3">
                  {selected.reviewNotes ? (
                    <Field label="Review notes" value={selected.reviewNotes} />
                  ) : null}
                  {selected.verificationNotes ? (
                    <Field label="Verification notes" value={selected.verificationNotes} />
                  ) : null}
                </div>
              </DrawerSection>
            ) : null}

            <DrawerSection title="Update status">
              <div className="space-y-4">
                <LabeledInput
                  label="Move to"
                  hint="Only the next valid steps in the review workflow are listed."
                >
                  <Select
                    value={nextStatus}
                    onValueChange={(v) => setNextStatus(v as ApplicationStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      {NEXT_STATUSES[selected.status].map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </LabeledInput>
                <LabeledInput label="Note (optional)">
                  <Textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add context for the audit log and the requesting hospital"
                  />
                </LabeledInput>
                <Button
                  disabled={!nextStatus || statusMutation.isPending}
                  onClick={() =>
                    nextStatus &&
                    statusMutation.mutate({
                      id: selected.id,
                      status: nextStatus,
                      ...(note.trim() ? { note: note.trim() } : {}),
                    })
                  }
                >
                  {statusMutation.isPending ? "Saving…" : "Save status"}
                </Button>
              </div>
            </DrawerSection>
          </>
        ) : null}
      </DetailDrawer>
    </>
  );
}
