import { createFileRoute } from "@tanstack/react-router";
import { KnowledgeCatalogue } from "@/features/repository/knowledge-catalogue";
export const Route = createFileRoute("/activities")({
  component: () => (
    <KnowledgeCatalogue
      title="Activities & research programmes"
      kinds={["activity"]}
      topic="programme"
    />
  ),
});
