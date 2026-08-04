import { Link } from "@tanstack/react-router";
import { BadgeCheck, MapPin, Users } from "lucide-react";
import { formatShort, type Campaign } from "@/lib/data";

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
      <div
        className="h-full rounded-full bg-[image:var(--gradient-primary)]"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

const urgencyStyle: Record<Campaign["urgency"], string> = {
  Critical: "bg-destructive/10 text-destructive",
  Urgent: "bg-warning/15 text-warning",
  Scheduled: "bg-secondary text-secondary-foreground",
};

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const pct = Math.round((campaign.raised / campaign.goal) * 100);
  const initials = campaign.patient
    .split(" ")
    .map((p) => p[0])
    .join("");

  return (
    <Link
      to="/campaigns/$campaignId"
      params={{ campaignId: campaign.id }}
      className="group flex flex-col overflow-hidden surface-card transition-all hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative flex h-40 items-center justify-center bg-[image:var(--gradient-primary)]">
        <span className="font-display text-5xl font-semibold text-primary-foreground/90">
          {initials}
        </span>
        <span
          className={`absolute left-4 top-4 rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider ${urgencyStyle[campaign.urgency]} bg-card/95`}
        >
          {campaign.urgency}
        </span>
        <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-card/95 px-2.5 py-1 text-[0.65rem] font-semibold text-primary">
          <BadgeCheck className="h-3.5 w-3.5" /> Hospital verified
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-semibold text-foreground">
          {campaign.patient}, {campaign.age}
        </h3>
        <p className="mt-1 text-sm font-medium text-primary">{campaign.condition}</p>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {campaign.story}
        </p>

        <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {campaign.hospital}
        </div>

        <div className="mt-auto pt-5">
          <ProgressBar value={pct} />
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="font-display text-lg font-semibold text-foreground">
                {formatShort(campaign.raised)}
              </p>
              <p className="text-xs text-muted-foreground">
                raised of {formatShort(campaign.goal)} · {pct}%
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {campaign.donors} donors
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}