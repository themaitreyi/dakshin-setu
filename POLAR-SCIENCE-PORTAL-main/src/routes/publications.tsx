import { createFileRoute } from "@tanstack/react-router";
import { KnowledgeCatalogue } from "@/features/repository/knowledge-catalogue";
export const Route = createFileRoute("/publications")({
  component: () => (
    <KnowledgeCatalogue
      title="Publications & expedition reports"
      kinds={["publication", "report"]}
    />
  ),
});
