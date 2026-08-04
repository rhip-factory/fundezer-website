import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageShell } from "@/components/site/PageShell";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({
    meta: [
      { title: "Log in — FundEzer" },
      {
        name: "description",
        content:
          "Log in to your FundEzer patient, hospital or donor account to track applications, campaigns and treatment progress.",
      },
      { property: "og:title", content: "Log in — FundEzer" },
      { property: "og:description", content: "Access your FundEzer dashboard." },
      { property: "og:url", content: "/login" },
    ],
    links: [{ rel: "canonical", href: "/login" }],
  }),
});

const field =
  "mt-1.5 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary";

function Login() {
  return (
    <PageShell>
      <section className="container-page max-w-md py-20">
        <h1 className="text-3xl font-semibold text-foreground">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Log in to track your application, campaign or donations.
        </p>
        <form
          className="surface-card mt-8 space-y-4 p-7"
          onSubmit={(e) => {
            e.preventDefault();
            toast("Accounts open when the Abuja pilot goes live.");
          }}
        >
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Email</span>
            <input type="email" required className={field} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Password</span>
            <input type="password" required className={field} />
          </label>
          <button
            type="submit"
            className="w-full rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft"
          >
            Log in
          </button>
          <p className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </section>
    </PageShell>
  );
}