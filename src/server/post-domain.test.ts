import { describe, expect, it } from "vitest";
import {
  getCronSecretConfig,
  getSlugConflictMessage,
  hasConflictingSlug,
  isAuthorizedCronRequest,
  isScheduledPostDue,
  resolvePostPublishedAt,
  shouldTriggerPublishedWebhook,
} from "#/server/post-domain";

describe("post-domain", () => {
  it("publishes immediately when a post becomes published", () => {
    const now = new Date("2026-03-11T10:00:00.000Z");
    const publishedAt = resolvePostPublishedAt("published", undefined, undefined);

    expect(publishedAt).toBeInstanceOf(Date);
    expect((publishedAt as Date).getTime()).toBeGreaterThanOrEqual(now.getTime() - 1000);
  });

  it("keeps scheduled publication date intact", () => {
    const scheduledFor = new Date("2026-03-12T10:00:00.000Z");

    expect(resolvePostPublishedAt("scheduled", scheduledFor, undefined)).toEqual(scheduledFor);
  });

  it("detects due scheduled posts only", () => {
    const now = new Date("2026-03-11T12:00:00.000Z");

    expect(
      isScheduledPostDue(
        { status: "scheduled", publishedAt: new Date("2026-03-11T11:59:00.000Z") },
        now,
      ),
    ).toBe(true);

    expect(
      isScheduledPostDue(
        { status: "published", publishedAt: new Date("2026-03-11T11:59:00.000Z") },
        now,
      ),
    ).toBe(false);
  });

  it("requires an explicit secret in production", () => {
    expect(getCronSecretConfig(undefined, "production")).toEqual({
      secret: undefined,
      required: true,
    });
  });

  it("uses the dev fallback secret locally and validates it", () => {
    const config = getCronSecretConfig(undefined, "development");

    expect(config).toEqual({ secret: "dev-secret", required: false });
    expect(isAuthorizedCronRequest("dev-secret", config)).toBe(true);
    expect(isAuthorizedCronRequest("wrong-secret", config)).toBe(false);
  });

  it("only triggers the published webhook on first publication", () => {
    expect(shouldTriggerPublishedWebhook(undefined, "published")).toBe(true);
    expect(shouldTriggerPublishedWebhook("draft", "published")).toBe(true);
    expect(shouldTriggerPublishedWebhook("published", "published")).toBe(false);
  });

  it("detects slug conflicts without flagging the same post", () => {
    expect(hasConflictingSlug(12)).toBe(true);
    expect(hasConflictingSlug(12, 12)).toBe(false);
    expect(hasConflictingSlug(undefined, 12)).toBe(false);
  });

  it("builds a friendly slug conflict message", () => {
    expect(getSlugConflictMessage("Post")).toBe("Post slug already exists");
  });
});
