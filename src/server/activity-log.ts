import { db } from "#/db/index";
import { activityLogs } from "#/db/schema";

interface LogActivityInput {
  actorUserId?: string | null;
  entityType: string;
  entityId: string | number;
  action: string;
  summary: string;
  metadata?: Record<string, unknown> | null;
}

export async function logActivity(input: LogActivityInput) {
  await db.insert(activityLogs).values({
    actorUserId: input.actorUserId ?? null,
    entityType: input.entityType,
    entityId: String(input.entityId),
    action: input.action,
    summary: input.summary,
    metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
    createdAt: new Date(),
  });
}
