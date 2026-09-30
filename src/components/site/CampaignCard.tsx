import { Link } from "@tanstack/react-router";
import { BadgeCheck, HeartHandshake } from "lucide-react";
import { formatShort } from "@/lib/data";
import type { PublicCampaign } from "@/lib/public-campaigns.functions";

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

export function CampaignCard({ campaign }: { campaign: PublicCampaign }) {
  const initials = campaign.title
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <Link
      to="/campaigns/$campaignId"
      params={{ campaignId: campaign.slug ?? campaign.id }}
      className="group flex flex-col overflow-hidden border-t-4 border-primary bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[image:var(--gradient-primary)]">
        {campaign.imageUrl ? (
          <img
            src={campaign.imageUrl}
            alt={campaign.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="font-display text-5xl font-semibold text-primary-foreground/90">
            {initials}
          </span>
        )}
        <span className="absolute left-4 top-4 bg-card/95 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-secondary-foreground">
          {campaign.status === "Completed" ? "Completed" : "Funding now"}
        </span>
        <span className="absolute right-4 top-4 flex items-center gap-1 bg-card/95 px-2.5 py-1 text-[0.65rem] font-semibold text-primary">
          <BadgeCheck className="h-3.5 w-3.5" /> Hospital verified
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl font-bold leading-tight text-foreground">{campaign.title}</h3>
        {campaign.causeName && (
          <p className="mt-1 text-sm font-medium text-primary">{campaign.causeName}</p>
        )}
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {campaign.story}
        </p>

        <div className="mt-auto flex items-end justify-between pt-5">
          <div>
            <p className="font-display text-lg font-semibold text-foreground">
              {formatShort(campaign.target)}
            </p>
            <p className="text-xs text-muted-foreground">funding goal</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
            <HeartHandshake className="h-3.5 w-3.5" /> Donate
          </span>
        </div>
      </div>
    </Link>
  );
}
