import { createServerFn } from "@tanstack/react-start";

export function getTurnstileConfig() {
  const siteKey = process.env.TURNSTILE_SITE_KEY || "";
  const secretKey = process.env.TURNSTILE_SECRET_KEY || "";

  return {
    siteKey,
    secretKey,
    enabled: Boolean(siteKey && secretKey),
  };
}

export function getSecurityConfigAudit() {
  const turnstile = getTurnstileConfig();
  return {
    turnstileEnabled: turnstile.enabled,
    missingRequired: turnstile.enabled
      ? []
      : ["TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"],
    optionalWarnings: process.env.SECURITY_CONTACT_EMAIL
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
