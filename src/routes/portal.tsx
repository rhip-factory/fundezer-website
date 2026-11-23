import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { PortalShell } from "@/components/portal-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/portal")({
  // The session lives in browser storage, so the gate runs client-side only.
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
  },
  component: PortalLayout,
});

function PortalLayout() {
  return (
    <PortalShell>
      <Outlet />
    </PortalShell>
  );
}
