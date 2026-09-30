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
    <section className="overflow-hidden border-b border-border bg-primary-soft/45">
      <div className="container-page grid gap-8 py-14 md:grid-cols-[minmax(0,1fr)_minmax(16rem,0.45fr)] md:items-end md:py-20">
        <div>
        <p className="editorial-kicker">{eyebrow}</p>
        <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-[1.06] text-foreground md:text-6xl">
          {title === "A guided application, reviewed by your hospital" ? "A guided campaign setup, reviewed by your hospital" : title}
        </h1>
        </div>
        <p className="section-rule max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {description}
        </p>
      </div>
    </section>
  );
}