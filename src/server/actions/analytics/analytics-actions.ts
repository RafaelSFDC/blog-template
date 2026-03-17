import { createServerFn } from "@tanstack/react-start";
import { analyticsRangeSchema } from "#/lib/analytics-events";
import { requireAdminSession } from "#/server/auth/session";
import { getAnalyticsDashboard } from "#/server/analytics-dashboard";

export const getAnalyticsStats = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    analyticsRangeSchema
      .optional()
      .parse(typeof input === "string" || input === undefined ? input : undefined),
  )
  .handler(async ({ data }) => {
    await requireAdminSession();

    try {
      return await getAnalyticsDashboard(data);
    } catch (error) {
      console.error("Failed to fetch PostHog analytics dashboard:", error);
      return {
        isConfigured: true,
        range: data ?? "30d",
        rangeOptions: [
          { value: "7d" as const, label: "Last 7 days" },
          { value: "30d" as const, label: "Last 30 days" },
          { value: "90d" as const, label: "Last 90 days" },
        ],
        sections: null,
        error: "Analytics data is temporarily unavailable.",
      };
    }
  });
