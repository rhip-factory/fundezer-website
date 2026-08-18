import { Link } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { ProgressBar } from "./CampaignCard";
import { formatShort } from "@/lib/data";
import { causeProgress, type Cause } from "@/lib/causes";

export function CauseCard({ cause }: { cause: Cause }) {
  const pct = causeProgress(cause);

  return (
    <div className="group flex flex-col overflow-hidden surface-card transition-all hover:-translate-y-1 hover:shadow-lift">
      <img
        src={cause.image}
        alt={`${cause.name} at a FundEzer partner hospital`}
        width={1200}
        height={800}
        loading="lazy"
        className="h-40 w-full object-cover"
      />

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-semibold text-foreground">{cause.name}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {cause.short}
        </p>

        <div className="mt-auto pt-5">
          <ProgressBar value={pct} />
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="font-display text-lg font-semibold text-foreground">
                {formatShort(cause.raised)}
              </p>
              <p className="text-xs text-muted-foreground">
                raised of {formatShort(cause.target)} · {pct}% funded
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {cause.patients} patients
            </div>
          </div>

          <Link
            to="/causes/$causeId"
            params={{ causeId: cause.id }}
            className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            Support This Cause
          </Link>
        </div>
      </div>
    </div>
  );
}
