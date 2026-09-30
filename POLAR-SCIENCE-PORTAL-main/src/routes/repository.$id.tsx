import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PublicShell } from "@/components/site/public-shell";
import { knowledge, type KnowledgeResource } from "@/lib/knowledge";
export const Route = createFileRoute("/repository/$id")({ component: Detail });
function Detail() {
  const { id } = Route.useParams();
  const [item, setItem] = useState<KnowledgeResource | null>(null),
    [error, setError] = useState("");
  const [showJson, setShowJson] = useState(false);
  useEffect(() => {
    setItem(null);
    setError("");
    knowledge<KnowledgeResource>(`/resources/${encodeURIComponent(id)}`)
      .then(setItem)
      .catch((e) => setError(e.message));
  }, [id]);
  return (
    <PublicShell>
      <section className="mx-auto max-w-6xl px-4 py-12">
        {!item ? (
          <p role="status">{error || "Loading evidence…"}</p>
        ) : (
          <>
            <p className="text-xs uppercase tracking-widest text-cyan-700">
              {item.region} / {item.resource_type}
            </p>
            <h1 className="mt-3 text-3xl font-bold">{item.title}</h1>
            <p className="mt-4 text-muted-foreground">{item.description}</p>
            <section className="mt-5 rounded-2xl border border-sky-100 bg-sky-50 p-5">
              <h2 className="font-semibold text-slate-900">Evidence in brief</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This information comes from {item.source_owner}. Its current review state is{" "}
                {item.verification}; {item.chunk_count} inspectable evidence units are stored below.
              </p>
            </section>
            <div className="record-downloads mt-5 flex flex-wrap gap-3">
              <button
                className="rounded-lg bg-blue-600 px-4 py-2 text-white"
                title="Show the complete structured record before downloading"
                onClick={() => setShowJson((visible) => !visible)}
              >
                {showJson ? "Hide JSON preview" : "Preview record JSON"}
              </button>
              <button
                className="rounded-lg border bg-white px-4 py-2"
                title="Open the browser's PDF preview and save dialogue"
                onClick={() => window.print()}
              >
                Preview / Save as PDF
              </button>
            </div>
            {showJson && (
              <section className="mt-5 overflow-hidden rounded-2xl border bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
                  <div>
                    <h2 className="font-semibold">Structured record preview</h2>
                    <p className="text-xs text-slate-500">
                       Review this output before downloading it.
                    </p>
                  </div>
                  <button
                    className="rounded-lg border px-3 py-2 text-sm font-semibold"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(item, null, 2)], {
                        type: "application/json",
                      });
                      const url = URL.createObjectURL(blob);
                      const anchor = document.createElement("a");
                      anchor.href = url;
                      anchor.download = item.id + ".json";
                      anchor.click();
                      setTimeout(() => URL.revokeObjectURL(url), 1000);
                    }}
                  >
                    Download JSON
                  </button>
                </div>
                <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap break-words bg-slate-950 p-5 text-xs leading-5 text-sky-100">
                  {JSON.stringify(item, null, 2)}
                </pre>
              </section>
            )}
            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
              <div>
                {item.file_url ? (
                  <>
                    {item.mime_type?.startsWith("image/") ? (
                      <img src={item.file_url} alt={item.title} className="w-full rounded-xl" />
                    ) : item.mime_type?.startsWith("video/") ? (
                      <video
                        src={item.file_url}
                        controls
                        preload="metadata"
                        className="w-full rounded-xl"
                      >
                        <track kind="captions" />
                      </video>
                    ) : (
                      <iframe
                        title={item.title}
                        src={item.file_url}
                        className="h-[650px] w-full rounded-xl border bg-white"
                        sandbox="allow-same-origin"
                      />
                    )}
                    <a
                      className="mt-3 inline-block text-sm underline"
                      href={item.file_url}
                      download
                    >
                      Download stored original
                    </a>
                  </>
                ) : (
                  <div className="rounded-xl border bg-sky-50 p-6">
                    <h2 className="mb-2 font-semibold">Catalogue record</h2>
                    Download this record above for the description, source and rights information.
                    This entry provides metadata; an original measurement file is not included.
                  </div>
                )}
                <h2 className="mt-8 text-xl font-semibold">Canonical evidence</h2>
                {item.chunks?.map((c) => (
                  <article
                    id={c.chunk_id}
                    key={c.chunk_id}
                    className="mt-4 scroll-mt-28 rounded-xl border bg-white p-5"
                  >
                    <p className="break-all font-mono text-xs text-cyan-700">
                      {c.chunk_id} · {c.section}
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{c.text}</p>
                  </article>
                ))}
              </div>
              <aside className="h-fit rounded-2xl border bg-white p-6">
                <h2 className="text-lg font-semibold">Trust passport</h2>
                <dl className="mt-4 space-y-4 text-sm">
                  {[
                    ["Source owner", item.source_owner],
                    ["Review state", item.verification],
                    ["Rights", item.licence],
                    ["Extraction", item.extraction_status],
                    ["File checks", item.safety_status],
                    ["Ingested", item.created_at],
                    ["SHA-256", item.sha256],
                    ["Source reference", item.source_url],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="mt-1 break-all">{value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-5 text-xs text-muted-foreground">
                  Source attribution and curator review are not guarantees that every scientific
                  claim is true. Original files and evidence remain separate from generated drafts.
                </p>
              </aside>
            </div>
          </>
        )}
      </section>
    </PublicShell>
  );
}
