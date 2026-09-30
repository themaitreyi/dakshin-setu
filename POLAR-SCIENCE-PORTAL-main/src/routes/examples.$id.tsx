import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PublicShell, PageHero } from "@/components/site/public-shell";
import { catalogue } from "@/lib/offline-catalogue";
import type { KnowledgeResource } from "@/lib/knowledge";
import { visualForId } from "@/features/site/example-visuals";
export const Route = createFileRoute("/examples/$id")({ component: Example });
function Example() {
  const { id } = Route.useParams();
  const [items, setItems] = useState<KnowledgeResource[]>([]);
  useEffect(() => {
    catalogue()
      .then(setItems)
      .catch(() => {});
  }, []);
  const keywords: Record<string, string> = {
    "station-weather": "AWS",
    "glacier-survey": "Himansh",
    "ocean-profile": "Hydrographic",
    "science-brief": "Hydrographic",
    "antarctic-journey": "1981",
    "arctic-campaign": "Himadri",
    "classroom-workshop": "Himansh",
    "data-clinic": "Arctic research",
    "demo-voyager": "Sagar Kanya",
  };
  const item =
    items.find((r) => r.title.toLowerCase().includes((keywords[id] || id).toLowerCase())) ||
    items[0];
  const visual = visualForId(item?.id || id);
  return (
    <PublicShell>
      <PageHero
        eyebrow="Resource explorer"
        title={item?.title || "Loading resource"}
        lead={item?.description || "Opening the source catalogue…"}
      />
      {item && (
        <section className="mx-auto max-w-5xl px-5 py-10">
          <article className="rounded-2xl border bg-white p-7">
            <img
              src={visual.src}
              alt={visual.alt}
              className="mb-6 aspect-[16/8] w-full rounded-xl object-cover"
            />
            <p className="mb-6 text-xs leading-5 text-slate-500">
              <span className="font-semibold uppercase text-amber-800">{visual.evidenceRole}</span>{" "}
              · {visual.caption}. Photo:{" "}
              <a href={visual.source} target="_blank" rel="noreferrer" className="underline">
                {visual.credit}
              </a>
            </p>
            <h2 className="text-xl font-bold">Overview & information</h2>
            <p className="my-5 leading-8">{item.description}</p>
            <p className="text-sm">
              Source: {item.source_owner} · Region: {item.region}
            </p>
            <p className="my-4 text-sm">{item.licence}</p>
            <Link
              to="/repository/$id"
              params={{ id: item.id }}
              className="inline-block rounded-xl bg-blue-600 px-5 py-3 text-white"
            >
              Open record & downloads →
            </Link>
          </article>
        </section>
      )}
    </PublicShell>
  );
}
