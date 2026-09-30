import { Link, createFileRoute } from "@tanstack/react-router";
import { Clock, GraduationCap, ListChecks } from "lucide-react";

import { PageHero, PublicShell } from "@/components/site/public-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { modules } from "@/features/learning/data";

const title = "Learning modules | Dakshinsetu";
const description =
  "Free polar science learning modules with quizzes — from why India studies the poles to reading ice cores and Southern Ocean carbon accounting.";

export const Route = createFileRoute("/learning/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: LearningIndex,
});

const levelStyles: Record<string, string> = {
  Foundation: "bg-success text-success-foreground",
  Intermediate: "bg-accent text-accent-foreground",
  Advanced: "bg-primary text-primary-foreground",
};

function LearningIndex() {
  return (
    <PublicShell>
      <PageHero
        eyebrow="Outreach and capacity building"
        title="Learn polar science with India's research programme"
        lead="Explore short learning modules and self-check quizzes. Editorial review is pending; these learning notes are not an official curriculum."
      />

      <section className="mx-auto max-w-7xl px-4 py-12">
        <ul className="grid gap-6 lg:grid-cols-3">
          {modules.map((m) => (
            <li key={m.slug}>
              <article className="flex h-full flex-col rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={levelStyles[m.level]}>{m.level}</Badge>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3.5" aria-hidden />
                    {m.minutes} min
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <ListChecks className="size-3.5" aria-hidden />
                    {m.quiz.length} questions
                  </span>
                </div>
                <h2 className="mt-3 font-display text-xl font-semibold">{m.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {m.summary}
                </p>
                <p className="mt-4 text-xs text-muted-foreground">
                  <GraduationCap className="mr-1 inline size-3.5" aria-hidden />
                  {m.audience}
                </p>
                <Button asChild className="mt-5 w-full">
                  <Link to="/learning/$slug" params={{ slug: m.slug }}>
                    Open module
                  </Link>
                </Button>
              </article>
            </li>
          ))}
        </ul>

        <div className="mt-12 rounded-xl border border-border bg-muted/40 p-6">
          <h2 className="font-display text-xl font-bold">For teachers</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Review these draft lessons before classroom use. For traceable evidence, use the
            repository and its source-linked outreach generator. Quizzes run entirely in the browser
            and record no personal data.
          </p>
        </div>
      </section>
    </PublicShell>
  );
}
