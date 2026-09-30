import { Link } from "@tanstack/react-router";
import icon from "@/assets/fundezer-icon.png.asset.json";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <img src={icon.url} alt="FundEzer logo" width={40} height={40} className="h-9 w-9" />
      {!compact && (
        <span className="leading-none">
          <span className="font-display text-xl font-extrabold text-foreground">
            fund<span className="text-primary">E</span>zer<span className="text-primary">.</span>
          </span>
          <span className="mt-0.5 block text-[0.6rem] font-medium uppercase tracking-[0.2em] text-primary/80">
            Help From All
          </span>
        </span>
      )}
    </Link>
  );
}