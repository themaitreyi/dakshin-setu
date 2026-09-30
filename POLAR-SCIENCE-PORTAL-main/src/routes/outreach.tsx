import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PublicShell, PageHero } from "@/components/site/public-shell";
import { Button } from "@/components/ui/button";
import { knowledge, type KnowledgeResource, type Evidence } from "@/lib/knowledge";
export const Route = createFileRoute("/outreach")({ component: Outreach });
function Outreach() {
  const [sources, setSources] = useState<KnowledgeResource[]>([]),
    [source, setSource] = useState(""),
    [audience, setAudience] = useState("students"),
    [format, setFormat] = useState("explainer"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [draft, setDraft] = useState<{
    id: string;
    content: string;
    provider: string;
    evidence: Evidence[];
  } | null>(null);
  useEffect(() => {
    knowledge<{ items: KnowledgeResource[] }>("/resources")
      .then((r) => {
        const s = r.items.filter((i) => i.verification === "curator-reviewed" && i.chunk_count);
        setSources(s);
        setSource(s[0]?.id || "");
      })
      .catch((e) => setError(e.message));
  }, []);
  async function generate() {
    setBusy(true);
    setError("");
    setDraft(null);
    try {
      setDraft(
        await knowledge("/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ source_ids: [source], audience, format }),
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <PublicShell>
      <PageHero
        eyebrow="Science → Outreach"
        title="Keep the evidence. Change the audience."
        lead="Generated drafts are stored separately from immutable originals. Citations stay attached throughout the transformation."
      />
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-2">
        <div className="depth-card space-y-6 rounded-3xl border bg-white p-7">
          <h2 className="text-xl font-semibold">01 / Scientific source</h2>
          <label className="block">
            Reviewed record
            <select
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setDraft(null);
              }}
              className="mt-2 w-full rounded-xl border p-3"
            >
              {!sources.length && <option value="">No reviewed sources yet</option>}
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            Audience
            <select
              value={audience}
              onChange={(e) => {
                setAudience(e.target.value);
                setDraft(null);
              }}
              className="mt-2 w-full rounded-xl border p-3"
            >
              {["students", "educators", "public", "journalists"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="block">
            Format
            <select
              value={format}
              onChange={(e) => {
                setFormat(e.target.value);
                setDraft(null);
              }}
              className="mt-2 w-full rounded-xl border p-3"
            >
              {["explainer", "press-release", "social-thread"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <Button disabled={!source || busy} onClick={generate}>
            {busy ? "Transforming with citations…" : "Create source-backed draft"}
          </Button>
          <p role="status" className="text-sm text-amber-800">
            {error}
          </p>
          <p className="text-xs text-muted-foreground">
            Without a working Gemini connection, the service returns an explicitly labelled
            source-excerpt template, not a pretend AI rewrite.
          </p>
        </div>
        <article className="rounded-3xl border border-cyan-200 bg-white/80 p-7 shadow-xl shadow-cyan-100/30">
          <h2 className="text-xl font-semibold">02 / Outreach draft</h2>
          {draft ? (
            <div key={draft.id} className="animate-in fade-in slide-in-from-left-4 duration-700">
              <p className="my-4 rounded-full bg-amber-50 px-4 py-2 text-xs">
                DRAFT · HUMAN REVIEW REQUIRED · {draft.provider}
              </p>
              <div className="whitespace-pre-wrap text-sm leading-7">{draft.content}</div>
              <Button
                variant="outline"
                className="mt-5"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(draft.content);
                    setError("Draft copied.");
                  } catch {
                    setError("Clipboard unavailable. Select and copy the draft text.");
                  }
                }}
              >
                Copy draft
              </Button>
              <h3 className="mt-6 font-semibold">Evidence retained</h3>
              {draft.evidence.map((e) => (
                <Link
                  className="mt-2 block break-all text-xs text-cyan-700 underline"
                  key={e.chunk_id}
                  to="/repository/$id"
                  params={{ id: e.document_id }}
                >
                  {e.chunk_id} · {e.section}
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-8 text-muted-foreground">
              Your source-backed draft will appear here. No source text is overwritten.
            </p>
          )}
        </article>
      </section>
    </PublicShell>
  );
}
