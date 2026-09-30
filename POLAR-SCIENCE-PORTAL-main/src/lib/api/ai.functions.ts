import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
export const askDakshinsetu = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ query: z.string().trim().min(2).max(1200) }).parse(input),
  )
  .handler(async ({ data }) => {
    const response = await fetch(
      `${process.env["POLAR_API_URL"] || "http://127.0.0.1:4000"}/api/v1/ask`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(40000),
      },
    );
    if (!response.ok) throw new Error("Knowledge service unavailable");
    return (await response.json()) as {
      answer: string;
      status: string;
      provider: string;
      is_draft: boolean;
      evidence: Array<{
        document_id: string;
        chunk_id: string;
        page: number | null;
        section: string;
        lexical_score: number;
      }>;
    };
  });
