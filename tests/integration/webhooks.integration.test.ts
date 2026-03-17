import { describe, expect, it, vi } from "vitest";
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

describe("webhooks integration", () => {
  it("creates, toggles, lists, and deletes dashboard webhooks", async () => {
    await withIsolatedDatabase("webhooks", async () => {
      const { db } = await import("#/db/index");
      const {
        createDashboardWebhook,
        deleteDashboardWebhook,
        toggleDashboardWebhook,
      } = await import("#/server/dashboard/webhooks");

      await createDashboardWebhook({
        data: {
          name: "Coverage Hook",
          url: "https://example.test/coverage",
          event: "post.published",
          secret: "coverage-secret",
        },
      });

      let hooks = await db.query.webhooks.findMany();
      expect(hooks).toHaveLength(1);
      expect(hooks[0]).toMatchObject({
        name: "Coverage Hook",
        isActive: true,
      });

      await toggleDashboardWebhook({
        data: {
          id: hooks[0].id,
          isActive: false,
        },
      });

      hooks = await db.query.webhooks.findMany();
      expect(hooks[0]?.isActive).toBe(false);

      await deleteDashboardWebhook({ data: { id: hooks[0].id } as never });

      hooks = await db.query.webhooks.findMany();
      expect(hooks).toHaveLength(0);
    });
  }, 15000);
});
