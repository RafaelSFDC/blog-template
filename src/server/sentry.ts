import * as Sentry from "@sentry/cloudflare";
import { getBinding } from "#/server/system/cf-env";
import {
  normalizeError,
  normalizeObservabilityTags,
  type ObservabilityContext,
} from "#/lib/observability";

type WorkerSentryEnv = {
  SENTRY_DSN?: string;
  SENTRY_ENVIRONMENT?: string;
  SENTRY_TRACES_SAMPLE_RATE?: string;
  SENTRY_RELEASE?: string;
};

function getServerEnvValue(
  key: keyof WorkerSentryEnv,
  env?: WorkerSentryEnv,
) {
  return env?.[key] || getBinding<string>(key) || process.env[key];
}

export function getWorkerSentryOptions(env?: WorkerSentryEnv) {
  const dsn = getServerEnvValue("SENTRY_DSN", env);
  if (!dsn) {
    return { enabled: false as const };
  }

  const tracesSampleRate = Number(
    getServerEnvValue("SENTRY_TRACES_SAMPLE_RATE", env) || "0",
  );

  return {
    dsn,
    enabled: true,
    sendDefaultPii: true,
    environment:
      getServerEnvValue("SENTRY_ENVIRONMENT", env) ||
      process.env.NODE_ENV ||
      "development",
    release: getServerEnvValue("SENTRY_RELEASE", env),
    tracesSampleRate: Number.isNaN(tracesSampleRate) ? 0 : tracesSampleRate,
  };
}

export function hasServerSentry() {
  return Boolean(getWorkerSentryOptions().enabled);
}

export function captureServerException(
  error: unknown,
  context: ObservabilityContext = {},
) {
  if (!hasServerSentry()) {
    return;
  }

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
