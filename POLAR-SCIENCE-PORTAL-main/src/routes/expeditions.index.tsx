import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, PublicShell } from "@/components/site/public-shell";
import { PolarGlobe } from "@/components/globe/polar-globe";
import { DemoGallery } from "@/features/site/demo-gallery";
import { useEffect, useState } from "react";
import { knowledge, type KnowledgeResource } from "@/lib/knowledge";
import { RecordExplorer } from "@/features/repository/record-explorer";
export const Route = createFileRoute("/expeditions/")({ component: Expeditions });

interface ExpeditionRegisterItem {
  id: string;
  title: string;
  expedition_number: number;
  program: string;
  season: string;
  leader?: string;
  vessel?: string;
  status: string;
  objectives_and_achievements?: string;
  register: string;
  verification: string;
}

function Expeditions() {
  const [items, setItems] = useState<KnowledgeResource[]>([]),
    [error, setError] = useState("");
  const [register, setRegister] = useState<ExpeditionRegisterItem[]>([]);
  const [query, setQuery] = useState("");
  useEffect(() => {
    knowledge<{ items: KnowledgeResource[] }>("/resources")
      .then((r) =>
        setItems(r.items.filter((i) => ["expedition", "report"].includes(i.resource_type))),
      )
      .catch((e) => setError(e.message));
    knowledge<{ items: ExpeditionRegisterItem[] }>("/catalog/expedition?limit=100")
      .then((response) => setRegister(response.items))
      .catch(() => undefined);
  }, []);
  const filteredRegister = register.filter((item) =>
    `${item.expedition_number} ${item.program} ${item.season} ${item.leader || ""} ${item.vessel || ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <PublicShell>
      <DemoGallery categories={["expedition"]} />
      <PageHero
        eyebrow="India's polar atlas"
        title="Explore stations. Inspect the record."
        lead="Navigate between polar regions using the same satellite composite in globe and map views. Historical establishment dates are not live operational status."
      />
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-2">
        <PolarGlobe />
        <div>
          <h2 className="text-2xl font-semibold">Stored expedition resources</h2>
          <p role="status">{error}</p>
          {items.map((r) => (
            <Link
              key={r.id}
              to="/repository/$id"
              params={{ id: r.id }}
              className="mt-5 block rounded-2xl border bg-white p-6"
            >
              <h3 className="font-semibold">{r.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{r.description}</p>
              <p className="mt-3 text-xs">
                {r.file_url ? "Original stored" : "Metadata only"} · {r.verification}
              </p>
            </Link>
          ))}
          <p className="mt-8 text-sm text-muted-foreground">
            Open any resource to read its source description and download the catalogue record.
          </p>
        </div>
      </section>
      {!!register.length && (
        <section className="border-t bg-slate-50/80">
          <div className="mx-auto max-w-7xl px-4 py-14">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-800">
                  Production register
                </p>
                <h2 className="mt-2 text-3xl font-bold">Complete expedition catalogue</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  {register.length} supplied Antarctic, Arctic and Southern Ocean expedition
                  records. Verification remains visible per record.
                </p>
              </div>
              <label className="grid gap-1 text-xs font-medium text-slate-600">
                Search expeditions
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Year, leader, vessel…"
                  className="h-11 min-w-72 rounded-xl border bg-white px-4 text-sm"
                />
              </label>
            </div>
            <p role="status" className="my-6 text-sm text-slate-500">
              {filteredRegister.length} matching records
            </p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredRegister.map((item) => (
                <article key={item.id} className="rounded-2xl border bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">
                        Expedition {item.expedition_number}
                      </p>
                      <h3 className="mt-2 font-semibold">{item.program}</h3>
                    </div>
                    <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-semibold text-sky-800">
                      {item.season}
                    </span>
                  </div>
                  <dl className="mt-4 grid gap-2 text-sm">
                    {item.leader && (
                      <div>
                        <dt className="inline text-slate-500">Leader: </dt>
                        <dd className="inline">{item.leader}</dd>
                      </div>
                    )}
                    {item.vessel && (
                      <div>
                        <dt className="inline text-slate-500">Vessel: </dt>
                        <dd className="inline">{item.vessel}</dd>
                      </div>
                    )}
                  </dl>
                  {item.objectives_and_achievements && (
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {item.objectives_and_achievements}
                    </p>
                  )}
                  <p className="mt-4 text-[10px] uppercase tracking-wide text-slate-500">
                    {item.verification.replaceAll("-", " ")}
                  </p>
                  <details className="mt-4 border-t pt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-primary">
                      View evidence, JSON and PDF
                    </summary>
                    <RecordExplorer
                      record={{
                        ...item,
                        evidence_summary:
                          item.objectives_and_achievements ||
                          `${item.program} expedition register entry for ${item.season}.`,
                      }}
                      kind="expedition"
                      compact
                    />
                  </details>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </PublicShell>
  );
}
