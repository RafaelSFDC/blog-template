import { db } from "#/server/db/index";
import { securityEvents } from "#/server/db/schema";

export async function logSecurityEvent(input: {
  type: string;
  scope?: string | null;
  identifierHash?: string | null;
  ipHash?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  expiresAt?: Date | null;
}) {
  await db.insert(securityEvents).values({
    type: input.type,
    scope: input.scope ?? null,
    identifierHash: input.identifierHash ?? null,
    ipHash: input.ipHash ?? null,
    userAgent: input.userAgent ?? null,
    metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
    createdAt: new Date(),
    expiresAt: input.expiresAt ?? null,
  });
}

