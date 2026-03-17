import { getLegacyEventNames, compactAnalyticsProperties, type AnalyticsEventName, type AnalyticsEventProperties } from "#/lib/analytics-events";

export async function captureServerEvent(input: {
  distinctId: string;
  event: AnalyticsEventName;
  properties?: AnalyticsEventProperties;
}) {
  const key =
    process.env.VITE_PUBLIC_POSTHOG_KEY || import.meta.env.VITE_PUBLIC_POSTHOG_KEY;

  if (!key) {
    return;
  }

  const payload = compactAnalyticsProperties(input.properties ?? {});
  const host =
    process.env.VITE_PUBLIC_POSTHOG_HOST ||
    import.meta.env.VITE_PUBLIC_POSTHOG_HOST ||
    "https://app.posthog.com";
  const isDefaultExternalHost = /posthog\.com/i.test(host);
  const isProduction = process.env.NODE_ENV === "production";

  // Local and test environments should not block workflows on outbound analytics.
  if (!isProduction && isDefaultExternalHost && !process.env.VITE_PUBLIC_POSTHOG_HOST) {
    return;
  }

  try {
    await fetch(`${host}/capture/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: key,
        distinct_id: input.distinctId,
        event: input.event,
        properties: payload,
      }),
    });

    for (const legacyEvent of getLegacyEventNames(input.event)) {
      await fetch(`${host}/capture/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: key,
          distinct_id: input.distinctId,
          event: legacyEvent,
          properties: payload,
        }),
      });
    }
  } catch (error) {
    console.error(`Failed to capture analytics event "${input.event}"`, error);
  }
}

export async function queryPostHog<T>(query: unknown): Promise<T> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.VITE_POSTHOG_PROJECT_ID;
  const host = process.env.VITE_POSTHOG_HOST || "https://app.posthog.com";

  if (!apiKey || !projectId) {
    throw new Error("PostHog is not configured");
  }

  const response = await fetch(`${host}/api/projects/${projectId}/query/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`PostHog API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}
