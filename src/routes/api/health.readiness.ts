import { createFileRoute } from "@tanstack/react-router";
import { getReadinessStatus } from "#/server/system/health";

export const Route = createFileRoute("/api/health/readiness")({
  server: {
    handlers: {
      GET: async () => {
        const readiness = await getReadinessStatus();
        return Response.json(readiness, {
          status: readiness.status === "failed" ? 503 : 200,
        });
      },
    },
  },
});
