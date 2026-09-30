import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, PublicShell } from "@/components/site/public-shell";
export const Route = createFileRoute("/about")({
  component: () => (
    <PublicShell>
      <PageHero
        eyebrow="About Dakshinsetu"
        title="A bridge between scientific records and public understanding"
        lead="An independent SIH 2026 project focused on India's Antarctic, Arctic and Himalayan research footprint."
      />
      <section className="mx-auto max-w-4xl space-y-8 px-4 py-12">
        {[
          [
            "Preserve the source",
            "Original uploaded files are content-hashed and stored separately from generated drafts. PDF evidence retains physical page numbers; absent metadata stays absent.",
          ],
          [
            "Make evidence inspectable",
            "Search returns text passages and document identifiers. Local semantic similarity and BM25 help discovery; neither is a scientific-truth score.",
          ],
          [
            "Communicate responsibly",
            "Gemini, when configured, receives retrieved evidence rather than permission to invent an answer. Drafts require human review. Without Gemini, the site returns labelled source excerpts.",
          ],
          [
            "Be honest about coverage",
            "The starter catalogue is not an exhaustive inventory. It includes metadata-only records and reusable NASA media. Restricted files need permission, and offline collections must be contributed by their owners.",
          ],
          [
            "Deployment boundaries",
            "This project is not operated or endorsed by NCPOR. Local researcher and administrator accounts use server-side sessions. Institutional SSO, OCR, antivirus scanning and a validated large-corpus retrieval benchmark remain future work.",
          ],
        ].map(([title, text]) => (
          <article key={title} className="depth-card rounded-2xl border bg-white p-7">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{text}</p>
          </article>
        ))}
        <Link to="/observatory" className="text-cyan-800 underline">
          View actual repository coverage
        </Link>
      </section>
    </PublicShell>
  ),
});
