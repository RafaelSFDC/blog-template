import * as Sentry from "@sentry/react";
import {
  normalizeError,
  normalizeObservabilityTags,
  type ObservabilityContext,
  type ObservabilityUser,
} from "#/lib/observability";

let isClientSentryInitialized = false;

function getClientSentryDsn() {
  return import.meta.env.VITE_PUBLIC_SENTRY_DSN;
}

export function hasClientSentry() {
  return Boolean(getClientSentryDsn());
}

export function initClientSentry() {
  if (isClientSentryInitialized || !hasClientSentry()) {
    return;
  }

  Sentry.init({
    dsn: getClientSentryDsn(),
    enabled: true,
    environment: import.meta.env.MODE,
    sendDefaultPii: true,
  });

  isClientSentryInitialized = true;
}

export function setClientSentryUser(user: ObservabilityUser | null) {
  if (!hasClientSentry()) {
    return;
  }

  initClientSentry();
  Sentry.setUser(user);
}

export function captureClientException(
  error: unknown,
  context: ObservabilityContext = {},
) {
  if (!hasClientSentry()) {
    return;
  }

  initClientSentry();

  Sentry.withScope((scope) => {
    const tags = normalizeObservabilityTags(context.tags);
    if (tags) {
      scope.setTags(tags);
    }

    if (context.extras) {
      scope.setExtras(context.extras);
    }

    if (context.user) {
      scope.setUser(context.user);
    }

    if (context.fingerprint) {
      scope.setFingerprint(context.fingerprint);
    }

    Sentry.captureException(normalizeError(error));
  });
}
