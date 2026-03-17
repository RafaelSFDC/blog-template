import type { InferSelectModel } from "drizzle-orm";
import { posts } from "#/server/db/schema";
import type { z } from "zod";
import { postServerSchema } from "#/schemas/editorial";

export type PostInput = z.infer<typeof postServerSchema>;
export type PostRow = InferSelectModel<typeof posts>;

export function resolvePostPublishedAt(
  status: PostInput["status"],
  _requestedScheduledAt: Date | undefined,
  existingPublishedAt?: Date | null,
) {
  if (status === "published") {
    return existingPublishedAt ?? new Date();
  }

  return undefined;
}

export function resolvePostScheduledAt(
  status: PostInput["status"],
  requestedScheduledAt: Date | undefined,
) {
  if (status === "scheduled") {
    return requestedScheduledAt;
  }

  return undefined;
}

export function shouldTriggerPublishedWebhook(
  previousStatus: PostInput["status"] | undefined,
  nextStatus: PostInput["status"],
) {
  return previousStatus !== "published" && nextStatus === "published";
}

export function hasConflictingSlug(conflictingPostId: number | undefined, currentPostId?: number) {
  return conflictingPostId !== undefined && conflictingPostId !== currentPostId;
}

export function getSlugConflictMessage(entityName: string) {
  return `${entityName} slug already exists`;
}

export function isScheduledPostDue(
  post: Pick<PostRow, "status" | "scheduledAt">,
  now: Date,
) {
  return (
    post.status === "scheduled" &&
    post.scheduledAt instanceof Date &&
    post.scheduledAt.getTime() <= now.getTime()
  );
}

export function getCronSecretConfig(
  providedSecret: string | undefined,
  nodeEnv = process.env.NODE_ENV,
) {
  const isProduction = nodeEnv === "production";

  if (providedSecret && providedSecret.trim()) {
    return { secret: providedSecret, required: true };
  }

  if (isProduction) {
    return { secret: undefined, required: true };
  }

  return { secret: "dev-secret", required: false };
}

export function isAuthorizedCronRequest(
  requestSecret: string | null,
  config: ReturnType<typeof getCronSecretConfig>,
) {
  if (!config.secret) {
    return false;
  }

  return requestSecret === config.secret;
}

