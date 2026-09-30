import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  FileUp,
  Search,
  ShieldAlert,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { PageHero, PublicShell } from "@/components/site/public-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/demo")({ component: JudgeDemo });

const steps = [
  {
    icon: FileUp,
    title: "Ingest a legitimate source",
    body: "Extract text and available metadata, create traceable chunks and reject unchanged duplicates.",
    action: "Open submission",
    to: "/repository/upload",
  },
  {
    icon: Search,
    title: "Run hybrid discovery",
    body: "Combine lexical relevance, semantic similarity and supported metadata filters.",
    action: "Search sea ice",
    to: "/repository",
  },
  {
    icon: Sparkles,
    title: "Ask with evidence",
    body: "Retrieve first, generate second, and return source-linked evidence with the answer.",
    action: "Open assistant",
    to: "/",
  },
  {
    icon: ShieldAlert,
    title: "Test the evidence gate",
    body: "Ask an unrelated question and see a formal insufficient-evidence response instead of fabrication.",
    action: "Try the gate",
    to: "/",
  },
  {
    icon: WandSparkles,
    title: "Create outreach",
    body: "Adapt the same evidence for students, educators, the public or journalists while retaining provenance.",
    action: "Open studio",
    to: "/outreach",
  },
] as const;

function JudgeDemo() {
  return (
    <PublicShell>
      <PageHero
        eyebrow="Platform guide"
        title="Prove the complete knowledge-to-outreach workflow"
        lead="Discover how to submit sources, search the collection and create source-linked outreach."
      />
      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-success/30 bg-success/5 p-5">
          <CheckCircle2 className="size-5 text-success" />
          <p className="text-sm">
            <strong>Source-led discovery:</strong> follow citations from an answer to the original
            research record.
          </p>
        </div>
        <ol className="space-y-5">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="group grid gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:border-accent hover:shadow-md sm:grid-cols-[auto_1fr_auto] sm:items-center"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <step.icon className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Step {index + 1}</Badge>
                  <h2 className="font-display text-xl font-semibold">{step.title}</h2>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
              <Button asChild variant="outline" className="rounded-full">
                <Link to={step.to}>
                  {step.action}
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </li>
          ))}
        </ol>
      </section>
    </PublicShell>
  );
}
