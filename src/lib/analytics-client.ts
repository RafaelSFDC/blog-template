import { analyticsEventDefinitions, compactAnalyticsProperties, getLegacyEventNames, type AnalyticsEventName, type AnalyticsEventProperties } from "#/lib/analytics-events";

type PostHogLike = {
  capture: (event: string, properties?: Record<string, unknown>) => void;
};

export function captureClientEvent(
  posthog: PostHogLike | null | undefined,
  event: AnalyticsEventName,
  properties: AnalyticsEventProperties = {},
) {
  if (!posthog) {
    return;
  }

  const payload = compactAnalyticsProperties(properties);
  posthog.capture(event, payload);

  for (const legacyEvent of getLegacyEventNames(event)) {
    posthog.capture(legacyEvent, payload);
  }
}

export function isKnownAnalyticsEvent(value: string): value is AnalyticsEventName {
  return value in analyticsEventDefinitions;
}
