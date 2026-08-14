import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { supabase } from "@/integrations/supabase/client";

type Search = { next?: string };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    next: typeof search['next'] === "string" ? search['next'] : undefined,
  }),
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Donor sign in — Fundezer website" },
      {
        name: "description",
        content:
          "Sign in or create a FundEzer donor account to fund your donor wallet, give to verified campaigns and follow treatment progress.",
      },
      { property: "og:title", content: "Donor sign in — Fundezer website" },
      { property: "og:description", content: "Access your FundEzer donor wallet and impact dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const field =
  "mt-1.5 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary";

function AuthPage() {
  const navigate = useNavigate();
  const { next } = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: next ?? "/wallet" });
    });
  }, [navigate, next]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) || trimmed.length > 255) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: trimmed,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: { full_name: fullName.trim().slice(0, 100) },
          },
        });
        if (error) throw error;
        toast.success("Account created. You're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: trimmed, password });
        if (error) throw error;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) navigate({ to: next ?? "/wallet" });
      else toast("Check your inbox to confirm your email, then sign in.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <section className="container-page max-w-md py-20">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-deep">
          <ShieldCheck className="h-3.5 w-3.5" /> Secure donor account
        </span>
        <h1 className="mt-4 text-3xl font-semibold text-foreground">
          {mode === "signin" ? "Welcome back" : "Create your donor account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your donor wallet, donations and impact history live in your account. Your contact and
          payment details are never shown publicly.
        </p>

        <form className="surface-card mt-8 space-y-4 p-7" onSubmit={submit}>
          {mode === "signup" && (
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Full name</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={100}
                required
                className={field}
              />
            </label>
          )}
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              required
              className={field}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              className={field}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-60"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Log in" : "Create account"}
          </button>
          <p className="text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New donor?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-semibold text-primary hover:underline"
            >
              {mode === "signin" ? "Create an account" : "Log in"}
            </button>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Applying as a patient?{" "}
            <Link to="/apply" className="font-semibold text-primary hover:underline">
              Start a campaign
            </Link>
          </p>
        </form>
      </section>
    </PageShell>
  );
}
