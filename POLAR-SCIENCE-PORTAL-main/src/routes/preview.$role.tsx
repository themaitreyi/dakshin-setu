import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PublicShell, PageHero } from "@/components/site/public-shell";
import { DemoGallery } from "@/features/site/demo-gallery";
import { DemoChart } from "@/features/site/demo-chart";
export const Route = createFileRoute("/preview/$role")({
  loader: ({ params }) => {
    if (!["researcher", "admin"].includes(params.role)) throw notFound();
    return params.role;
  },
  component: Preview,
});
function Preview() {
  const role = Route.useLoaderData();
  return (
    <PublicShell>
      <PageHero
        eyebrow="Workspace overview"
        title={role === "admin" ? "Administrator workspace" : "Researcher workspace"}
        lead="Explore the public collection. Sign in to manage submissions and access your authorised tools."
      />
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { to: "/datasets", label: "Discover datasets" },
            { to: "/publications", label: "Read publications" },
            {
              to: "/auth",
              label:
                role === "admin" ? "Sign in for real review tools" : "Sign in to submit sources",
            },
          ].map((x) => (
            <Link
              key={x.to}
              to={x.to}
              className="depth-card rounded-2xl border bg-white p-6 font-semibold"
            >
              {x.label} →
            </Link>
          ))}
        </div>
        <DemoChart />
      </section>
      <DemoGallery
        categories={role === "admin" ? ["activity", "publication"] : ["dataset", "expedition"]}
      />
    </PublicShell>
  );
}
