import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHero, PublicShell } from "@/components/site/public-shell";
import { knowledge, type KnowledgeResource } from "@/lib/knowledge";
import { PolarGlobe } from "@/components/globe/polar-globe";
import { DemoChart } from "@/features/site/demo-chart";
export const Route = createFileRoute("/observatory")({ component: Observatory });
function Observatory() {
  const [items, setItems] = useState<KnowledgeResource[]>([]),
    [group, setGroup] = useState<"region" | "resource_type">("region"),
    [status, setStatus] = useState("Loading catalogue…");
  useEffect(() => {
    knowledge<{ items: KnowledgeResource[] }>("/resources")
      .then((r) => {
        setItems(r.items);
        setStatus("");
      })
      .catch((e) => setStatus(e.message));
  }, []);
  const counts = items.reduce<Record<string, number>>((acc, r) => {
    acc[r[group]] = (acc[r[group]] || 0) + 1;
    return acc;
  }, {});
  return (
    <PublicShell>
      <PageHero
        eyebrow="Observatory"
        title="Explore the planet. Understand the evidence."
        lead="Explore the 3D atlas, compare the collection by region, and download catalogue statistics."
      />
      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-10">
          <DemoChart />
        </div>
        <PolarGlobe />
        <div className="mt-10 rounded-3xl border bg-white p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Repository distribution</h2>
            <label className="text-sm">
              Group by{" "}
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value as typeof group)}
                className="ml-2 rounded-lg border p-2"
              >
                <option value="region">Region</option>
                <option value="resource_type">Resource type</option>
              </select>
            </label>
          </div>
          <p className="my-4 text-sm text-slate-500">
            Counts refer to catalogue records, not environmental measurements or global data
            coverage.
          </p>
          <p role="status">{status}</p>
          <ul className="space-y-5">
            {Object.entries(counts).map(([label, value]) => (
              <li key={label}>
                <div className="mb-2 flex justify-between text-sm">
                  <span>{label}</span>
                  <strong>{value} records</strong>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-sky-50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 transition-all duration-700"
                    style={{ width: (100 * value) / Math.max(...Object.values(counts), 1) + "%" }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </PublicShell>
  );
}
