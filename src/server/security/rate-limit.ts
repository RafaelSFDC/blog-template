import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "#/db/index";
import { rateLimitEvents } from "#/db/schema";
import type { RateLimitDecision, SecurityScope } from "#/types/security";
import { getSecurityRequestMetadata, sha256 } from "#/server/security/request";
import { logSecurityEvent } from "#/server/security/events";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function buildRateLimitIdentifier(input: {
  request: Request;
  keyParts?: Array<string | null | undefined>;
}) {
  const metadata = getSecurityRequestMetadata(input.request);
  const parts = [
    metadata.ip ?? "unknown-ip",
    metadata.userAgentShort ?? "unknown-ua",
    ...(input.keyParts ?? []).filter(
      (part): part is string => typeof part === "string" && part.trim().length > 0,
    ),
  ];
  return {
    raw: parts.join("|"),
    hash: sha256(parts.join("|")),
    metadata,
  };
}

export async function enforceRateLimit(input: {
  scope: SecurityScope;
  request: Request;
  keyParts?: Array<string | null | undefined>;
  limit: number;
  windowMs: number;
}): Promise<RateLimitDecision> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - input.windowMs);
  const expiresAt = new Date(now.getTime() + THIRTY_DAYS_MS);
  const identifier = buildRateLimitIdentifier({
    request: input.request,
    keyParts: input.keyParts,
  });

  const [{ total }] = await db
    .select({ total: count() })
    .from(rateLimitEvents)
    .where(
      and(
        eq(rateLimitEvents.scope, input.scope),
        eq(rateLimitEvents.identifierHash, identifier.hash),
        gte(rateLimitEvents.createdAt, windowStart),
      ),
    );

  const remaining = Math.max(input.limit - total - 1, 0);
  const resetAt = new Date(now.getTime() + input.windowMs);
  const retryAfterSeconds = Math.max(Math.ceil(input.windowMs / 1000), 1);

  await db.insert(rateLimitEvents).values({
    scope: input.scope,
    identifierHash: identifier.hash,
    keyJson: JSON.stringify(input.keyParts ?? []),
    createdAt: now,
    expiresAt,
  });

  if (total >= input.limit) {
    await logSecurityEvent({
      type: "rate_limit.hit",
      scope: input.scope,
      identifierHash: identifier.hash,
      ipHash: identifier.metadata.ipHash,
      userAgent: identifier.metadata.userAgentShort,
      metadata: {
        limit: input.limit,
        windowMs: input.windowMs,
      },
      expiresAt,
    });

    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfterSeconds,
    };
  }

  return {
    allowed: true,
    remaining,
    resetAt,
    retryAfterSeconds,
  };
}

export async function cleanupExpiredRateLimitEvents(now = new Date()) {
  const result = await db
    .delete(rateLimitEvents)
    .where(lte(rateLimitEvents.expiresAt, now))
    .returning({ id: rateLimitEvents.id });

  await db
    .delete(rateLimitEvents)
    .where(sql`${rateLimitEvents.expiresAt} IS NULL`);

  return result.length;
}
