import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHero, PublicShell } from "@/components/site/public-shell";
import { knowledge, type KnowledgeResource } from "@/lib/knowledge";
export const Route = createFileRoute("/history")({ component: History });
function History() {
  const [items, setItems] = useState<KnowledgeResource[]>([]),
    [status, setStatus] = useState("Loading milestones…");
  useEffect(() => {
    knowledge<{ items: KnowledgeResource[] }>("/resources")
      .then((r) => {
        setItems(
          r.items
            .filter((x) => x.topics.includes("history"))
            .sort((a, b) => a.title.localeCompare(b.title)),
        );
        setStatus("");
      })
      .catch((e) => setStatus(e.message));
  }, []);
  return (
    <PublicShell>
      <PageHero
        eyebrow="Polar heritage"
        title="India’s journey to the poles"
        lead="A source-linked timeline. Each milestone opens its stored evidence record; this is a selected history, not an exhaustive expedition archive."
      />
      <section className="mx-auto max-w-4xl px-5 py-14">
        <p role="status">{status}</p>
        <ol className="border-l-2 border-sky-200 pl-7">
          {items.map((r) => (
            <li key={r.id} className="relative mb-7">
              <span className="absolute -left-[37px] top-7 size-4 rounded-full border-4 border-white bg-blue-600 shadow" />
              <Link
                to="/repository/$id"
                params={{ id: r.id }}
                className="depth-card block rounded-2xl border bg-white p-7 shadow-sm"
              >
                <h2 className="text-xl font-bold text-blue-800">{r.title}</h2>
                <p className="mt-4 leading-7 text-slate-600">{r.description}</p>
                <p className="mt-4 text-xs text-sky-700">Inspect source & provenance →</p>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </PublicShell>
  );
}
