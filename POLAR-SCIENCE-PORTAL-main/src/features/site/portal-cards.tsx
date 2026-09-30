import { Link } from "@tanstack/react-router";
import { GraduationCap, Microscope, ShieldCheck, ArrowUpRight } from "lucide-react";
const portals = [
  {
    title: "Student",
    label: "Curiosity starts here",
    description:
      "Explore station tours, self-check quizzes, source-backed media and classroom drafts. No account needed.",
    to: "/student",
    icon: GraduationCap,
    tone: "from-sky-100 to-cyan-50",
    badge: "Open access",
  },
  {
    title: "Researcher",
    label: "From observation to evidence",
    description:
      "Discover datasets and publications, inspect provenance, and submit sources for review.",
    to: "/researcher",
    icon: Microscope,
    tone: "from-indigo-100 to-violet-50",
    badge: "Researcher account",
  },
  {
    title: "Administrator",
    label: "Steward trusted knowledge",
    description:
      "Review source records, inspect repository coverage and read private project enquiries.",
    to: "/admin",
    icon: ShieldCheck,
    tone: "from-amber-100 to-orange-50",
    badge: "Restricted access",
  },
] as const;
export function PortalCards() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <p className="text-xs uppercase tracking-[.25em] text-sky-700">Three ways to explore</p>
      <h2 className="mt-3 mb-8 text-3xl font-bold">One portal. A place for everyone.</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {portals.map((p) => (
          <Link
            key={p.title}
            to={p.to}
            className="depth-card overflow-hidden rounded-3xl border bg-white shadow-sm"
          >
            <div
              className={
                "relative flex h-44 items-center justify-between bg-gradient-to-br p-7 " + p.tone
              }
            >
              <span className="self-start rounded-full border bg-white/70 px-3 py-1 text-xs">
                {p.badge}
              </span>
              <p.icon className="ice-emblem size-20 text-blue-600" strokeWidth={1.2} />
            </div>
            <div className="p-7">
              <h3 className="text-2xl font-bold">{p.title}</h3>
              <p className="mt-2 text-xs uppercase tracking-wider text-slate-500">{p.label}</p>
              <p className="my-5 text-sm leading-7 text-slate-600">{p.description}</p>
              <span className="flex items-center justify-between rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white">
                Open {p.title} portal
                <ArrowUpRight size={18} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
