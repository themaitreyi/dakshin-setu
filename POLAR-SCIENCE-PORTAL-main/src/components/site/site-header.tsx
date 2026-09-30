import { Link, useRouterState } from "@tanstack/react-router";
import { Bot, ChevronDown, Menu, Search, UserRound } from "lucide-react";
import { useState } from "react";
import { BrandMark } from "@/components/site/brand-mark";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { navigationGroups, site } from "@/features/site/content";

function DesktopNavigation() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const primary = [
    { to: "/expeditions", label: "Expeditions" },
    { to: "/datasets", label: "Datasets" },
    { to: "/publications", label: "Publications" },
    { to: "/media", label: "Media" },
    { to: "/observatory", label: "3D globe" },
  ] as const;
  const more = [
    { to: "/vessels", label: "Research vessels" },
    { to: "/history", label: "Polar history" },
    { to: "/repository", label: "Evidence library" },
    { to: "/outreach", label: "Outreach studio" },
    { to: "/researcher", label: "Researcher workspace" },
    { to: "/learning", label: "Learning modules" },
    { to: "/student", label: "Student portal" },
    { to: "/activities", label: "Activities" },
    { to: "/about", label: "About Dakshinsetu" },
    { to: "/contact", label: "Contact" },
    { to: "/demo", label: "Platform guide" },
  ] as const;
  return (
    <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
      <Link
        to="/"
        className={`rounded-lg px-3 py-2 text-sm font-medium no-underline transition-colors ${pathname === "/" ? "bg-secondary text-primary" : "text-slate-700 hover:bg-slate-100"}`}
      >
        Home
      </Link>
      {primary.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={`rounded-lg px-3 py-2 text-sm font-medium no-underline transition-colors ${pathname.startsWith(item.to) ? "bg-secondary text-primary" : "text-slate-700 hover:bg-slate-100"}`}
        >
          {item.label}
        </Link>
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={`inline-flex h-10 items-center gap-1 rounded-lg px-3 text-sm font-medium transition-colors ${more.some((item) => pathname.startsWith(item.to)) ? "bg-secondary text-primary" : "text-slate-700 hover:bg-slate-100"}`}
          >
            More <ChevronDown className="size-3.5" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="grid max-h-[70vh] min-w-64 grid-cols-1 overflow-y-auto p-2"
        >
          {more.map((item) => (
            <DropdownMenuItem asChild key={item.to} className="cursor-pointer px-3 py-2.5">
              <Link to={item.to}>{item.label}</Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-18 max-w-7xl items-center gap-5 px-4 py-2">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-3 no-underline"
            aria-label={`${site.name} — home`}
          >
            <BrandMark className="size-11" />
            <span className="leading-tight">
              <span className="block font-display text-lg font-semibold text-slate-950">
                Dakshinsetu
              </span>
              <span className="block text-[11px] font-medium tracking-wide text-slate-500">
                {site.tagline}
              </span>
            </span>
          </Link>
          <div className="ml-auto lg:ml-3">
            <DesktopNavigation />
          </div>
          <div className="ml-auto flex items-center gap-1 lg:ml-0">
            <Button asChild variant="ghost" size="icon" aria-label="Search polar resources">
              <Link to="/repository">
                <Search aria-hidden />
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="hidden xl:inline-flex"
              onClick={() => window.dispatchEvent(new CustomEvent("open-polaris-ai"))}
            >
              <Bot aria-hidden /> Ask AI
            </Button>
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link to="/auth">
                <UserRound aria-hidden /> Login
              </Link>
            </Button>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open navigation menu"
                >
                  <Menu aria-hidden />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(90vw,360px)] overflow-y-auto p-6">
                <SheetTitle className="flex items-center gap-3 font-display text-xl">
                  <BrandMark /> Dakshinsetu
                </SheetTitle>
                <nav aria-label="Mobile" className="mt-6 space-y-6">
                  <Link
                    to="/"
                    onClick={() => setOpen(false)}
                    className="block min-h-11 rounded-lg px-3 py-2.5 font-semibold hover:bg-secondary"
                  >
                    Home
                  </Link>
                  {navigationGroups.map((group) => (
                    <section key={group.label}>
                      <h2 className="px-3 text-xs font-semibold uppercase tracking-[.16em] text-slate-500">
                        {group.label}
                      </h2>
                      <div className="mt-2 grid">
                        {group.items.map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setOpen(false)}
                            className="min-h-11 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </section>
                  ))}
                </nav>
                <div className="mt-7 grid gap-3 border-t pt-6">
                  <Button
                    onClick={() => {
                      setOpen(false);
                      window.dispatchEvent(new CustomEvent("open-polaris-ai"));
                    }}
                  >
                    <Bot /> Ask Dakshinsetu AI
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/auth" onClick={() => setOpen(false)}>
                      Login
                    </Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}
