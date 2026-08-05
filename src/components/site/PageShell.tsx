import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="border-b border-border bg-[image:var(--gradient-soft)]">
      <div className="container-page py-16 md:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.1] text-foreground md:text-5xl">
          {title === "A guided application, reviewed by your hospital" ? "A guided campaign setup, reviewed by your hospital" : title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {description}
        </p>
      </div>
    </section>
  );
}