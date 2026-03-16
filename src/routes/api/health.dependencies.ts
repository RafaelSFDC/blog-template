import { createFileRoute } from "@tanstack/react-router";
import { getDependencyHealthStatus } from "#/server/system/health";

export const Route = createFileRoute("/api/health/dependencies")({
  server: {
    handlers: {
      GET: async () => Response.json(await getDependencyHealthStatus()),
    },
  },
});
