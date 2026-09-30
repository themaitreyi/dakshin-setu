import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { catalogue } from "@/lib/offline-catalogue";
import type { KnowledgeResource } from "@/lib/knowledge";
import { exampleVisuals } from "@/features/site/example-visuals";
export function DemoGallery({ categories }: { categories: string[] }) {
  const [items, setItems] = useState<KnowledgeResource[]>([]);
  useEffect(() => {
    catalogue()
      .then(setItems)
      .catch(() => {});
  }, []);
  const entries = items
    .filter(
      (r) =>
        categories.includes(r.resource_type) ||
        (categories.includes("vessel") && r.topics.includes("vessel")),
    )
    .slice(0, 9);
  if (!entries.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-5 py-10">
      <h2 className="mb-6 text-2xl font-bold">Explore related resources</h2>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {entries.map((r, index) => {
          const visual = exampleVisuals[index % exampleVisuals.length]!;
          return (
            <Link
              key={r.id}
              to="/repository/$id"
              params={{ id: r.id }}
              className="depth-card overflow-hidden rounded-2xl border bg-white shadow-sm"
            >
              <img
                src={visual.src}
                alt={visual.alt}
                className="aspect-[16/9] w-full object-cover"
                loading="lazy"
              />
              <div className="p-6">
                <p className="text-xs uppercase text-sky-700">
                  {r.region} · {r.resource_type}
                </p>
                <h3 className="my-3 text-xl font-semibold">{r.title}</h3>
                <p className="line-clamp-3 text-sm leading-6 text-slate-600">{r.description}</p>
                <p className="mt-4 text-xs font-medium text-amber-800">
                  {visual.evidenceRole}: {visual.caption}
                </p>
                <p className="mt-1 text-xs text-slate-500">Photo: {visual.credit}</p>
                <p className="mt-3 text-xs text-slate-500">Record source: {r.source_owner}</p>
                <span className="mt-4 block font-semibold text-blue-700">
                  Read, preview & download →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
