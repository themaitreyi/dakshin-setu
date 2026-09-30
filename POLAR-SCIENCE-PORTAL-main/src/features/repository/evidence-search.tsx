import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { knowledge, type Evidence, type KnowledgeResource } from "@/lib/knowledge";
import { Button } from "@/components/ui/button";
export function EvidenceSearch() {
  const [query, setQuery] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [hits, setHits] = useState<
    (Evidence & { resource: KnowledgeResource; snippet: string; semantic_score: number | null })[]
  >([]);
  async function search(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const r = await knowledge<{ hits: typeof hits; retrieval_mode: string }>("/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query }),
      });
      setHits(r.hits);
      setMessage(`${r.hits.length} matching evidence units · ${r.retrieval_mode}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Search failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mb-8 rounded-2xl border bg-sky-50/70 p-6">
      <h2 className="text-xl font-semibold">Search inside the evidence</h2>
      <form onSubmit={search} className="mt-4 flex gap-3">
        <input
          aria-label="Evidence query"
          required
          minLength={2}
          maxLength={1200}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try Himadri aerosol or sea ice…"
          className="min-w-0 flex-1 rounded-lg border bg-white p-3"
        />
        <Button disabled={busy} type="submit">
          {busy ? "Searching…" : "Search"}
        </Button>
      </form>
      <p role="status" className="mt-3 text-xs text-muted-foreground">
        {message ||
          "Search original extracted text and labelled catalogue metadata. Relevance is not a truth score."}
      </p>
      {hits.map((h) => (
        <article key={h.chunk_id} className="mt-4 rounded-xl border bg-white p-4">
          <Link
            to="/repository/$id"
            params={{ id: h.document_id }}
            className="font-semibold text-cyan-800 underline"
          >
            {h.resource.title}
          </Link>
          <p className="mt-2 break-all text-xs">
            {h.chunk_id} · {h.section} · BM25 {h.lexical_score}
            {h.semantic_score !== null ? ` · cosine ${h.semantic_score}` : ""}
          </p>
          <p className="mt-3 line-clamp-4 text-sm leading-relaxed">{h.snippet}</p>
        </article>
      ))}
    </div>
  );
}
