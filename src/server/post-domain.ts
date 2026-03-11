import type { InferSelectModel } from "drizzle-orm";
import { posts } from "#/db/schema";
import type { z } from "zod";
import { postServerSchema } from "#/lib/cms-schema";

export type PostInput = z.infer<typeof postServerSchema>;
export type PostRow = InferSelectModel<typeof posts>;

export function resolvePostPublishedAt(
  status: PostInput["status"],
  requestedPublishedAt: Date | undefined,
  existingPublishedAt?: Date | null,
) {
  if (status === "scheduled") {
    return requestedPublishedAt;
  }

  if (status === "published") {
    return existingPublishedAt ?? new Date();
  }

  return undefined;
}

export function shouldTriggerPublishedWebhook(
  previousStatus: PostInput["status"] | undefined,
  nextStatus: PostInput["status"],
) {
  return previousStatus !== "published" && nextStatus === "published";
}

export function isScheduledPostDue(post: Pick<PostRow, "status" | "publishedAt">, now: Date) {
  return (
    post.status === "scheduled" &&
    post.publishedAt instanceof Date &&
    post.publishedAt.getTime() <= now.getTime()
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
