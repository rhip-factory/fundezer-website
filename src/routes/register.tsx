import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageShell } from "@/components/site/PageShell";

export const Route = createFileRoute("/register")({
  component: Register,
  head: () => ({
    meta: [
      { title: "Create your FundEzer account" },
      {
        name: "description",
        content:
          "Create a FundEzer account as a patient, donor or hospital team member to apply for sponsorship, give to campaigns or review applications.",
      },
      { property: "og:title", content: "Create your FundEzer account" },
      { property: "og:description", content: "Join FundEzer as a patient, donor or hospital." },
      { property: "og:url", content: "/register" },
    ],
    links: [{ rel: "canonical", href: "/register" }],
  }),
});

const field =
  "mt-1.5 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary";

function Register() {
  return (
    <PageShell>
      <section className="container-page max-w-md py-20">
        <h1 className="text-3xl font-semibold text-foreground">Create an account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          One account for applying, donating and following treatment progress.
        </p>
        <form
          className="surface-card mt-8 space-y-4 p-7"
          onSubmit={(e) => {
            e.preventDefault();
            toast("Registration opens when the Abuja pilot goes live.");
          }}
        >
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">I am a…</span>
            <select className={field}>
              <option>Patient</option>
              <option>Donor</option>
              <option>Hospital team member</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Full name</span>
            <input required className={field} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Email</span>
            <input type="email" required className={field} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Phone</span>
            <input type="tel" required className={field} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Password</span>
            <input type="password" required className={field} />
          </label>
          <button
            type="submit"
            className="w-full rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft"
          >
            Create account
          </button>
          <p className="text-center text-sm text-muted-foreground">
            Already registered?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </section>
    </PageShell>
  );
}