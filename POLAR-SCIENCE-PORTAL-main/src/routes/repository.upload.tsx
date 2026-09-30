import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHero, PublicShell } from "@/components/site/public-shell";
import { Button } from "@/components/ui/button";
import { knowledge, type KnowledgeResource } from "@/lib/knowledge";
export const Route = createFileRoute("/repository/upload")({ component: Upload });
function Upload() {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [result, setResult] = useState<KnowledgeResource | null>(null),
    [token, setToken] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setResult(null);
    const form = new FormData(event.currentTarget);
    const file = form.get("file") as File;
    const metadata = {
      title: form.get("title"),
      description: form.get("description"),
      source_url: form.get("source_url"),
      source_owner: form.get("source_owner"),
      licence: form.get("licence"),
      resource_type: form.get("resource_type"),
      region: form.get("region"),
      rights_confirmed: form.get("rights") === "on",
      topics: [],
    };
    try {
      const body = new FormData();
      body.set("metadata", JSON.stringify(metadata));
      body.set("file", file);
      const r = await knowledge<{ resource: KnowledgeResource; duplicate: boolean }>(
        file.size ? "/ingest" : "/resources",
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            ...(!file.size ? { "content-type": "application/json" } : {}),
          },
          body: file.size ? body : JSON.stringify(metadata),
        },
      );
      setResult(r.resource);
      setMessage(
        r.duplicate
          ? "Identical content already exists; no duplicate created."
          : "Stored successfully. Pending curator review.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <PublicShell>
      <PageHero
        eyebrow="Curator workspace"
        title="Add an original source"
        lead="Register metadata or store a permitted file. Files are format-checked and hashed; this is not an antivirus or scientific-truth certification."
      />
      <section className="mx-auto max-w-3xl px-4 py-10">
        <form onSubmit={submit} className="space-y-5 rounded-2xl border bg-white p-6">
          {[
            ["title", "Title"],
            ["source_owner", "Source owner / institution"],
            ["source_url", "Original source URL"],
            ["licence", "Licence / redistribution basis"],
          ].map(([name, label]) => (
            <label key={name} className="block text-sm">
              {label}
              <input
                required
                name={name}
                type={name === "source_url" ? "url" : "text"}
                maxLength={300}
                className="mt-2 w-full rounded-lg border p-3"
              />
            </label>
          ))}
          <label className="block text-sm">
            Description
            <textarea
              name="description"
              maxLength={10000}
              className="mt-2 min-h-28 w-full rounded-lg border p-3"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              Region
              <select name="region" className="mt-2 w-full rounded-lg border p-3">
                {["Antarctic", "Arctic", "Himalaya", "Southern Ocean", "Multiple"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Type
              <select name="resource_type" className="mt-2 w-full rounded-lg border p-3">
                {[
                  "report",
                  "publication",
                  "dataset",
                  "photo",
                  "video",
                  "expedition",
                  "activity",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm">
            File (optional, maximum 30 MB)
            <input
              name="file"
              type="file"
              accept=".pdf,.txt,.md,.csv,.jpg,.jpeg,.png,.webp,.mp4"
              className="mt-2 block w-full rounded-lg border p-3"
            />
          </label>
          <label className="flex gap-3 text-sm">
            <input name="rights" type="checkbox" />I have checked that this file may be stored and
            redistributed here.
          </label>
          <label className="block text-sm">
            Optional operator token (leave blank when signed in)
            <input
              type="password"
              autoComplete="off"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="mt-2 w-full rounded-lg border p-3"
            />
            <span className="text-xs text-muted-foreground">
              Researcher accounts can submit; only administrators can mark sources reviewed.
            </span>
          </label>
          <Button disabled={busy} type="submit">
            {busy ? "Extracting and storing…" : "Store source"}
          </Button>
          <p role="status">{message}</p>
          {result && (
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link to="/repository/$id" params={{ id: result.id }}>
                  Inspect stored evidence
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  try {
                    await knowledge(`/resources/${result.id}/review`, {
                      method: "POST",
                      headers: { authorization: `Bearer ${token}` },
                    });
                    setMessage(
                      "Marked curator-reviewed. The original file and text were preserved.",
                    );
                  } catch (e) {
                    setMessage(e instanceof Error ? e.message : "Review failed");
                  }
                }}
              >
                Mark reviewed after inspection
              </Button>
            </div>
          )}
        </form>
      </section>
    </PublicShell>
  );
}
