import { createServerFn } from "@tanstack/react-start";

export function getTurnstileConfig(env: NodeJS.ProcessEnv = process.env) {
  const siteKey = env.TURNSTILE_SITE_KEY || "";
  const secretKey = env.TURNSTILE_SECRET_KEY || "";

  return {
    siteKey,
    secretKey,
    enabled: Boolean(siteKey && secretKey),
  };
}

export function getSecurityConfigAudit(env: NodeJS.ProcessEnv = process.env) {
  const turnstile = getTurnstileConfig(env);
  return {
    turnstileEnabled: turnstile.enabled,
    missingRequired: turnstile.enabled
      ? []
      : ["TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"],
    optionalWarnings: env.SECURITY_CONTACT_EMAIL
      ? []
      : ["SECURITY_CONTACT_EMAIL"],
  };
}

export const getPublicSecurityConfig = createServerFn({ method: "GET" }).handler(async () => {
  const turnstile = getTurnstileConfig();
  return {
    turnstileEnabled: turnstile.enabled,
    turnstileSiteKey: turnstile.siteKey || "",
  };
});
