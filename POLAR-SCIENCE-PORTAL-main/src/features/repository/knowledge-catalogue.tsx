import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { knowledge, type KnowledgeResource } from "@/lib/knowledge";
import { PageHero, PublicShell } from "@/components/site/public-shell";
import { Button } from "@/components/ui/button";
import { EvidenceSearch } from "./evidence-search";
import { DemoGallery } from "@/features/site/demo-gallery";
import { visualForId } from "@/features/site/example-visuals";
import { RecordExplorer, type CatalogueRecord } from "./record-explorer";

interface ProductionMedia extends CatalogueRecord {
  kind?: string;
  type: "photo" | "video";
  caption: string;
  location: string;
  date: string;
  credit_line: string;
  licence: string;
  source: string;
  file_url: string | null;
  verification: string;
  evidence_summary?: string;
  source_url?: string;
  evidence_role?: "direct-record-media" | "illustrative-context";
}

interface ProductionRecord extends CatalogueRecord {
  abstract?: string;
  licence?: string;
  doi?: string;
  year?: number;
  station?: string | null;
  region?: string;
  formats?: string[];
  temporal_range?: { start?: string; end?: string };
}

export function KnowledgeCatalogue({
  media = false,
  title,
  kinds,
  topic,
}: {
  media?: boolean;
  title?: string;
  kinds?: string[];
  topic?: string;
}) {
  const [items, setItems] = useState<KnowledgeResource[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const [productionMedia, setProductionMedia] = useState<ProductionMedia[]>([]);
  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>([]);
  const productionKinds = media
    ? []
    : (kinds || []).filter((kind) => ["dataset", "publication", "report"].includes(kind));
  const productionKindsKey = productionKinds.join(",");
  const [query, setQuery] = useState(""),
    [region, setRegion] = useState(""),
    [type, setType] = useState("");
  useEffect(() => {
    const requestedProductionKinds = productionKindsKey ? productionKindsKey.split(",") : [];
    knowledge<{ items: KnowledgeResource[] }>("/resources")
      .then((r) => setItems(r.items))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    if (media) {
      knowledge<{ items: ProductionMedia[] }>("/catalog/media?limit=100")
        .then((response) => setProductionMedia(response.items))
        .catch(() => undefined);
    }
    if (requestedProductionKinds.length) {
      Promise.all(
        requestedProductionKinds.map((kind) =>
          knowledge<{ items: ProductionRecord[] }>(`/catalog/${kind}?limit=100`),
        ),
      )
        .then((responses) => setProductionRecords(responses.flatMap((response) => response.items)))
        .catch(() => undefined);
    }
  }, [media, productionKindsKey]);
  const filtered = items.filter(
    (r) =>
      (!media || ["photo", "video"].includes(r.resource_type)) &&
      (!kinds || kinds.includes(r.resource_type)) &&
      (!topic || r.topics.includes(topic)) &&
      (!region || r.region === region) &&
      (!type || r.resource_type === type) &&
      `${r.title} ${r.description} ${r.topics.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <PublicShell>
      <PageHero
        eyebrow="Persistent knowledge repository"
        title={title || (media ? "Real media, with provenance" : "Explore India's polar knowledge")}
        lead="Explore source-linked research, publications and media. Open a record to read its information and access available downloads."
      />
      <section className="mx-auto max-w-7xl px-4 py-10">
        {!media && !topic && <EvidenceSearch />}
        {topic === "vessel" && (
          <p className="mb-6 text-sm text-slate-600">
            Research vessel profiles and historical expedition information.
          </p>
        )}
        <div className="mb-6 flex flex-wrap gap-3">
          <input
            aria-label="Search catalogue"
            placeholder="Search title, topics or description…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-64 flex-1 rounded-xl border bg-white p-3"
          />
          <select
            aria-label="Region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="rounded-xl border bg-white p-3"
          >
            <option value="">All regions</option>
            {["Antarctic", "Arctic", "Himalaya", "Southern Ocean", "Multiple"].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <select
            aria-label="Resource type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-xl border bg-white p-3"
          >
            <option value="">All types</option>
            {["report", "publication", "dataset", "photo", "video", "expedition", "activity"].map(
              (r) => (
                <option key={r}>{r}</option>
              ),
            )}
          </select>
          <Button asChild>
            <Link to="/repository/upload">Add source</Link>
          </Button>
        </div>
        <p role="status" className="mb-5 text-sm text-muted-foreground">
          {loading
            ? "Loading stored resources…"
            : error ||
              `${filtered.length} records shown · ${items.filter((i) => i.file_url).length} files stored locally · ${items.filter((i) => i.verification === "curator-reviewed").length} reviewed records`}
        </p>
        {media && productionMedia.length > 0 && (
          <section className="mb-12" aria-labelledby="permitted-media-title">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-800">
                  Rights registry
                </p>
                <h2 id="permitted-media-title" className="mt-2 text-2xl font-bold">
                  Permitted photos and videos
                </h2>
              </div>
              <p className="max-w-xl text-xs leading-5 text-slate-500">
                Only locally stored media with recorded redistribution permission appears in this
                section.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {productionMedia.map((item) => (
                <figure key={item.id} className="overflow-hidden rounded-2xl border bg-white">
                  {item.file_url && item.type === "photo" && (
                    <img
                      src={item.file_url}
                      alt={item.caption}
                      className="aspect-video w-full object-cover"
                      loading="lazy"
                    />
                  )}
                  {item.file_url && item.type === "video" && (
                    <video
                      src={item.file_url}
                      controls
                      preload="metadata"
                      className="aspect-video w-full bg-slate-950 object-contain"
                      aria-label={item.caption}
                    />
                  )}
                  <figcaption className="p-5">
                    <h3 className="font-semibold leading-6">{item.caption}</h3>
                    <p className="mt-2 text-xs text-slate-500">
                      {item.location} · {item.date}
                    </p>
                    <p className="mt-3 text-sm text-slate-600">{item.credit_line}</p>
                    <p className="mt-2 text-xs font-semibold uppercase text-amber-800">
                      {item.evidence_role === "illustrative-context"
                        ? "Illustrative regional context — not direct station evidence"
                        : "Direct record media"}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-800">
                        {item.licence}
                      </span>
                      <a
                        href={item.source}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-primary underline-offset-4 hover:underline"
                      >
                        Original source →
                      </a>
                    </div>
                    <details className="mt-4 border-t pt-4">
                      <summary className="cursor-pointer font-semibold text-primary">
                        View evidence, JSON and downloads
                      </summary>
                      <RecordExplorer record={item} kind="media" compact />
                      {item.file_url && (
                        <Button asChild size="sm" className="mt-3">
                          <a
                            href={item.file_url}
                            download
                            title="Download this rights-cleared media file"
                          >
                            Download media file
                          </a>
                        </Button>
                      )}
                    </details>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}
        {productionKinds.length > 0 && productionRecords.length > 0 && (
          <section className="mb-12" aria-labelledby="production-register-title">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-800">
                Structured production register
              </p>
              <h2 id="production-register-title" className="mt-2 text-2xl font-bold">
                Source-linked records
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {productionRecords.length} records from the supplied production core. Records
                without an explicit audit remain labelled accordingly.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {productionRecords.map((record) => {
                const visual = visualForId(record.id);
                return (
                  <article key={record.id} className="overflow-hidden rounded-2xl border bg-white">
                    <img
                      src={visual.src}
                      alt={visual.alt}
                      className="aspect-[16/7] w-full object-cover"
                      loading="lazy"
                    />
                    <div className="p-5">
                      <p className="mb-3 text-[11px] leading-5 text-amber-800">
                        <span className="font-semibold uppercase">{visual.evidenceRole}</span> ·{" "}
                        {visual.caption}. {visual.credit}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        {record.region && <span>{record.region}</span>}
                        {record.year && <span>· {record.year}</span>}
                        {record.station && <span>· {record.station}</span>}
                      </div>
                      <h3 className="mt-2 text-lg font-semibold leading-7">{record.title}</h3>
                      {record.abstract && (
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                          {record.abstract}
                        </p>
                      )}
                      {record.temporal_range && (
                        <p className="mt-3 text-xs text-slate-500">
                          Coverage: {record.temporal_range.start}–{record.temporal_range.end}
                        </p>
                      )}
                      {!!record.formats?.length && (
                        <p className="mt-2 text-xs text-slate-500">
                          Formats: {record.formats.join(", ")}
                        </p>
                      )}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-900">
                          {record.verification.replaceAll("-", " ")}
                        </span>
                      </div>
                      <details className="mt-4 border-t pt-4">
                        <summary className="cursor-pointer font-semibold text-primary">
                          View full information, evidence and downloads
                        </summary>
                        <RecordExplorer
                          record={record}
                          kind={record.kind || "publication"}
                          compact
                        />
                      </details>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => {
            const visual = visualForId(r.id);
            return (
              <Link
                key={r.id}
                to="/repository/$id"
                params={{ id: r.id }}
                className="depth-card rounded-2xl border bg-white p-6 shadow-sm"
              >
                {r.mime_type?.startsWith("image/") && r.file_url && (
                  <img
                    src={r.file_url}
                    alt={r.title}
                    className="mb-4 aspect-video w-full rounded-xl object-cover"
                    loading="lazy"
                  />
                )}
                {r.mime_type === "video/mp4" && r.file_url && (
                  <video
                    src={r.file_url + "#t=0.1"}
                    preload="metadata"
                    muted
                    playsInline
                    className="mb-4 aspect-video w-full rounded-xl bg-slate-100 object-cover"
                    aria-label={r.title}
                  />
                )}
                {!r.file_url && (
                  <>
                    <img
                      src={visual.src}
                      alt={visual.alt}
                      className="mb-3 aspect-video w-full rounded-xl object-cover"
                      loading="lazy"
                    />
                    <p className="mb-3 text-[11px] leading-5 text-amber-800">
                      {visual.evidenceRole}: {visual.caption}
                    </p>
                  </>
                )}
                <p className="text-xs uppercase tracking-widest text-cyan-700">
                  {r.region} · {r.resource_type}
                </p>
                <h2 className="mt-3 text-xl font-semibold">{r.title}</h2>
                <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{r.description}</p>
                <div className="mt-5 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-sky-50 px-3 py-1">
                    {r.file_url ? "Stored file" : "Metadata only"}
                  </span>
                  <span className="rounded-full bg-amber-50 px-3 py-1">{r.verification}</span>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  {r.source_owner} · {r.chunk_count} evidence units
                </p>
              </Link>
            );
          })}
        </div>
        {!loading && !error && !filtered.length && (
          <p className="rounded-2xl border bg-white p-8">
            No matching resources have been ingested. Add a permitted file or source metadata to
            begin.
          </p>
        )}
      </section>
      <DemoGallery
        categories={
          topic === "vessel" ? ["vessel"] : kinds || (media ? [] : ["dataset", "publication"])
        }
      />
    </PublicShell>
  );
}
