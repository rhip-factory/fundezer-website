import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ROLE_LABELS, initialsOf, useAuth } from "@/hooks/useAuth";
import { updateMyProfile } from "@/lib/admin/auth.functions";
import { toast } from "sonner";
import {
  Field,
  FieldGrid,
  LabeledInput,
  PageHeader,
  SectionCard,
  StatusBadge,
  TableShell,
  Td,
  Th,
  Tr,
} from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAuditLogs } from "@/lib/admin/audit.functions";
import { dateTime } from "@/lib/admin/format";

export const Route = createFileRoute("/admin/profile")({
  head: () => ({
    meta: [
      { title: "Admin Profile — FundEzer Admin Portal" },
      {
        name: "description",
        content:
          "Manage your FundEzer admin account details, contact information and review your recent portal activity.",
      },
      { property: "og:title", content: "Admin Profile — FundEzer Admin Portal" },
      {
        property: "og:description",
        content: "Manage your admin account details and review recent activity.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const fetchAudit = useServerFn(listAuditLogs);
  const { data: audit = [] } = useQuery({ queryKey: ["audit-logs"], queryFn: () => fetchAudit() });
  const { identity, session, refreshIdentity } = useAuth();
  const accountEmail = identity?.profile.email ?? session?.user.email ?? "";
  const accountName = identity?.profile.full_name ?? "";
  const roleLabel = identity?.roles.length
    ? (ROLE_LABELS[identity.roles[0] as string] ?? identity.roles[0]!)
    : "No role assigned";

  const [name, setName] = useState(accountName);
  const [phone, setPhone] = useState(identity?.profile.phone ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(accountName);
    setPhone(identity?.profile.phone ?? "");
  }, [accountName, identity?.profile.phone]);

  const mine = audit.filter((a) => a.actorUserId === identity?.userId).slice(0, 8);

  const save = async () => {
    const next: Record<string, string> = {};
    if (name.trim().length < 3) next["name"] = "Enter your full name.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSaving(true);
    try {
      await updateMyProfile({ data: { full_name: name.trim(), phone: phone.trim() } });
      await refreshIdentity();
      toast.success("Profile saved");
    } catch (error) {
      toast.error("Could not save profile", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Admin Profile"
        description="Your account details and recent activity in the portal."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <SectionCard title="Account details" description="Update how you appear in the audit log">
          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledInput label="Full name" error={errors["name"] ?? ""}>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </LabeledInput>
            <LabeledInput label="Email" hint="Managed by your sign-in account.">
              <Input value={accountEmail} readOnly className="bg-muted" />
            </LabeledInput>
            <LabeledInput label="Phone">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </LabeledInput>
            <LabeledInput label="Role" hint="Roles are assigned by a platform administrator.">
              <Input value={roleLabel} readOnly className="bg-muted" />
            </LabeledInput>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setName(accountName);
                setPhone(identity?.profile.phone ?? "");
                setErrors({});
              }}
            >
              Reset
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="Access">
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
              {initialsOf(accountName || accountEmail)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{name}</p>
              <p className="truncate text-xs text-muted-foreground">{accountEmail}</p>
            </div>
          </div>
          <div className="mt-5">
            <FieldGrid>
              <Field
                label="Account status"
                value={
                  <StatusBadge
                    status={identity?.profile.status === "active" ? "Active" : "Inactive"}
                    tone="brand"
                  />
                }
              />
              <Field label="Permission set" value={roleLabel} />
              <Field label="Signed-in user ID" value={identity?.userId ?? "—"} className="sm:col-span-2" />
            </FieldGrid>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Your recent activity" bodyClassName="p-0">
        <TableShell>
          <thead>
            <tr>
              <Th>Timestamp</Th>
              <Th>Action</Th>
              <Th>Record</Th>
              <Th>Description</Th>
            </tr>
          </thead>
          <tbody>
            {mine.map((a) => (
              <Tr key={a.id}>
                <Td className="num whitespace-nowrap text-muted-foreground">{dateTime(a.at)}</Td>
                <Td className="font-medium">{a.action}</Td>
                <Td className="num text-muted-foreground">{a.record}</Td>
                <Td className="text-muted-foreground">{a.description}</Td>
              </Tr>
            ))}
          </tbody>
        </TableShell>
      </SectionCard>
    </>
  );
}
