import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { knowledge, type KnowledgeResource } from "@/lib/knowledge";
import { Button } from "@/components/ui/button";
type Enquiry = { id: string; name: string; email: string; message: string; created_at: string };
export function CuratorConsole() {
  const [enquiries, setEnquiries] = useState<Enquiry[] | null>(null);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);
  const [items, setItems] = useState<KnowledgeResource[]>([]),
    [message, setMessage] = useState(""),
    [token, setToken] = useState("");
  const load = () =>
    knowledge<{ items: KnowledgeResource[] }>("/resources")
      .then((r) => setItems(r.items))
      .catch((e) => setMessage(e.message));
  useEffect(() => {
    void load();
  }, []);
  async function review(id: string) {
    try {
      await knowledge(`/resources/${id}/review`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      });
      setMessage("Review state saved. Original content was not altered.");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Review failed");
    }
  }
  async function loadEnquiries() {
    setLoadingEnquiries(true);
    setEnquiries(null);
    try {
      const result = await knowledge<Enquiry[]>("/enquiries", {
        headers: { authorization: `Bearer ${token}` },
      });
      setEnquiries(result);
      setMessage("Private enquiries loaded for this session only.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to load enquiries");
    } finally {
      setLoadingEnquiries(false);
    }
  }
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">Repository coverage & review</h1>
      <div className="my-7 grid gap-4 sm:grid-cols-3">
        {[
          ["Stored records", items.length],
          ["Original files", items.filter((r) => r.file_url).length],
          ["Pending review", items.filter((r) => r.verification !== "curator-reviewed").length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border bg-white p-5">
            <p className="text-3xl font-semibold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <label className="block text-sm">
        Optional operator token (your administrator session is used by default)
        <input
          type="password"
          autoComplete="off"
          value={token}
          onChange={(e) => {
            setToken(e.target.value);
            setEnquiries(null);
          }}
          className="mt-2 block w-full max-w-md rounded-lg border bg-white p-3"
        />
      </label>
      <p role="status" className="my-4 text-sm">
        {message}
      </p>
      <Button asChild className="mb-6">
        <Link to="/repository/upload">Ingest a source</Link>
      </Button>
      <div className="space-y-3">
        {items.map((r) => (
          <article
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-5"
          >
            <div>
              <Link to="/repository/$id" params={{ id: r.id }} className="font-semibold underline">
                {r.title}
              </Link>
              <p className="mt-1 text-xs text-muted-foreground">
                {r.region} · {r.verification} · {r.file_url ? "File stored" : "Metadata only"}
              </p>
            </div>
            {r.verification !== "curator-reviewed" && (
              <Button variant="outline" onClick={() => review(r.id)}>
                Mark reviewed after inspection
              </Button>
            )}
          </article>
        ))}
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        Review only after checking the original, attribution and rights. This deployment uses a
        local researcher/admin accounts, not institutional SSO.
      </p>
      <section className="mt-10 rounded-xl border bg-white p-6" aria-labelledby="enquiries-title">
        <h2 id="enquiries-title" className="text-xl font-semibold">
          Private project enquiries
        </h2>
        <p className="my-3 text-sm text-muted-foreground">
          Messages submitted through Contact are stored locally. Access requires administrator
          authorization; no email is sent automatically.
        </p>
        <div className="flex gap-3">
          <Button disabled={loadingEnquiries} onClick={loadEnquiries}>
            {loadingEnquiries ? "Loading…" : "Load enquiries"}
          </Button>
          {enquiries !== null && (
            <Button variant="outline" onClick={() => setEnquiries(null)}>
              Hide enquiries
            </Button>
          )}
        </div>
        {enquiries?.length === 0 && <p className="mt-4 text-sm">No enquiries stored yet.</p>}
        {enquiries?.map((entry) => (
          <article key={entry.id} className="mt-4 rounded-lg border p-4">
            <h3 className="font-semibold">{entry.name}</h3>
            <p className="break-all text-sm text-muted-foreground">
              {entry.email} · {entry.created_at}
            </p>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm">{entry.message}</p>
          </article>
        ))}
      </section>
    </section>
  );
}
