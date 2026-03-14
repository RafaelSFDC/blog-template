import type { ReactNode } from "react";
import { PostHogProvider } from "#/components/analytics/posthog-provider";
import { SentryProvider } from "#/components/analytics/sentry-provider";

export function ObservabilityProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SentryProvider>
      {import.meta.env.VITE_PUBLIC_POSTHOG_KEY ? (
        <PostHogProvider>{children}</PostHogProvider>
      ) : (
        children
      )}
    </SentryProvider>
  );
}
