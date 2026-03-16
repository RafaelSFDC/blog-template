import { createServerFn } from "@tanstack/react-start";
import { requireAdminSession } from "#/server/auth/session";

// Hashing and manual DB tracking removed in favor of PostHog

export const getAnalyticsStats = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireAdminSession();

    const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
    const projectId = process.env.VITE_POSTHOG_PROJECT_ID;
    const host = process.env.VITE_POSTHOG_HOST || "https://app.posthog.com";

    const isConfigured = !!apiKey && !!projectId;

    if (!isConfigured) {
      console.warn(
        "PostHog API Key or Project ID missing. Returning empty stats.",
      );
      return {
        isConfigured: false,
        totalViews: 0,
        totalVisitors: 0,
        viewsPerDay: [],
        topPages: [],
        browsers: [],
        devices: [],
      };
    }

    interface PostHogTrendsResult {
      results: Array<{
        count: number;
        data: number[];
        labels: string[];
      }>;
    }

    const posthogQuery = async <T>(query: unknown): Promise<T> => {
      const response = await fetch(`${host}/api/projects/${projectId}/query/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });
      if (!response.ok) {
        throw new Error(`PostHog API error: ${response.statusText}`);
      }
      return response.json() as Promise<T>;
    };

    try {
      // 1. Total Views & Visitors (Trends)
      const trendsRes = (await posthogQuery({
        kind: "TrendsQuery",
        series: [
          { event: "$pageview", math: "total" },
          { event: "$pageview", math: "unique_group", math_group: "person" },
        ],
        dateRange: { date_from: "-30d" },
        interval: "day",
      })) as PostHogTrendsResult;

      const pageviewData = trendsRes.results[0];
      const uniqueData = trendsRes.results[1];

      const totalViews = pageviewData.count;
      const totalVisitors = uniqueData.count;

      const viewsPerDay = pageviewData.data.map((count: number, i: number) => ({
        date: pageviewData.labels[i],
        count,
      }));

      // 2. Top Pages (HogQL)
      const topPagesRes = (await posthogQuery({
        kind: "HogQLQuery",
        query:
          "SELECT properties.$pathname, count() as count FROM events WHERE event = '$pageview' GROUP BY properties.$pathname ORDER BY count DESC LIMIT 10",
      })) as { results: Array<[string, number]> };

      const topPages = topPagesRes.results.map((row) => ({
        pathname: row[0],
        count: row[1],
      }));

      // 3. Browsers
      const browsersRes = (await posthogQuery({
        kind: "HogQLQuery",
        query:
          "SELECT properties.$browser, count() as count FROM events WHERE event = '$pageview' GROUP BY properties.$browser ORDER BY count DESC LIMIT 5",
      })) as { results: Array<[string, number]> };
      const browsers = browsersRes.results.map((row) => ({
        name: row[0],
        count: row[1],
      }));

      // 4. Devices
      const devicesRes = (await posthogQuery({
        kind: "HogQLQuery",
        query:
          "SELECT properties.$device_type, count() as count FROM events WHERE event = '$pageview' GROUP BY properties.$device_type ORDER BY count DESC",
      })) as { results: Array<[string | null, number]> };
      const devices = devicesRes.results.map((row) => ({
        name: row[0] || "Desktop",
        count: row[1],
      }));

      return {
        isConfigured: true,
        totalViews,
        totalVisitors,
        viewsPerDay,
        topPages,
        browsers,
        devices,
      };
    } catch (error) {
      console.error("Failed to fetch PostHog stats:", error);
      return {
        isConfigured: true,
        totalViews: 0,
        totalVisitors: 0,
        viewsPerDay: [],
        topPages: [],
        browsers: [],
        devices: [],
      };
    }
  },
);
