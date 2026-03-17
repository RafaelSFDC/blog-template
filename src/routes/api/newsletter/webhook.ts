import { createFileRoute } from "@tanstack/react-router";
import { and, eq, gte } from "drizzle-orm";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "#/db/index";
import { securityEvents } from "#/db/schema";
import { processResendWebhook } from "#/server/newsletter-campaigns";
import { captureServerException } from "#/server/sentry";
import { logSecurityEvent } from "#/server/security/events";
import { sha256 } from "#/server/security/request";
import { logOperationalEvent } from "#/server/system/operations";

const SVIX_TOLERANCE_SECONDS = 60 * 5;
const REPLAY_WINDOW_MS = 24 * 60 * 60 * 1000;

type SvixHeaders = {
  id: string;
  timestamp: string;
  signature: string;
};

function parseSvixHeaders(request: Request): SvixHeaders | null {
  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");

  if (!id || !timestamp || !signature) {
    return null;
  }

  return { id, timestamp, signature };
}

function normalizeSvixSecret(secret: string) {
  const raw = secret.trim();
  return raw.startsWith("whsec_") ? raw.slice(6) : raw;
}

function computeSvixV1Signature(secret: string, signedPayload: string) {
  const normalized = normalizeSvixSecret(secret);
  const secretBytes = Buffer.from(normalized, "base64");
  return createHmac("sha256", secretBytes).update(signedPayload).digest("base64");
}

function hasMatchingV1Signature(expected: string, providedHeader: string) {
  const candidates = providedHeader
    .trim()
    .split(/\s+/)
    .map((value) => value.split(",").map((part) => part.trim()))
    .filter((parts): parts is [string, string] => parts.length === 2 && parts[0] === "v1")
    .map((parts) => parts[1]);

  const expectedBuffer = Buffer.from(expected);

  return candidates.some((candidate) => {
    const candidateBuffer = Buffer.from(candidate);
    return (
      candidateBuffer.length === expectedBuffer.length &&
      timingSafeEqual(candidateBuffer, expectedBuffer)
    );
  });
}

export function verifyResendWebhookRequest(input: {
  payload: string;
  headers: SvixHeaders;
  secret: string;
  now?: number;
}) {
  const timestamp = Number(input.headers.timestamp);

  if (!Number.isFinite(timestamp)) {
    return { valid: false as const, reason: "invalid_timestamp" as const };
  }

  const nowSeconds = Math.floor((input.now ?? Date.now()) / 1000);
  if (Math.abs(nowSeconds - timestamp) > SVIX_TOLERANCE_SECONDS) {
    return { valid: false as const, reason: "expired_timestamp" as const };
  }

  const signedPayload = `${input.headers.id}.${input.headers.timestamp}.${input.payload}`;
  const expected = computeSvixV1Signature(input.secret, signedPayload);
  const valid = hasMatchingV1Signature(expected, input.headers.signature);

  if (!valid) {
    return { valid: false as const, reason: "invalid_signature" as const };
  }

  return { valid: true as const };
}

async function hasReplayEvent(eventHash: string) {
  const cutoff = new Date(Date.now() - REPLAY_WINDOW_MS);
  const existing = await db.query.securityEvents.findFirst({
    where: and(
      eq(securityEvents.type, "webhook.replay_guard"),
      eq(securityEvents.scope, "newsletter.webhook"),
      eq(securityEvents.identifierHash, eventHash),
      gte(securityEvents.createdAt, cutoff),
    ),
    columns: { id: true },
  });

  return Boolean(existing);
}

export const Route = createFileRoute("/api/newsletter/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
          if (!webhookSecret) {
            await logSecurityEvent({
              type: "webhook.secret_missing",
              scope: "newsletter.webhook",
              metadata: { endpoint: "resend" },
              expiresAt: new Date(Date.now() + REPLAY_WINDOW_MS),
            });
            return new Response("Webhook secret is missing", { status: 500 });
          }

          const headers = parseSvixHeaders(request);
          if (!headers) {
            await logSecurityEvent({
              type: "webhook.missing_headers",
              scope: "newsletter.webhook",
              metadata: { endpoint: "resend" },
              expiresAt: new Date(Date.now() + REPLAY_WINDOW_MS),
            });
            return new Response("Missing webhook headers", { status: 400 });
          }

          const body = await request.text();
          const verification = verifyResendWebhookRequest({
            payload: body,
            headers,
            secret: webhookSecret,
          });

          if (!verification.valid) {
            await logSecurityEvent({
              type: "webhook.invalid_signature",
              scope: "newsletter.webhook",
              identifierHash: sha256(headers.id),
              metadata: {
                endpoint: "resend",
                reason: verification.reason,
              },
              expiresAt: new Date(Date.now() + REPLAY_WINDOW_MS),
            });
            return new Response("Invalid webhook signature", { status: 401 });
          }

          const replayHash = sha256(`${headers.id}:${headers.timestamp}`);
          if (await hasReplayEvent(replayHash)) {
            await logSecurityEvent({
              type: "webhook.replay_rejected",
              scope: "newsletter.webhook",
              identifierHash: replayHash,
              metadata: { endpoint: "resend" },
              expiresAt: new Date(Date.now() + REPLAY_WINDOW_MS),
            });
            return new Response("Replay webhook rejected", { status: 409 });
          }

          await logSecurityEvent({
            type: "webhook.replay_guard",
            scope: "newsletter.webhook",
            identifierHash: replayHash,
            metadata: { endpoint: "resend" },
            expiresAt: new Date(Date.now() + REPLAY_WINDOW_MS),
          });

          const payload = JSON.parse(body) as {
            type: string;
            created_at?: string;
            data?: {
              email_id?: string;
            };
          };

          const result = await processResendWebhook(payload);
          logOperationalEvent("newsletter-webhook-processed", {
            actor: "resend",
            entity: "newsletter.webhook",
            outcome: "success",
            type: payload.type,
            emailId: payload.data?.email_id ?? null,
            duplicate: result?.duplicate ?? false,
          });
          return Response.json(result);
        } catch (error) {
          captureServerException(error, {
            tags: {
              area: "api",
              flow: "newsletter-webhook",
            },
            extras: {
              requestUrl: request.url,
            },
          });
          logOperationalEvent("newsletter-webhook-failed", {
            actor: "resend",
            entity: "newsletter.webhook",
            outcome: "failure",
            reason: error instanceof Error ? error.message : String(error),
          }, "error");
          return new Response("Webhook processing failed", { status: 500 });
        }
      },
    },
  },
});
