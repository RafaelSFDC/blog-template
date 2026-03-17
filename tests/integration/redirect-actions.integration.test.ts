import { describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { withIsolatedDatabase } from "../helpers/sqlite-test-db";

vi.mock("#/server/auth/session", () => ({
  requireAdminSession: vi.fn().mockResolvedValue({
    user: {
      id: "fixture-admin",
      email: "admin@lumina.test",
      role: "admin",
    },
  }),
}));

describe("redirect actions integration", () => {
  it("normalizes paths when creating and updating redirects", async () => {
    await withIsolatedDatabase("redirect-actions", async () => {
      const { db } = await import("#/db/index");
      const { redirects } = await import("#/db/schema");
      const { getRedirectByPath, saveRedirect } = await import("#/server/actions/content/redirect-actions");

      await saveRedirect({
        data: {
          sourcePath: "coverage-start/",
          destinationPath: "fixture-about/",
          statusCode: 302,
        },
      });

      const created = await db.query.redirects.findFirst({
        where: eq(redirects.sourcePath, "/coverage-start"),
      });

      expect(created?.sourcePath).toBe("/coverage-start");
      expect(created?.destinationPath).toBe("/fixture-about");
      expect(created?.statusCode).toBe(302);

      await saveRedirect({
        data: {
          id: created!.id,
          sourcePath: "/coverage-start/",
          destinationPath: "https://example.test/final-destination",
          statusCode: 301,
        },
      });

      const stored = await getRedirectByPath("/coverage-start/");
      expect(stored?.destinationPath).toBe("https://example.test/final-destination");
      expect(stored?.statusCode).toBe(301);
    });
  }, 15000);

  it("blocks redirect loops before persisting changes", async () => {
    await withIsolatedDatabase("redirect-loop", async () => {
      const { saveRedirect } = await import("#/server/actions/content/redirect-actions");

      await saveRedirect({
        data: {
          sourcePath: "/alpha",
          destinationPath: "/beta",
          statusCode: 301,
        },
      });

      await expect(
        saveRedirect({
          data: {
            sourcePath: "/beta",
            destinationPath: "/alpha",
            statusCode: 301,
          },
        }),
      ).rejects.toThrow("loop");
    });
  }, 15000);
});
