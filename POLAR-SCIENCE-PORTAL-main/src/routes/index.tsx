import { Link, createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/site/public-shell";
import { HomeDirectory } from "@/features/site/home-directory";
import { PortalCards } from "@/features/site/portal-cards";
import { StationWeather } from "@/features/site/station-weather";
export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dakshinsetu | India's bridge to polar knowledge" }] }),
  component: Home,
});
function Home() {
  return (
    <PublicShell>
      <section className="relative isolate overflow-hidden border-b border-sky-100">
        <div className="dakshin-hero-image absolute inset-0 -z-20 bg-cover bg-center" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white/95 via-white/80 to-white/20" />
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-sky-800">
            India’s Polar Knowledge Bridge
          </p>
          <h1 className="mt-5 max-w-3xl text-5xl font-bold leading-tight tracking-tight text-slate-900 md:text-7xl">
            From the Himalayas.
            <br />
            To the ends of Earth.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-700">
            Discover India's polar science through expeditions, research, imagery and interactive
            learning. One place to explore. Clear paths to every resource.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/datasets"
              className="inline-flex min-h-13 items-center rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Explore datasets →
            </Link>
            <Link
              to="/observatory"
              className="inline-flex min-h-13 items-center rounded-xl border border-sky-200 bg-white/90 px-6 py-3 font-semibold text-sky-900 transition-colors hover:bg-sky-50"
            >
              Explore the 3D globe
            </Link>
          </div>
          <p className="mt-8 text-sm text-slate-600">
            Antarctica · Arctic · Himalayas — research, imagery and source-linked learning.
          </p>
        </div>
      </section>
      <StationWeather />
      <HomeDirectory />
      <PortalCards />
    </PublicShell>
  );
}
