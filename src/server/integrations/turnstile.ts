import type { TurnstileVerificationResult } from "#/types/security";
import { getTurnstileConfig } from "#/server/actions/security/config";

export async function verifyTurnstileToken(input: {
  token: string;
  ip?: string | null;
}): Promise<TurnstileVerificationResult> {
  const config = getTurnstileConfig();
  if (!config.enabled) {
    return { success: true, bypassed: true };
  }

  if (!input.token.trim()) {
    return { success: false, errors: ["missing-input-response"] };
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: config.secretKey,
        response: input.token,
        remoteip: input.ip ?? "",
      }),
    },
  );

  const payload = (await response.json()) as {
    success?: boolean;
    "error-codes"?: string[];
  };

  return {
    success: Boolean(payload.success),
    errors: payload["error-codes"] ?? [],
  };
}

