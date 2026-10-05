import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageShell } from "@/components/site/PageShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({
    meta: [
      { title: "Log in — Fundezer website" },
      {
        name: "description",
        content:
          "Log in with your FundEzer account — the same details work for the patient, hospital and donor portals.",
      },
      { property: "og:title", content: "Log in — Fundezer website" },
      { property: "og:description", content: "One FundEzer login for every portal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const field =
  "mt-1.5 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      const type = data.user?.user_metadata?.["user_type"];
      toast.success("Welcome back.");
      navigate({ to: type === "Patient" ? "/apply" : "/wallet" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <section className="container-page max-w-md py-20">
        <h1 className="text-3xl font-semibold text-foreground">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use your FundEzer email and password — the same login works on every FundEzer portal.
        </p>
        <form className="surface-card mt-8 space-y-4 p-7" onSubmit={submit}>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Password</span>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
          </label>
          <button type="submit" disabled={busy} className="w-full rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-60">
            {busy ? "Please wait…" : "Log in"}
          </button>
          <p className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">Create an account</Link>
          </p>
        </form>
      </section>
    </PageShell>
  );
}
