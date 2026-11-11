import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { LabeledInput, PageHeader, SectionCard } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — FundEzer Admin Portal" },
      {
        name: "description",
        content:
          "Configure FundEzer portal preferences: transfer approval rules, donation thresholds and notification routing.",
      },
      { property: "og:title", content: "Settings — FundEzer Admin Portal" },
      {
        property: "og:description",
        content: "Configure approval rules, donation thresholds and notifications.",
      },
    ],
  }),
  component: SettingsPage,
});

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

function SettingsPage() {
  const [autoRoute, setAutoRoute] = useState(true);
  const [requireSecond, setRequireSecond] = useState(false);
  const [notifyCritical, setNotifyCritical] = useState(true);
  const [notifyDigest, setNotifyDigest] = useState(true);
  const [holdThreshold, setHoldThreshold] = useState(5_000_000);
  const [slaHours, setSlaHours] = useState("24");

  return (
    <>
      <PageHeader
        title="Settings"
        description="Portal-wide rules for transfers, donations and notifications."
        actions={
          <Button
            onClick={() =>
              toast.success("Settings saved", {
                description: "Prototype: preferences are kept in memory only.",
              })
            }
          >
            Save settings
          </Button>
        }
      />

      <SectionCard title="Transfer rules" description="How transfer requests are triaged">
        <ToggleRow
          label="Auto-recommend receiving hospital"
          description="Rank matching hospitals by service availability, activity and bed capacity."
          checked={autoRoute}
          onChange={setAutoRoute}
        />
        <Separator />
        <ToggleRow
          label="Require second approval for critical transfers"
          description="Critical-urgency transfers need sign-off from a second admin before approval."
          checked={requireSecond}
          onChange={setRequireSecond}
        />
        <Separator />
        <div className="pt-4 sm:max-w-xs">
          <LabeledInput label="Review SLA" hint="Target time to first admin response.">
            <Select value={slaHours} onValueChange={setSlaHours}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4 hours</SelectItem>
                <SelectItem value="12">12 hours</SelectItem>
                <SelectItem value="24">24 hours</SelectItem>
                <SelectItem value="48">48 hours</SelectItem>
              </SelectContent>
            </Select>
          </LabeledInput>
        </div>
      </SectionCard>

      <SectionCard title="Donations" description="Thresholds applied to incoming contributions">
        <div className="sm:max-w-xs">
          <LabeledInput
            label="Manual review threshold (₦)"
            hint="Donations above this amount are held for review before allocation."
          >
            <Input
              type="number"
              min={0}
              value={holdThreshold}
              onChange={(e) => setHoldThreshold(Number(e.target.value))}
            />
          </LabeledInput>
        </div>
      </SectionCard>

      <SectionCard title="Notifications" description="Where portal alerts are routed">
        <ToggleRow
          label="Critical transfer alerts"
          description="Notify all admins immediately when a critical transfer is submitted."
          checked={notifyCritical}
          onChange={setNotifyCritical}
        />
        <Separator />
        <ToggleRow
          label="Daily activity digest"
          description="Email a summary of donations, campaigns and transfers each morning."
          checked={notifyDigest}
          onChange={setNotifyDigest}
        />
      </SectionCard>
    </>
  );
}
