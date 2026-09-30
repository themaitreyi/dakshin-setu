import {
  ArrowUpRight,
  Database,
  BookOpen,
  Camera,
  CalendarDays,
  Globe2,
  Ship,
  History,
  Compass,
  Brain,
  GraduationCap,
  Microscope,
  ShieldCheck,
  FileSearch,
  Sparkles,
} from "lucide-react";
export const featurePages = [
  {
    to: "/expeditions",
    title: "Expeditions",
    text: "Field journeys, regional archives and sample itineraries.",
    icon: Compass,
  },
  {
    to: "/datasets",
    title: "Datasets",
    text: "Search source records and download catalogue information.",
    icon: Database,
  },
  {
    to: "/publications",
    title: "Publications",
    text: "Read a real scientific PDF and browse sample briefs.",
    icon: BookOpen,
  },
  {
    to: "/media",
    title: "Photos & videos",
    text: "View credited photographs and scientific animations.",
    icon: Camera,
  },
  {
    to: "/activities",
    title: "Activities",
    text: "Programmes, workshop outlines and outreach examples.",
    icon: CalendarDays,
  },
  {
    to: "/observatory",
    title: "Observatory",
    text: "Interactive graphs, 3D Earth, satellite map and stations.",
    icon: Globe2,
  },
  {
    to: "/vessels",
    title: "Vessels",
    text: "Research-vessel profiles and oceanographic expedition history.",
    icon: Ship,
  },
  {
    to: "/history",
    title: "History",
    text: "Explore source-linked milestones in India's polar journey.",
    icon: History,
  },
  {
    to: "/repository",
    title: "Evidence library",
    text: "Original records, page-level passages and provenance.",
    icon: FileSearch,
  },
  {
    to: "/outreach",
    title: "Outreach studio",
    text: "Create audience-specific drafts from reviewed sources.",
    icon: Sparkles,
  },
  {
    to: "/assistant",
    title: "Ask AI",
    text: "Search the collection or ask the evidence-backed assistant.",
    icon: Brain,
  },
  {
    to: "/learning",
    title: "Learning & quizzes",
    text: "Read lessons and test your understanding.",
    icon: GraduationCap,
  },
  {
    to: "/student",
    title: "Student portal",
    text: "Open learning, media and station exploration.",
    icon: GraduationCap,
  },
  {
    to: "/preview/researcher",
    title: "Researcher workspace",
    text: "Preview the workspace without signing in.",
    icon: Microscope,
  },
  {
    to: "/preview/admin",
    title: "Administrator workspace",
    text: "Preview the console; actual admin actions require login.",
    icon: ShieldCheck,
  },
] as const;
export function HomeDirectory() {
  const primaryPaths = new Set([
    "/expeditions",
    "/datasets",
    "/publications",
    "/media",
    "/observatory",
    "/learning",
  ]);
  const primaryFeatures = featurePages.filter((item) => primaryPaths.has(item.to));
  return (
    <section id="features" className="mx-auto max-w-7xl px-5 py-14">
      <p className="text-xs uppercase tracking-[.25em] text-sky-700">Choose your destination</p>
      <h2 className="mt-3 text-3xl font-bold">Everything is one click away.</h2>
      <p className="mt-3 mb-8 text-slate-600">
        Each card opens its own page. Explore research with its original source and credit.
      </p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {primaryFeatures.map((x) => (
          <a
            key={x.to}
            href={x.to}
            className="depth-card group rounded-2xl border border-sky-100 bg-white p-6 shadow-sm"
          >
            <div className="flex justify-between">
              <x.icon className="size-10 rounded-xl bg-sky-50 p-2 text-sky-600" />
              <ArrowUpRight className="text-slate-400 transition-transform group-hover:-translate-y-1" />
            </div>
            <h3 className="mt-4 text-xl font-bold">{x.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{x.text}</p>
            <span className="mt-5 block text-sm font-semibold text-blue-700">
              Explore {x.title.toLowerCase()} →
            </span>
          </a>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-sky-100 pt-6 text-sm font-semibold text-primary">
        {featurePages
          .filter((item) => !primaryPaths.has(item.to))
          .map((item) => (
            <a key={item.to} href={item.to} className="rounded-lg px-2 py-1 hover:bg-sky-50">
              {item.title} →
            </a>
          ))}
      </div>
    </section>
  );
}
