import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell, PageHero } from "@/components/site/public-shell";
import { PortalGate } from "@/features/auth/portal-session";
import { EvidenceSearch } from "@/features/repository/evidence-search";
export const Route = createFileRoute("/researcher")({
  component: () => (
    <PublicShell>
      <PortalGate>
        <PageHero
          eyebrow="Research workspace"
          title="Discover. Inspect. Contribute."
          lead="Search the shared evidence catalogue and submit permitted sources. New submissions remain unreviewed until an administrator checks them."
        />
        <section className="mx-auto max-w-7xl px-5 py-12">
          <div className="mb-10 grid gap-5 sm:grid-cols-3">
            {[
              { to: "/datasets", title: "Scientific datasets" },
              { to: "/publications", title: "Publications & reports" },
              { to: "/repository/upload", title: "Submit a source" },
            ].map((c) => (
              <Link
                key={c.to}
                to={c.to}
                className="depth-card rounded-2xl border bg-white p-7 text-xl font-semibold shadow-sm"
              >
                {c.title} →
              </Link>
            ))}
          </div>
          <EvidenceSearch />
        </section>
      </PortalGate>
    </PublicShell>
  ),
});
