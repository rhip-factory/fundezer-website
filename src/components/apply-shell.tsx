import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { FundezerLogo } from "@/components/fundezer-logo";
import { cn } from "@/lib/utils";

const steps = ["Personal", "Medical Story", "Documents", "Review"];

export function StepProgress({ step }: { step: number }) {
  return (
    <div className="w-full">
      {/* Mobile */}
      <div className="sm:hidden">
        <p className="text-xs font-medium tracking-wide text-primary">
          Step {step} of 4
        </p>
        <p className="mt-1 text-sm font-semibold text-foreground">
          {steps[step - 1]}
        </p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop / tablet */}
      <ol className="hidden items-center gap-3 sm:flex">
        {steps.map((label, i) => {
          const index = i + 1;
          const done = index < step;
          const current = index === step;
          return (
            <li key={label} className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                    done && "border-primary bg-primary text-primary-foreground",
                    current && "border-primary bg-primary-soft text-primary",
                    !done &&
                      !current &&
                      "border-border bg-card text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-3.5" /> : index}
                </span>
                <span
                  className={cn(
                    "truncate text-sm",
                    current
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </div>
              {index < steps.length && (
                <span
                  className={cn(
                    "hidden h-px flex-1 md:block",
                    done ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function ApplyShell({
  step,
  title,
  description,
  children,
  footer,
  wide,
}: {
  step: number;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center">
            <FundezerLogo className="h-7" />
          </Link>
          <span className="shrink-0 text-sm font-medium text-muted-foreground">
            Application
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <StepProgress step={step} />

        <div className={cn("mx-auto mt-8", wide ? "max-w-3xl" : "max-w-2xl")}>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}

          <div className="mt-8">{children}</div>

          {footer && (
            <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
