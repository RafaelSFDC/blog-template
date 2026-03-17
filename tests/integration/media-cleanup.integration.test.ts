import { describe, expect, it, vi } from "vitest";
import { withIsolatedDatabase } from "../helpers/sqlite-test-db";

const mocks = vi.hoisted(() => ({
  deleteObject: vi.fn(),
}));

vi.mock("#/server/editorial/access", () => ({
  requireMediaAccess: vi.fn().mockResolvedValue({
    session: {
      user: {
        id: "editor-user",
        role: "editor",
      },
    },
  }),
  requireMediaReadAccess: vi.fn().mockResolvedValue({
    session: {
      user: {
        id: "editor-user",
        role: "editor",
      },
    },
    canReadAll: true,
  }),
}));

vi.mock("#/server/system/storage", () => ({
  deleteObject: mocks.deleteObject,
  putObject: vi.fn(),
  sanitizeMediaFilename: vi.fn((name: string) => name),
}));

describe("media cleanup integration", () => {
  it("finds and removes orphaned media while keeping referenced assets", async () => {
    await withIsolatedDatabase("media-cleanup", async () => {
      const { db } = await import("#/db/index");
      const { media, user } = await import("#/db/schema");
      const { cleanupOrphanedMedia } = await import("#/server/actions/content/media-actions");

      await db.insert(user).values({
        id: "editor-user",
        name: "Editor User",
        email: "editor@lumina.test",
        emailVerified: true,
        role: "editor",
      });

      const [orphan] = await db
        .insert(media)
        .values({
          url: "https://cdn.test/orphan.jpg",
          filename: "orphan.jpg",
          mimeType: "image/jpeg",
          size: 1024,
          ownerId: null,
        })
        .returning();

      const [kept] = await db
        .insert(media)
        .values({
          url: "https://cdn.test/kept.jpg",
          filename: "kept.jpg",
          mimeType: "image/jpeg",
          size: 1024,
          ownerId: "editor-user",
        })
        .returning();

      await cleanupOrphanedMedia({ data: { dryRun: true } });
      const afterDryRun = await db.select().from(media);
      expect(afterDryRun.map((item) => item.id)).toContain(orphan.id);
      expect(afterDryRun.map((item) => item.id)).toContain(kept.id);

      await cleanupOrphanedMedia({ data: { dryRun: false } });
      expect(mocks.deleteObject).toHaveBeenCalledWith("orphan.jpg");

      const remaining = await db.select().from(media);
      expect(remaining.map((item) => item.id)).toContain(kept.id);
      expect(remaining.map((item) => item.id)).not.toContain(orphan.id);
    });
  }, 15000);
});
