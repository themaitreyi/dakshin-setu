import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { PublicShell } from "@/components/site/public-shell";
import { PortalGate } from "@/features/auth/portal-session";
export const Route = createFileRoute("/admin")({
  component: () => (
    <PublicShell>
      <PortalGate admin>
        <nav aria-label="Curator navigation" className="mx-auto flex max-w-6xl gap-6 px-4 pt-8">
          <Link to="/admin">Coverage</Link>
          <Link to="/admin/submissions">Review queue</Link>
          <Link to="/admin/users">Access model</Link>
        </nav>
        <Outlet />
      </PortalGate>
    </PublicShell>
  ),
});
