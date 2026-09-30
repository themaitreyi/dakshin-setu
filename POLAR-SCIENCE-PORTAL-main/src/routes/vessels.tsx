import { createFileRoute } from "@tanstack/react-router";
import { KnowledgeCatalogue } from "@/features/repository/knowledge-catalogue";
export const Route = createFileRoute("/vessels")({
  component: () => <KnowledgeCatalogue title="Research vessels" topic="vessel" />,
});
