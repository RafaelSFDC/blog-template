import { assertSafeExternalUrl } from "#/lib/url-security";

export type RuntimeEnvironment =
  | "development"
  | "test"
  | "staging"
  | "production"
  | string;

type EnvRecord = NodeJS.ProcessEnv;

const DEFAULT_DEV_BASE_URL = "http://localhost:3000";
const DEFAULT_DEV_NEWSLETTER_SECRET = "dev-newsletter-token-secret";
const STRICT_ENVIRONMENTS = new Set(["production", "staging"]);

export function getRuntimeEnvironment(env: EnvRecord = process.env): RuntimeEnvironment {
  return env.ENVIRONMENT || env.NODE_ENV || "development";
}

export function isStrictEnvironment(env: EnvRecord = process.env) {
  return STRICT_ENVIRONMENTS.has(getRuntimeEnvironment(env));
}

function normalizeUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

export function resolveExternalBaseUrl(input: {
  envVarName: string;
  env?: EnvRecord;
  label?: string;
  devFallback?: string;
}) {
  const env = input.env ?? process.env;
  const runtime = getRuntimeEnvironment(env);
  const strict = isStrictEnvironment(env);
  const configured = env[input.envVarName]?.trim();
  const fallback = input.devFallback ?? DEFAULT_DEV_BASE_URL;

  if (!configured) {
    if (strict) {
      throw new Error(`${input.envVarName} is required in ${runtime} environment.`);
    }

    return normalizeUrl(fallback);
  }

  const normalized = normalizeUrl(configured);
  assertSafeExternalUrl(normalized, {
    allowLocalHttp: !strict,
    label: input.label ?? input.envVarName,
  });

  return normalized;
}

export function resolveNewsletterTokenSecret(env: EnvRecord = process.env) {
  const runtime = getRuntimeEnvironment(env);
  const strict = isStrictEnvironment(env);
  const resolved =
    env.NEWSLETTER_TOKEN_SECRET || env.BETTER_AUTH_SECRET || env.AUTH_SECRET;

  if (resolved?.trim()) {
    return resolved.trim();
  }

  if (strict) {
    throw new Error(
      `NEWSLETTER_TOKEN_SECRET (or BETTER_AUTH_SECRET/AUTH_SECRET) is required in ${runtime}.`,
    );
  }

  return DEFAULT_DEV_NEWSLETTER_SECRET;
}

export function resolveStripeSecretKey(env: EnvRecord = process.env) {
  const runtime = getRuntimeEnvironment(env);
  const strict = isStrictEnvironment(env);
  const key = env.STRIPE_SECRET_KEY?.trim();

  if (key) {
    return key;
  }

  if (strict) {
    throw new Error(`STRIPE_SECRET_KEY is required in ${runtime} environment.`);
  }

  // Non-production fallback for local development and unit tests.
  return "sk_test_dev_only_do_not_use";
}

