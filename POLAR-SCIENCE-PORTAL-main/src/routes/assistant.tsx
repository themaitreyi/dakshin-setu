import { createFileRoute } from "@tanstack/react-router";
import { PublicShell, PageHero } from "@/components/site/public-shell";
import { EvidenceSearch } from "@/features/repository/evidence-search";
export const Route = createFileRoute("/assistant")({ component: Assistant });
function Assistant() {
  return (
    <PublicShell>
      <PageHero
        eyebrow="Ask Dakshinsetu"
        title="Find answers in the research."
        lead="Search source passages about Himadri, oceanography, sea ice and India's polar programmes."
      />
      <section className="mx-auto max-w-5xl px-5 py-10">
        <EvidenceSearch />
        <button
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white"
          onClick={() => window.dispatchEvent(new CustomEvent("open-polaris-ai"))}
        >
          Open AI assistant
        </button>
        <p className="mt-4 text-sm text-slate-600">
          Local catalogue search works without the knowledge service. AI generation requires the
          backend connection.
        </p>
      </section>
    </PublicShell>
  );
}
