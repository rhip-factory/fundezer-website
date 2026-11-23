import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getIdentity, type Identity } from "@/lib/admin/auth.functions";

interface AuthValue {
  session: Session | null;
  user: User | null;
  signedIn: boolean;
  identity: Identity | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  refreshIdentity: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(true);

  const loadIdentity = async (active: Session | null) => {
    if (!active) {
      setIdentity(null);
      return;
    }
    try {
      setIdentity(await getIdentity());
    } catch (error) {
      console.error("Failed to load identity", error);
      setIdentity(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!mounted) return;
      setSession(next);
      void loadIdentity(next);
    });

    void supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      await loadIdentity(data.session);
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value: AuthValue = {
    session,
    user: session?.user ?? null,
    signedIn: Boolean(session),
    identity,
    loading,
    isAuthenticated: Boolean(session),
    isAdmin: identity?.roles.includes("platform_administrator") ?? false,
    refreshIdentity: async () => {
      const { data } = await supabase.auth.getSession();
      await loadIdentity(data.session);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export const ROLE_LABELS: Record<string, string> = {
  platform_administrator: "Platform Administrator",
  medical_director: "Medical Director",
  patient_advocate: "Patient Advocate",
  donor_liaison: "Donor Liaison",
  auditor: "Auditor",
};

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AD";
  if (parts.length === 1) return (parts[0]?.[0] ?? "A").toUpperCase();
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}
