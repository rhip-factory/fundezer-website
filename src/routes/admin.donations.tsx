import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Wallet, Repeat, PiggyBank, TriangleAlert } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  DetailDrawer,
  DrawerSection,
  EmptyState,
  Field,
  FieldGrid,
  FilterBar,
  FilterSelect,
  KpiCard,
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
import { DONATION_TYPE_LABELS, listDonations } from "@/lib/admin/donations.functions";
import { naira, shortDate } from "@/lib/admin/format";

export const Route = createFileRoute("/admin/donations")({
  head: () => ({
    meta: [
      { title: "Donations — FundEzer Admin Portal" },
      {
        name: "description",
        content:
          "Track every donation to patient campaigns and cause pools, including payment state, allocation and recurring giving.",
      },
      { property: "og:title", content: "Donations — FundEzer Admin Portal" },
      {
        property: "og:description",
        content: "Track donations, payment state, allocation and recurring giving.",
      },
    ],
  }),
  component: DonationsPage,
});

function DonationsPage() {
  const fetchDonations = useServerFn(listDonations);
  const donationsQuery = useQuery({ queryKey: ["donations"], queryFn: () => fetchDonations() });
  const donations = donationsQuery.data?.donations ?? [];
  const recurringDonors = donationsQuery.data?.recurringDonors ?? 0;

  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [payment, setPayment] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      donations.filter((d) => {
        const q = query.trim().toLowerCase();
        return (
          (!q || [d.donor, d.channel, d.destination].some((v) => v.toLowerCase().includes(q))) &&
          (type === "all" || d.type === type) &&
          (payment === "all" || d.payment === payment) &&
          (status === "all" || d.allocation === status)
        );
      }),
    [donations, query, type, payment, status],
  );

  const stats = useMemo(() => {
    const paid = donations.filter((d) => d.payment === "Paid");
    return {
      total: paid.reduce((s, d) => s + d.amount, 0),
      toCauses: paid.filter((d) => d.type === "Cause Donation").reduce((s, d) => s + d.amount, 0),
      needsAttention: donations.filter(
        (d) => d.payment === "Failed" || d.allocation === "Held" || d.allocation === "Under Review",
      ).length,
    };
  }, [donations]);

  const active = donations.find((d) => d.id === selected) ?? null;

  return (
    <>
      <PageHeader
        title="Donations"
        description="All contributions across patient campaigns, cause pools and recurring plans."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Collected"
          value={naira(stats.total, true)}
          hint="Settled payments only"
          icon={Wallet}
        />
        <KpiCard
          label="Into cause pools"
          value={naira(stats.toCauses, true)}
          hint="Unallocated pooled giving"
          icon={PiggyBank}
          tone="info"
        />
        <KpiCard
          label="Recurring donors"
          value={recurringDonors}
          hint="Active giving plans"
          icon={Repeat}
          tone="success"
        />
        <KpiCard
          label="Needs attention"
          value={stats.needsAttention}
          hint="Failed, held or under review"
          icon={TriangleAlert}
          tone="warning"
        />
      </div>

      <SectionCard bodyClassName="p-0">
        <FilterBar>
          <SearchInput value={query} onChange={setQuery} placeholder="Search donors or channels" />
          <FilterSelect
            label="Type"
            value={type}
            onChange={setType}
            options={DONATION_TYPE_LABELS.map((v) => ({ value: v, label: v }))}
          />
          <FilterSelect
            label="Payment"
            value={payment}
            onChange={setPayment}
            options={["Paid", "Pending", "Failed", "Refunded"].map((v) => ({ value: v, label: v }))}
          />
          <FilterSelect
            label="Allocation"
            value={status}
            onChange={setStatus}
            options={["Allocated", "Under Review", "Held", "Reversed"].map((v) => ({
              value: v,
              label: v,
            }))}
          />
          <span className="num ml-auto text-xs text-muted-foreground">
            {rows.length} of {donations.length}
          </span>
        </FilterBar>

        {donationsQuery.isLoading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : donationsQuery.isError ? (
          <EmptyState
            title="Could not load donations"
            description="Something went wrong while loading donation records."
            action={<Button onClick={() => donationsQuery.refetch()}>Try again</Button>}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            searching
            title="No donations match"
            description="Clear a filter or search for a different donor."
          />
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>Donor</Th>
                <Th>Type</Th>
                <Th>Destination</Th>
                <Th>Amount</Th>
                <Th>Payment</Th>
                <Th>Allocation</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <Tr key={d.id} onClick={() => setSelected(d.id)}>
                  <Td className="font-medium">{d.donor}</Td>
                  <Td>
                    <StatusBadge status={d.type} />
                  </Td>
                  <Td className="max-w-[18rem] truncate text-muted-foreground">{d.destination}</Td>
                  <Td className="num">{naira(d.amount)}</Td>
                  <Td>
                    <StatusBadge status={d.payment} />
                  </Td>
                  <Td>
                    <StatusBadge status={d.allocation} />
                  </Td>
                  <Td className="num text-muted-foreground">{shortDate(d.date)}</Td>
                </Tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </SectionCard>

      <DetailDrawer
        open={!!active}
        onOpenChange={(o) => !o && setSelected(null)}
        title={active ? `${naira(active.amount)} from ${active.donor}` : ""}
        subtitle={active ? `DON-${active.id.slice(0, 6).toUpperCase()} · ${active.channel}` : ""}
      >
        {active ? (
          <DrawerSection title="Donation record">
            <FieldGrid>
              <Field label="Donor" value={active.donor} />
              <Field label="Type" value={<StatusBadge status={active.type} />} />
              <Field label="Amount" value={<span className="num">{naira(active.amount)}</span>} />
              <Field label="Date" value={shortDate(active.date)} />
              <Field label="Payment" value={<StatusBadge status={active.payment} />} />
              <Field label="Allocation" value={<StatusBadge status={active.allocation} />} />
              <Field label="Channel" value={active.channel} />
              {active.recurringCadence ? (
                <Field label="Cadence" value={active.recurringCadence} />
              ) : null}
              <Field label="Destination" className="sm:col-span-2" value={active.destination} />
              {active.message ? (
                <Field label="Message" className="sm:col-span-2" value={active.message} />
              ) : null}
            </FieldGrid>
          </DrawerSection>
        ) : null}
      </DetailDrawer>
    </>
  );
}
