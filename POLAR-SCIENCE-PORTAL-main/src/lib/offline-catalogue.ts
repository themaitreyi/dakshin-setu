import type { KnowledgeResource } from "./knowledge";
export async function catalogue(): Promise<KnowledgeResource[]> {
  const response = await fetch("/catalogue/records.json");
  if (!response.ok) throw new Error("The bundled catalogue could not be loaded.");
  return (await response.json()).items;
}
export async function offlineRead(path: string, options?: RequestInit): Promise<unknown> {
  const items = await catalogue();
  if (path === "/resources" || path === "/datasets")
    return {
      items: path === "/datasets" ? items.filter((x) => x.resource_type === "dataset") : items,
    };
  if (/^\/resources\/[a-f0-9]{24}$/.test(path)) {
    const item = items.find((x) => x.id === path.split("/")[2]);
    if (item) return item;
  }
  if (path === "/search") {
    const query = JSON.parse(String(options?.body || "{}")).query || "";
    const terms = query
      .toLowerCase()
      .replace(/himadari/g, "himadri")
      .split(/\W+/)
      .filter((x: string) => x.length > 2);
    const hits = items
      .flatMap((resource) =>
        (resource.chunks || []).map((c) => ({
          ...c,
          resource,
          snippet: c.text,
          semantic_score: null,
          lexical_score: terms.filter((t: string) =>
            (c.text + " " + resource.title).toLowerCase().includes(t),
          ).length,
        })),
      )
      .filter((c) => c.lexical_score > 0)
      .sort((a, b) => b.lexical_score - a.lexical_score)
      .slice(0, 12);
    return { hits, retrieval_mode: "local catalogue text search" };
  }
  throw new Error("This action needs the knowledge service. Start the backend and try again.");
}
