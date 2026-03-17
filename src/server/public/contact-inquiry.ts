import { getRequest } from "@tanstack/react-start/server";
import { db } from "#/server/db/index";
import { contactMessages } from "#/server/db/schema";
import { verifyTurnstileToken } from "#/server/integrations/turnstile";
import { logSecurityEvent } from "#/server/security/events";
import { enforceRateLimit } from "#/server/security/rate-limit";
import { getSecurityRequestMetadata } from "#/server/security/request";
import type { SecurityScope } from "#/types/security";

export async function submitPublicInquiry(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
  turnstileToken: string;
  scope: SecurityScope;
  messageType?: "general" | "beta_request" | "ops_feedback";
  sourcePath?: string | null;
  source?: string | null;
  metadataJson?: string | null;
}) {
  const request = getRequest();
  if (!request) {
    throw new Error("Request context unavailable");
  }

  const decision = await enforceRateLimit({
    scope: input.scope,
    request,
    keyParts: [input.email.toLowerCase()],
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!decision.allowed) {
    throw new Error("Too many contact requests. Please try again later.");
  }

  const metadata = getSecurityRequestMetadata(request);
  const verification = await verifyTurnstileToken({
    token: input.turnstileToken,
    ip: metadata.ip,
  });

  if (!verification.success) {
    await logSecurityEvent({
      type: "turnstile.failed",
      scope: input.scope,
      ipHash: metadata.ipHash,
      userAgent: metadata.userAgentShort,
      metadata: {
        email: input.email.toLowerCase(),
        errors: verification.errors ?? [],
      },
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    throw new Error("Security verification failed. Please try again.");
  }

  await db.insert(contactMessages).values({
    name: input.name,
    email: input.email,
    subject: input.subject,
    message: input.message,
    messageType: input.messageType ?? "general",
    sourcePath: input.sourcePath ?? null,
    source: input.source ?? null,
    metadataJson: input.metadataJson ?? null,
    status: "new",
  });

  return { success: true as const };
}

