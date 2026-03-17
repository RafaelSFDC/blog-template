import { describe, expect, it, vi } from "vitest";
import { withIsolatedDatabase } from "../helpers/sqlite-test-db";

const mocks = vi.hoisted(() => ({
  putObject: vi.fn().mockResolvedValue({
    storageMode: "local",
    filename: "saved-file.jpg",
    publicUrl: "/uploads/saved-file.jpg",
  }),
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
  deleteObject: vi.fn(),
  putObject: mocks.putObject,
  sanitizeMediaFilename: vi.fn((name: string) => name),
}));

describe("media upload validation integration", () => {
  it("rejects extension mismatch and keeps DB unchanged", async () => {
    await withIsolatedDatabase("media-upload-extension-mismatch", async () => {
      const { db } = await import("#/db/index");
      const { media, user } = await import("#/db/schema");
      const { uploadMedia } = await import("#/server/actions/content/media-actions");

      await db.insert(user).values({
        id: "editor-user",
        name: "Editor User",
        email: "editor@lumina.test",
        emailVerified: true,
        role: "editor",
      });

      const formData = new FormData();
      formData.set(
        "file",
        new File([new Uint8Array([1, 2, 3, 4])], "photo.png", { type: "image/jpeg" }),
      );
      formData.set("altText", "Photo alt");

      await expect(uploadMedia({ data: formData })).rejects.toThrow(
        "File extension does not match the uploaded file type",
      );

      expect(mocks.putObject).not.toHaveBeenCalled();
      const rows = await db.select().from(media);
      expect(rows.length).toBe(0);
    });
  }, 15000);
});
