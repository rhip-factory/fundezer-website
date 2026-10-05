import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageShell } from "@/components/site/PageShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/register")({
  component: Register,
  head: () => ({
    meta: [
      { title: "Create your Fundezer website account" },
      {
        name: "description",
        content:
          "Create one FundEzer account as a patient, donor or hospital team member and use it across every FundEzer portal.",
      },
      { property: "og:title", content: "Create your Fundezer website account" },
      { property: "og:description", content: "One FundEzer account for patients, donors and hospitals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const field =
  "mt-1.5 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary";

const USER_TYPES = ["Patient", "Donor", "Hospital"] as const;

function Register() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<(typeof USER_TYPES)[number]>("Patient");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { toast.error("Please enter a valid email address."); return; }
    if (!/^(\+234|0)[789][01]\d{8}$/.test(phone.replace(/\s/g, ""))) { toast.error("Please enter a valid Nigerian phone number."); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmed,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            full_name: fullName.trim().slice(0, 100),
            phone: phone.replace(/\s/g, ""),
            user_type: userType,
          },
        },
      });
      if (error) throw error;
      if (data.session) {
        toast.success("Account created. Use these details to log in to any FundEzer portal.");
        navigate({ to: userType === "Patient" ? "/apply" : "/wallet" });
      } else {
        toast.success("Account created. Check your inbox to confirm your email, then log in.");
        navigate({ to: "/login" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <section className="container-page max-w-md py-20">
        <h1 className="text-3xl font-semibold text-foreground">Create an account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          One account for every FundEzer portal — use the same email and password for the patient,
          donor and hospital portals.
        </p>
        <form className="surface-card mt-8 space-y-4 p-7" onSubmit={submit}>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">I am a…</span>
            <select value={userType} onChange={(e) => setUserType(e.target.value as typeof userType)} className={field}>
              <option value="Patient">Patient</option>
              <option value="Donor">Donor</option>
              <option value="Hospital">Hospital team member</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Full name</span>
            <input required maxLength={100} value={fullName} onChange={(e) => setFullName(e.target.value)} className={field} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Email</span>
            <input type="email" required maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Phone</span>
            <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Password</span>
            <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
          </label>
          <button type="submit" disabled={busy} className="w-full rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-60">
            {busy ? "Please wait…" : "Create account"}
          </button>
          <p className="text-center text-sm text-muted-foreground">
            Already registered?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">Log in</Link>
          </p>
        </form>
      </section>
    </PageShell>
  );
}
