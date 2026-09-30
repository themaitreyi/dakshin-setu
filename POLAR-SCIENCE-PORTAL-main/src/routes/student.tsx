import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell, PageHero } from "@/components/site/public-shell";
import { PolarGlobe } from "@/components/globe/polar-globe";
export const Route = createFileRoute("/student")({ component: Student });
function Student() {
  return (
    <PublicShell>
      <PageHero
        eyebrow="Student hub · open access"
        title="Small questions. Planet-sized discoveries."
        lead="Meet India's polar stations, explore real scientific media, and learn how to check the evidence behind a claim."
      />
      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-10 grid gap-5 md:grid-cols-3">
          {[
            {
              to: "/learning",
              title: "Learn & quiz",
              text: "Short educational drafts with self-check quizzes.",
            },
            {
              to: "/media",
              title: "See the science",
              text: "Locally stored, credited photos and scientific animations.",
            },
            {
              to: "/outreach",
              title: "Build a classroom draft",
              text: "Turn reviewed source evidence into a cited explainer.",
            },
          ].map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="depth-card rounded-2xl border bg-white p-7 shadow-sm"
            >
              <h2 className="text-xl font-bold">{c.title} →</h2>
              <p className="mt-3 text-slate-600">{c.text}</p>
            </Link>
          ))}
        </div>
        <PolarGlobe />
      </section>
    </PublicShell>
  );
}
