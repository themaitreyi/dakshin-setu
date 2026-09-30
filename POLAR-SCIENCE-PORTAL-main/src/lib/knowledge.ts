import { offlineRead } from "./offline-catalogue";
export interface Evidence {
  document_id: string;
  chunk_id: string;
  page: number | null;
  section: string;
  text: string;
  lexical_score?: number;
}
export interface KnowledgeResource {
  id: string;
  title: string;
  resource_type: string;
  region: string;
  description: string;
  source_url: string;
  source_owner: string;
  licence: string;
  verification: string;
  sha256: string;
  created_at: string;
  extraction_status: string;
  safety_status: string;
  file_url: string | null;
  mime_type: string | null;
  chunk_count: number;
  chunks?: Evidence[];
  topics: string[];
}
export async function knowledge<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  headers.set("X-Requested-With", "Dakshinsetu");
  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      ...options,
      headers,
      credentials: "same-origin",
      signal: options?.signal || AbortSignal.timeout(12000),
    });
  } catch (error) {
    if (
      (!options?.method || options.method === "GET" || path === "/search") &&
      (path.startsWith("/resources") || path === "/datasets" || path === "/search")
    )
      return (await offlineRead(path, options)) as T;
    throw error;
  }
  if (
    response.status >= 500 &&
    (path.startsWith("/resources") || path === "/datasets" || path === "/search")
  )
    return (await offlineRead(path, options)) as T;
  if (!response.ok) {
    const data = await response.json().catch(() => ({ detail: "Knowledge service unavailable" }));
    throw new Error(
      typeof data.detail === "string" ? data.detail : "Please check the submitted fields",
    );
  }
  return response.json();
}
