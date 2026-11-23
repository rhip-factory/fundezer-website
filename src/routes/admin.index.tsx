import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  Building2,
  Megaphone,
  Wallet,
  ArrowLeftRight,
  Repeat,
  ArrowRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  EmptyState,
  KpiCard,
  PageHeader,
  SectionCard,
  StatusBadge,
  TableShell,
  Th,
  Td,
  Tr,
  FundingProgress,
} from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboard } from "@/lib/admin/dashboard.functions";
import { naira, shortDate } from "@/lib/admin/format";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard — FundEzer Admin Portal" },
      {
        name: "description",
        content:
          "Live overview of FundEzer funding: donations raised, active campaigns, patients in care and pending hospital transfers.",
      },
      { property: "og:title", content: "Dashboard — FundEzer Admin Portal" },
      {
        property: "og:description",
        content: "Live overview of FundEzer funding, campaigns, patients and hospital transfers.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const fetchDashboard = useServerFn(getDashboard);
  const dashboard = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDashboard() });
  const data = dashboard.data;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Funding, care and transfer activity across the FundEzer network."
        actions={
          <Button asChild>
            <Link to="/admin/transfers">
              Review transfers <ArrowRight className="size-4" />
            </Link>
          </Button>
        }
      />

      {dashboard.isError ? (
        <SectionCard bodyClassName="p-0">
          <EmptyState
            title="Could not load dashboard"
            description="Something went wrong while loading live data."
            action={<Button onClick={() => dashboard.refetch()}>Try again</Button>}
          />
        </SectionCard>
      ) : !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <KpiCard
              label="Total raised"
              value={naira(data.raised, true)}
              hint={`${data.donationCount} donations recorded`}
              icon={Wallet}
              tone="brand"
            />
            <KpiCard
              label="Active campaigns"
              value={data.activeCampaigns}
              hint={`${data.totalCampaigns} campaigns total`}
              icon={Megaphone}
              tone="info"
            />
            <KpiCard
              label="Patients supported"
              value={data.patients}
              hint="Across all partner hospitals"
              icon={Users}
              tone="success"
            />
            <KpiCard
              label="Partner hospitals"
              value={data.activeHospitals}
              hint={`${data.totalHospitals} onboarded`}
              icon={Building2}
              tone="neutral"
            />
            <KpiCard
              label="Transfers pending"
              value={data.pendingTransfers}
              hint="Awaiting admin or hospital action"
              icon={ArrowLeftRight}
              tone="warning"
            />
            <KpiCard
              label="Recurring donors"
              value={data.recurringDonors}
              hint="Active giving plans"
              icon={Repeat}
              tone="brand"
            />
          </div>

          <SectionCard
            title="Donation trend"
            description="Patient campaigns vs cause pools, last 7 months"
          >
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gPatient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gCause" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-3)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--color-chart-3)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                  />
                  <YAxis
                    tickFormatter={(v: number) => naira(v, true)}
                    tickLine={false}
                    axisLine={false}
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    width={70}
                  />
                  <RTooltip
                    formatter={(v: number, name: string) => [
                      naira(v),
                      name === "patient" ? "Patient donations" : "Cause donations",
                    ]}
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "var(--color-popover-foreground)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="patient"
                    stroke="var(--color-chart-1)"
                    fill="url(#gPatient)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="cause"
                    stroke="var(--color-chart-3)"
                    fill="url(#gCause)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard
              title="Cause pools"
              description="Funding progress by cause"
              actions={
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/causes">View all</Link>
                </Button>
              }
              bodyClassName="px-5 py-4 space-y-4"
            >
              {data.topCauses.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No active causes yet.
                </p>
              ) : (
                data.topCauses.map((c) => (
                  <div key={c.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                      <p className="num text-xs text-muted-foreground">
                        {c.patientsSupported} patients · {c.totalDonations} donations
                      </p>
                    </div>
                    <FundingProgress raised={c.pool} target={c.fundingTarget} />
                  </div>
                ))
              )}
            </SectionCard>

            <SectionCard
              title="Transfer queue"
              description="Requests awaiting action"
              actions={
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/transfers">Open queue</Link>
                </Button>
              }
              bodyClassName="px-5 py-4 space-y-3"
            >
              {data.queue.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No transfers awaiting action.
                </p>
              ) : (
                data.queue.map((t) => (
                  <div
                    key={t.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-border px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {t.reference} · {t.serviceName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {shortDate(t.requestedAt)} · {t.urgency}
                      </p>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                ))
              )}
            </SectionCard>
          </div>

          <SectionCard
            title="Recent donations"
            description="Latest recorded contributions"
            actions={
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/donations">View all</Link>
              </Button>
            }
            bodyClassName="p-0"
          >
            <TableShell>
              <thead>
                <tr>
                  <Th>Donor</Th>
                  <Th>Type</Th>
                  <Th>Amount</Th>
                  <Th>Date</Th>
                  <Th>Payment</Th>
                  <Th>Allocation</Th>
                </tr>
              </thead>
              <tbody>
                {data.recentDonations.map((d) => (
                  <Tr key={d.id}>
                    <Td className="font-medium">{d.donor}</Td>
                    <Td>
                      <StatusBadge status={d.type} />
                    </Td>
                    <Td className="num">{naira(d.amount)}</Td>
                    <Td className="num text-muted-foreground">{shortDate(d.date)}</Td>
                    <Td>
                      <StatusBadge status={d.payment} />
                    </Td>
                    <Td>
                      <StatusBadge status={d.allocation} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </TableShell>
          </SectionCard>
        </>
      )}
    </>
  );
}
