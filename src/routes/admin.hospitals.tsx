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
  Td,
  Th,
  Tr,
} from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createHospital, listHospitals, listServices } from "@/lib/admin/hospitals.functions";
import { shortDate } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/hospitals")({
  head: () => ({
    meta: [
      { title: "Hospitals — FundEzer Admin Portal" },
      {
        name: "description",
        content:
          "Partner hospital directory with verification status, service capabilities, equipment and bed capacity.",
      },
      { property: "og:title", content: "Hospitals — FundEzer Admin Portal" },
      {
        property: "og:description",
        content: "Partner hospital directory with capabilities, equipment and capacity.",
      },
    ],
  }),
  component: HospitalsPage,
});

const emptyDraft = {
  name: "",
  city: "",
  state: "",
  contactRole: "",
  email: "",
  phone: "",
  beds: "",
  accreditation: "",
  verification: "Pending" as "Verified" | "Pending" | "Suspended",
  status: "active" as "active" | "inactive" | "suspended",
  serviceIds: [] as string[],
};

function HospitalsPage() {
  const fetchHospitals = useServerFn(listHospitals);
  const fetchServices = useServerFn(listServices);
  const addHospital = useServerFn(createHospital);
  const queryClient = useQueryClient();

  const hospitalsQuery = useQuery({ queryKey: ["hospitals"], queryFn: () => fetchHospitals() });
  const servicesQuery = useQuery({ queryKey: ["services"], queryFn: () => fetchServices() });
  const hospitals = hospitalsQuery.data ?? [];
  const services = servicesQuery.data ?? [];

  const [query, setQuery] = useState("");
  const [verification, setVerification] = useState("all");
  const [status, setStatus] = useState("all");
  const [service, setService] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: (input: {
      name: string;
      city: string;
      state: string;
      contactRole: string;
      email: string;
      phone: string;
      beds: number;
      accreditation: string;
      verification: "Verified" | "Pending" | "Suspended";
      status: "active" | "inactive" | "suspended";
      serviceIds: string[];
    }) => addHospital({ data: input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["hospitals"] });
      await queryClient.invalidateQueries({ queryKey: ["audit"] });
      toast.success("Hospital added", { description: `${draft.name} is now in the directory.` });
      setOpen(false);
      setDraft(emptyDraft);
      setErrors({});
    },
    onError: (error: unknown) =>
      toast.error("Could not add hospital", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  const rows = useMemo(
    () =>
      hospitals.filter((h) => {
        const q = query.trim().toLowerCase();
        const matchQ = !q || [h.name, h.city, h.state].some((v) => v.toLowerCase().includes(q));
        return (
          matchQ &&
          (verification === "all" || h.verification === verification) &&
          (status === "all" || h.status === status) &&
          (service === "all" ||
            h.capabilities.some((c) => c.serviceId === service && c.status === "Available"))
        );
      }),
    [hospitals, query, verification, status, service],
  );

  const active = hospitals.find((h) => h.id === selected) ?? null;

  const submit = () => {
    const next: Record<string, string> = {};
    if (draft.name.trim().length < 3) next["name"] = "Enter the hospital name.";
    if (draft.city.trim().length < 2) next["city"] = "Enter a city.";
    if (draft.state.trim().length < 2) next["state"] = "Enter a state.";
    const beds = Number(draft.beds);
    if (!Number.isFinite(beds) || beds < 0) next["beds"] = "Enter the bed capacity.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    createMutation.mutate({
      name: draft.name.trim(),
      city: draft.city.trim(),
      state: draft.state.trim(),
      contactRole: draft.contactRole.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      beds: Math.round(beds),
      accreditation: draft.accreditation.trim(),
      verification: draft.verification,
      status: draft.status,
      serviceIds: draft.serviceIds,
    });
  };

  return (
    <>
      <PageHeader
        title="Hospitals"
        description="Accredited facilities, their capabilities and current partnership status."
        actions={<Button onClick={() => setOpen(true)}>Add hospital</Button>}
      />

      <SectionCard bodyClassName="p-0">
        <FilterBar>
          <SearchInput value={query} onChange={setQuery} placeholder="Search hospitals or cities" />
          <FilterSelect
            label="Verification"
            value={verification}
            onChange={setVerification}
            options={["Verified", "Pending", "Suspended"].map((v) => ({ value: v, label: v }))}
          />
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "suspended", label: "Suspended" },
            ]}
          />
          <FilterSelect
            label="Service"
            value={service}
            onChange={setService}
            options={services.map((s) => ({ value: s.id, label: s.name }))}
          />
          <span className="num ml-auto text-xs text-muted-foreground">
            {rows.length} of {hospitals.length}
          </span>
        </FilterBar>

        {hospitalsQuery.isLoading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : hospitalsQuery.isError ? (
          <EmptyState
            title="Could not load hospitals"
            description="Something went wrong while loading the hospital directory."
            action={<Button onClick={() => hospitalsQuery.refetch()}>Try again</Button>}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            searching={hospitals.length > 0}
            title={hospitals.length === 0 ? "No hospitals yet" : "No hospitals match your filters"}
            description={
              hospitals.length === 0
                ? "Add your first partner hospital to start building the directory."
                : "Adjust the service capability or verification filter to widen the search."
            }
            action={
              hospitals.length === 0 ? (
                <Button onClick={() => setOpen(true)}>Add hospital</Button>
              ) : undefined
            }
          />
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>Hospital</Th>
                <Th>Location</Th>
                <Th>Beds</Th>
                <Th>Verification</Th>
                <Th>Status</Th>
                <Th>Onboarded</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((h) => (
                <Tr key={h.id} onClick={() => setSelected(h.id)}>
                  <Td className="max-w-[20rem] truncate font-medium">{h.name}</Td>
                  <Td className="text-muted-foreground">
                    {h.city}, {h.state}
                  </Td>
                  <Td className="num">{h.beds}</Td>
                  <Td>
                    <StatusBadge status={h.verification} />
                  </Td>
                  <Td>
                    <StatusBadge status={h.status === "active" ? "Active" : "Inactive"} />
                  </Td>
                  <Td className="num text-muted-foreground">{shortDate(h.onboarded)}</Td>
                </Tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </SectionCard>

      <DetailDrawer
        open={!!active}
        onOpenChange={(o) => !o && setSelected(null)}
        title={active?.name ?? ""}
        subtitle={active ? `${active.city}, ${active.state}` : ""}
      >
        {active ? (
          <>
            <DrawerSection title="Facility details">
              <FieldGrid>
                <Field label="Contact role" value={active.contactRole} />
                <Field label="Email" value={active.email} />
                <Field label="Phone" value={<span className="num">{active.phone}</span>} />
                <Field label="Beds" value={<span className="num">{active.beds}</span>} />
                <Field label="Verification" value={<StatusBadge status={active.verification} />} />
                <Field
                  label="Status"
                  value={<StatusBadge status={active.status === "active" ? "Active" : "Inactive"} />}
                />
                <Field
                  label="Accreditation"
                  value={active.accreditation}
                  className="sm:col-span-2"
                />
              </FieldGrid>
            </DrawerSection>

            <DrawerSection title="Service capabilities">
              <div className="grid gap-2 sm:grid-cols-2">
                {active.capabilities.map((c) => (
                  <div
                    key={c.serviceId}
                    className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                  >
                    <span className="truncate text-sm text-foreground">{c.serviceName}</span>
                    <StatusBadge status={c.status} />
                  </div>
                ))}
              </div>
            </DrawerSection>

            <DrawerSection title="Equipment">
              {active.equipment.length === 0 ? (
                <p className="text-sm text-muted-foreground">No equipment recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {active.equipment.map((e) => (
                    <div
                      key={e.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{e.name}</p>
                        <p className="text-xs text-muted-foreground">{e.condition}</p>
                      </div>
                      <span className="num text-sm text-muted-foreground">×{e.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </DrawerSection>

            <DrawerSection title={`Patients in care (${active.patients.length})`}>
              {active.patients.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No patients currently assigned to this facility.
                </p>
              ) : (
                <div className="space-y-2">
                  {active.patients.map((p) => (
                    <div
                      key={p.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {p.displayName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{p.condition}</p>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                  ))}
                </div>
              )}
            </DrawerSection>
          </>
        ) : null}
      </DetailDrawer>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add hospital</DialogTitle>
            <DialogDescription>
              Onboard a partner facility and record the services it can deliver.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledInput label="Hospital name" error={errors["name"] ?? ""}>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </LabeledInput>
            <LabeledInput label="Accreditation">
              <Input
                value={draft.accreditation}
                onChange={(e) => setDraft({ ...draft, accreditation: e.target.value })}
              />
            </LabeledInput>
            <LabeledInput label="City" error={errors["city"] ?? ""}>
              <Input
                value={draft.city}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
              />
            </LabeledInput>
            <LabeledInput label="State" error={errors["state"] ?? ""}>
              <Input
                value={draft.state}
                onChange={(e) => setDraft({ ...draft, state: e.target.value })}
              />
            </LabeledInput>
            <LabeledInput label="Contact role">
              <Input
                value={draft.contactRole}
                onChange={(e) => setDraft({ ...draft, contactRole: e.target.value })}
              />
            </LabeledInput>
            <LabeledInput label="Email">
              <Input
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </LabeledInput>
            <LabeledInput label="Phone">
              <Input
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              />
            </LabeledInput>
            <LabeledInput label="Beds" error={errors["beds"] ?? ""}>
              <Input
                inputMode="numeric"
                value={draft.beds}
                onChange={(e) => setDraft({ ...draft, beds: e.target.value })}
              />
            </LabeledInput>
            <LabeledInput label="Verification">
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={draft.verification}
                onChange={(e) =>
                  setDraft({ ...draft, verification: e.target.value as typeof draft.verification })
                }
              >
                {["Verified", "Pending", "Suspended"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </LabeledInput>
            <LabeledInput label="Status">
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={draft.status}
                onChange={(e) =>
                  setDraft({ ...draft, status: e.target.value as typeof draft.status })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </LabeledInput>
          </div>

          <div className="mt-2">
            <p className="mb-2 text-sm font-medium text-foreground">Available services</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {services.map((s) => {
                const picked = draft.serviceIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        serviceIds: picked
                          ? draft.serviceIds.filter((id) => id !== s.id)
                          : [...draft.serviceIds, s.id],
                      })
                    }
                    className={cn(
                      "rounded-md border px-3 py-2 text-left text-sm transition-colors",
                      picked
                        ? "border-primary bg-primary-soft/60 text-foreground"
                        : "border-border text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Adding…" : "Add hospital"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
