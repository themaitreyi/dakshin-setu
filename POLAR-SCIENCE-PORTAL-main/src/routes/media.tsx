import { createFileRoute } from "@tanstack/react-router";
import { KnowledgeCatalogue } from "@/features/repository/knowledge-catalogue";
export const Route = createFileRoute("/media")({ component: () => <KnowledgeCatalogue media /> });
