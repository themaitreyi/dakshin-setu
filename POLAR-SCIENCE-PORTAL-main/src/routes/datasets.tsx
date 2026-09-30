import { createFileRoute } from "@tanstack/react-router";
import { KnowledgeCatalogue } from "@/features/repository/knowledge-catalogue";
export const Route = createFileRoute("/datasets")({
  component: () => <KnowledgeCatalogue title="Scientific datasets" kinds={["dataset"]} />,
});
