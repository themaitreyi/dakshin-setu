import { Link } from "@tanstack/react-router";

import { site } from "@/features/site/content";

const columns = [
  {
    heading: "Explore",
    links: [
      { to: "/expeditions", label: "Expeditions" },
      { to: "/repository", label: "Data repository" },
      { to: "/media", label: "Media gallery" },
      { to: "/learning", label: "Learning modules" },
    ],
  },
  {
    heading: "Participate",
    links: [
      { to: "/auth", label: "Login" },
      { to: "/repository/upload", label: "Submit a dataset" },
      { to: "/student", label: "Student hub" },
      { to: "/researcher", label: "Researcher portal" },
      { to: "/outreach", label: "Outreach studio" },
      { to: "/contact", label: "Contact the project team" },
      { to: "/about", label: "About the programme" },
      { to: "/demo", label: "Platform guide" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-sidebar text-sidebar-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <h2 className="font-display text-lg font-semibold">{site.name}</h2>
          <p className="mt-3 max-w-md text-sm text-sidebar-foreground/75">
            {site.tagline}. An independent SIH project, not an official NCPOR or Government of India
            website.
          </p>
          <p className="mt-4 text-sm text-sidebar-foreground/75">
            Research institutions retain ownership of their source material. Coverage and review
            status are visible in each record.
          </p>
        </div>
        {columns.map((col) => (
          <nav key={col.heading} aria-label={col.heading}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-sidebar-foreground">
              {col.heading}
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-sidebar-foreground/75 underline-offset-4 hover:text-sidebar-foreground hover:underline"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-sidebar-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-sidebar-foreground/70 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Dakshinsetu. Source licences apply to individual records.
          </p>
          <p>Original sources and generated drafts are clearly separated.</p>
        </div>
      </div>
    </footer>
  );
}
