import { createFileRoute } from "@tanstack/react-router";
import { CuratorConsole } from "@/features/repository/curator-console";
export const Route = createFileRoute("/admin/")({ component: CuratorConsole });
