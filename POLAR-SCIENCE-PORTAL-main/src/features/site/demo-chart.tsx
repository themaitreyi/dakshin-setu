import { useEffect, useState } from "react";
import { catalogue } from "@/lib/offline-catalogue";
import type { KnowledgeResource } from "@/lib/knowledge";
export function DemoChart() {
  const [items, setItems] = useState<KnowledgeResource[]>([]),
    [group, setGroup] = useState<"region" | "resource_type">("region");
  useEffect(() => {
    catalogue()
      .then(setItems)
      .catch(() => {});
  }, []);
  const counts = items.reduce<Record<string, number>>((a, r) => {
    a[r[group]] = (a[r[group]] || 0) + 1;
    return a;
  }, {});
  function download() {
    const blob = new Blob(
      [
        "category,records\n" +
          Object.entries(counts)
            .map((x) => x.join(","))
            .join("\n"),
      ],
      { type: "text/csv" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dakshinsetu-catalogue-counts.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="rounded-2xl border bg-white p-7">
      <h2 className="text-2xl font-bold">Explore the collection</h2>
      <p className="my-3 text-sm text-slate-600">
        Number of source records in the bundled catalogue.
      </p>
      <div className="mb-6 flex gap-3">
        <select
          aria-label="Chart grouping"
          className="rounded-lg border p-2"
          value={group}
          onChange={(e) => setGroup(e.target.value as typeof group)}
        >
          <option value="region">By region</option>
          <option value="resource_type">By resource type</option>
        </select>
        <button className="rounded-lg bg-blue-600 px-4 text-white" onClick={download}>
          Download CSV
        </button>
      </div>
      {Object.entries(counts).map(([name, n]) => (
        <div key={name} className="my-4">
          <div className="mb-1 flex justify-between text-sm">
            <span>{name}</span>
            <strong>{n}</strong>
          </div>
          <div className="h-5 rounded bg-sky-50">
            <div
              className="h-5 rounded bg-gradient-to-r from-sky-400 to-blue-600"
              style={{ width: (100 * n) / Math.max(...Object.values(counts)) + "%" }}
            />
          </div>
        </div>
      ))}
    </section>
  );
}
