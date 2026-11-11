import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Inbox, SearchX } from "lucide-react";
import { naira, pct } from "@/lib/admin/format";

/* ---------- tone mapping for every status in the portal ---------- */

type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "brand";

const TONES: Record<Tone, string> = {
  success: "bg-success-soft text-success border-success/25",
  warning: "bg-warning-soft text-warning border-warning/25",
  danger: "bg-danger-soft text-destructive border-destructive/25",
  info: "bg-info-soft text-info border-info/25",
  brand: "bg-primary-soft text-accent-foreground border-primary/25",
  neutral: "bg-muted text-muted-foreground border-border",
};

const STATUS_TONES: Record<string, Tone> = {
  // generic
  Active: "success",
  Inactive: "neutral",
  Completed: "success",
  Verified: "success",
  Paid: "success",
  Allocated: "success",
  Available: "success",
  Accepted: "success",
  "Treatment Commenced": "success",
  Pending: "warning",
  "Under Review": "warning",
  "Awaiting Treatment": "warning",
  "Temporarily Unavailable": "warning",
  "Receiving Hospital Pending": "warning",
  Submitted: "info",
  "Information Requested": "warning",
  Approved: "success",
  Withdrawn: "neutral",
  "Treatment in Progress": "info",
  "Patient Notified": "info",
  "Transfer Scheduled": "info",
  Transferred: "brand",
  Draft: "neutral",
  Held: "warning",
  Suspended: "danger",
  Rejected: "danger",
  Failed: "danger",
  "Not Available": "danger",
  Reversed: "danger",
  Cancelled: "neutral",
  Refunded: "neutral",
  Routine: "neutral",
  Urgent: "warning",
  Critical: "danger",
  "Patient Donation": "brand",
  "Cause Donation": "info",
  "Recurring Donation": "success",
};

export function StatusBadge({
  status,
  tone,
  className,
}: {
  status: string;
  tone?: Tone;
  className?: string;
}) {
  const resolved = tone ?? STATUS_TONES[status] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONES[resolved],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

/* ---------- page scaffolding ---------- */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-semibold text-foreground">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <Card className={cn("gap-0 overflow-hidden border-border py-0 shadow-card", className)}>
      {title ? (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
            {description ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn("px-5 py-4", bodyClassName)}>{children}</div>
    </Card>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: Tone;
}) {
  return (
    <Card className="gap-0 border-border py-0 shadow-card transition-colors hover:border-primary/40">
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="num mt-2 text-2xl font-semibold text-foreground">{value}</p>
          {hint ? <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-lg border",
            TONES[tone],
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
    </Card>
  );
}

/* ---------- table shell ---------- */

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "border-b border-border bg-secondary/60 px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <td className={cn("border-b border-border px-4 py-3 align-middle text-foreground", className)}>
      {children}
    </td>
  );
}

export function Tr({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  if (!onClick) return <tr className={className}>{children}</tr>;
  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "cursor-pointer transition-colors hover:bg-primary-soft/60 focus:bg-primary-soft/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
    >
      {children}
    </tr>
  );
}

/* ---------- filters ---------- */

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full sm:max-w-xs", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="bg-surface pl-9"
      />
    </div>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel = "All",
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  allLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-[9.5rem]", className)}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label} className="bg-surface">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{`${label}: ${allLabel}`}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
      {children}
    </div>
  );
}

/* ---------- states ---------- */

export function EmptyState({
  title,
  description,
  searching = false,
  action,
}: {
  title: string;
  description?: string;
  searching?: boolean;
  action?: ReactNode;
}) {
  const Icon = searching ? SearchX : Inbox;
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 p-5">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton key={c} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ---------- funding progress ---------- */

export function FundingProgress({
  raised,
  target,
  compact = false,
}: {
  raised: number;
  target: number;
  compact?: boolean;
}) {
  const p = pct(raised, target);
  return (
    <div className={cn("min-w-[9rem]", compact && "min-w-[7rem]")}>
      <Progress value={p} className="h-1.5" />
      <div className="num mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{naira(raised, true)}</span>
        <span className="font-medium text-foreground">{p}%</span>
      </div>
      {!compact ? (
        <p className="num mt-0.5 text-xs text-muted-foreground">of {naira(target, true)} target</p>
      ) : null}
    </div>
  );
}

/* ---------- detail drawer ---------- */

export function DetailDrawer({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 shadow-overlay sm:max-w-xl lg:max-w-2xl"
      >
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="text-base">{title}</SheetTitle>
          {subtitle ? <SheetDescription>{subtitle}</SheetDescription> : null}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-secondary/40 px-6 py-4">
            {footer}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <div className="mt-1 text-sm text-foreground">{value}</div>
    </div>
  );
}

export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

export function DrawerSection({
  title,
  children,
  actions,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {actions}
      </div>
      {children}
    </section>
  );
}

/* ---------- confirmation ---------- */

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = false,
  onConfirm,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  children?: ReactNode;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="shadow-overlay">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children ? <div className="space-y-3">{children}</div> : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(
              destructive && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            )}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function LabeledInput({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </Label>
      {children}
      {hint && !error ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
