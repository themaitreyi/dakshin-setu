import { createFileRoute } from "@tanstack/react-router";
async function proxy({ request }: { request: Request }) {
  const url = new URL(request.url);
  const standard =
    /^\/api\/v1\/(health|resources(?:\/[a-f0-9]{24}(?:\/(?:file|review))?)?|auth\/(?:login|logout|register|me)|datasets|search|ask|generate|ingest|drafts\/[a-f0-9]{24}|enquiries)$/;
  const productionCore =
    /^\/api\/v1\/(catalog\/(?:summary|station|vessel|expedition|dataset|publication|report|media)(?:\/[^?#]+)?|media-assets\/[A-Za-z0-9_-]+|document-assets\/.+|record-(?:json|pdf)\/(?:station|vessel|expedition|dataset|publication|report|media)\/.+)$/;
  if (!standard.test(url.pathname) && !productionCore.test(url.pathname))
    return new Response("Not found", { status: 404 });
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 31 * 1024 * 1024)
    return Response.json({ detail: "Request too large" }, { status: 413 });
  const headers = new Headers();
  for (const key of [
    "content-type",
    "authorization",
    "range",
    "if-range",
    "cookie",
    "x-requested-with",
  ]) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }
  try {
    let body: ArrayBuffer | undefined;
    if (request.method === "POST" && request.body) {
      const reader = request.body.getReader();
      const parts: Uint8Array<ArrayBuffer>[] = [];
      let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 31 * 1024 * 1024) {
          await reader.cancel();
          return Response.json({ detail: "Request too large" }, { status: 413 });
        }
        parts.push(new Uint8Array(value));
      }
      body = await new Blob(parts).arrayBuffer();
    }
    const response = await fetch(
      `${process.env["POLAR_API_URL"] || "http://127.0.0.1:4000"}${url.pathname}${url.search}`,
      {
        method: request.method,
        headers,
        ...(body ? { body } : {}),
        signal: AbortSignal.timeout(60000),
        redirect: "error",
      },
    );
    const outgoing = new Headers();
    for (const key of [
      "content-type",
      "content-range",
      "accept-ranges",
      "content-disposition",
      "content-security-policy",
      "set-cookie",
    ]) {
      const value = response.headers.get(key);
      if (value) outgoing.set(key, value);
    }
    outgoing.set("X-Content-Type-Options", "nosniff");
    outgoing.set("Cache-Control", "no-store");
    return new Response(response.body, { status: response.status, headers: outgoing });
  } catch {
    return Response.json({ detail: "Knowledge service unavailable" }, { status: 503 });
  }
}
export const Route = createFileRoute("/api/v1/$")({
  server: { handlers: { GET: proxy, POST: proxy } },
});
