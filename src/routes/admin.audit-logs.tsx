import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  EmptyState,
  FilterBar,
  FilterSelect,
  PageHeader,
  SearchInput,
  SectionCard,
  TableShell,
  Td,
  Th,
  Tr,
} from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listAuditLogs } from "@/lib/admin/audit.functions";
import { dateTime } from "@/lib/admin/format";

export const Route = createFileRoute("/admin/audit-logs")({
  head: () => ({
    meta: [
      { title: "Audit Log — FundEzer Admin Portal" },
      {
        name: "description",
        content:
          "Immutable record of every administrative action taken in FundEzer: who did what, to which record, and when.",
      },
      { property: "og:title", content: "Audit Log — FundEzer Admin Portal" },
      {
        property: "og:description",
        content: "Immutable record of administrative actions across the FundEzer portal.",
      },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const fetchAudit = useServerFn(listAuditLogs);
  const auditQuery = useQuery({ queryKey: ["audit"], queryFn: () => fetchAudit() });
  const audit = auditQuery.data ?? [];

  const [query, setQuery] = useState("");
  const [recordType, setRecordType] = useState("all");

  const types = useMemo(() => Array.from(new Set(audit.map((a) => a.recordType))).sort(), [audit]);

  const rows = useMemo(
    () =>
      audit.filter((a) => {
        const q = query.trim().toLowerCase();
        return (
          (!q ||
            [a.user, a.action, a.record, a.description].some((v) => v.toLowerCase().includes(q))) &&
          (recordType === "all" || a.recordType === recordType)
        );
      }),
    [audit, query, recordType],
  );

  return (
    <>
      <PageHeader
        title="Audit Log"
        description="Every state change in the portal is recorded here for compliance review."
      />

      <SectionCard bodyClassName="p-0">
        <FilterBar>
          <SearchInput value={query} onChange={setQuery} placeholder="Search actions or records" />
          <FilterSelect
            label="Record"
            value={recordType}
            onChange={setRecordType}
            options={types.map((t) => ({ value: t, label: t }))}
          />
          <span className="num ml-auto text-xs text-muted-foreground">
            {rows.length} of {audit.length}
          </span>
        </FilterBar>

        {auditQuery.isLoading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : auditQuery.isError ? (
          <EmptyState
            title="Could not load the audit log"
            description="Something went wrong while loading audit records."
            action={<Button onClick={() => auditQuery.refetch()}>Try again</Button>}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            searching
            title="No audit entries match"
            description="Try a different keyword or record type."
          />
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>Timestamp</Th>
                <Th>User</Th>
                <Th>Action</Th>
                <Th>Record</Th>
                <Th>Description</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <Tr key={a.id}>
                  <Td className="num whitespace-nowrap text-muted-foreground">{dateTime(a.at)}</Td>
                  <Td>
                    <span className="block text-sm font-medium text-foreground">{a.user}</span>
                    <span className="block text-xs text-muted-foreground">{a.role}</span>
                  </Td>
                  <Td className="font-medium">{a.action}</Td>
                  <Td className="num whitespace-nowrap text-muted-foreground">
                    {a.recordType} · {a.record}
                  </Td>
                  <Td className="max-w-[28rem] text-muted-foreground">{a.description}</Td>
                </Tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </SectionCard>
    </>
  );
}
