import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Mail, MapPin, Phone } from "lucide-react";
import { PageShell, PageHero } from "@/components/site/PageShell";

export const Route = createFileRoute("/contact")({
  component: Contact,
  head: () => ({
    meta: [
      { title: "Contact Fundezer website — patients, hospitals and partners" },
      {
        name: "description",
        content:
          "Reach the FundEzer team in Abuja about sponsorship applications, hospital partnerships, donations or media enquiries.",
      },
      { property: "og:title", content: "Contact Fundezer website" },
      { property: "og:description", content: "Get in touch with our Abuja team." },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
});

const field =
  "mt-1.5 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary";

function Contact() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Contact"
        title="Talk to the FundEzer team"
        description="Whether you are a patient, a hospital, a donor or an NGO, we respond within one working day."
      />

      <section className="container-page grid gap-10 py-16 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-5">
          {[
            [Mail, "Email", "hello@fundezer.org"],
            [Phone, "Phone", "+234 808 888 8306"],
            [MapPin, "Office", "Plot 78 Step One, Aso Garden Karsana, Abuja, Nigeria"],
          ].map(([Icon, label, value]) => {
            const I = Icon as typeof Mail;
            return (
              <div key={label as string} className="surface-card flex items-start gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-deep">
                  <I className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {label as string}
                  </p>
                  <p className="mt-1 font-medium text-foreground">{value as string}</p>
                </div>
              </div>
            );
          })}
        </div>

        <form
          className="surface-card space-y-4 p-7"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Message sent. Our Abuja team will reply within one working day.");
            (e.target as HTMLFormElement).reset();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Full name</span>
              <input required className={field} />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Email</span>
              <input type="email" required className={field} />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">I am a…</span>
            <select className={field}>
              <option>Patient or family member</option>
              <option>Hospital</option>
              <option>Donor</option>
              <option>NGO or corporate partner</option>
              <option>Media</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Message</span>
            <textarea rows={6} required className={field} />
          </label>
          <button
            type="submit"
            className="w-full rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft"
          >
            Send message
          </button>
        </form>
      </section>
    </PageShell>
  );
}