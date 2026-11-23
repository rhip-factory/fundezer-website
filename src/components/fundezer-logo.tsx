import logo from "@/assets/fundezer-logo.png.asset.json";
import { cn } from "@/lib/utils";

export function FundezerLogo({ className }: { className?: string }) {
  return (
    <img
      src={logo.url}
      alt="FundEzer"
      className={cn("h-8 w-auto object-contain object-left", className)}
    />
  );
}
