import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/site/public-shell";
import { CuratorConsole } from "@/features/repository/curator-console";
import { PortalGate } from "@/features/auth/portal-session";
export const Route = createFileRoute("/dashboard")({
  component: () => (
    <PublicShell>
      <PortalGate admin>
        <CuratorConsole />
      </PortalGate>
    </PublicShell>
  ),
});
