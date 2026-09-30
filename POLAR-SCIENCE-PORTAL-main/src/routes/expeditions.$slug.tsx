import { createFileRoute, Link } from "@tanstack/react-router";
import { DemoGallery } from "@/features/site/demo-gallery";
import { PublicShell } from "@/components/site/public-shell";
export const Route = createFileRoute("/expeditions/$slug")({
  component: () => (
    <PublicShell>
      <section className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="text-3xl font-bold">Expedition resources</h1>
        <p className="my-5">
          Explore India's oceanographic expedition records and related polar research.
        </p>
        <Link className="underline" to="/expeditions">
          Explore the polar atlas and stored reports
        </Link>
      </section>
      <DemoGallery categories={["expedition", "report"]} />
    </PublicShell>
  ),
});
