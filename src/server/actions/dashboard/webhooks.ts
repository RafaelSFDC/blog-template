import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { db } from "#/server/db/index";
import { webhooks } from "#/server/db/schema";
import { requireAdminSession } from "#/server/auth/session";
import {
  getFriendlyDbError,
  recordIdSchema,
  webhookCreateSchema,
  webhookToggleSchema,
} from "#/schemas";

export const getDashboardWebhooks = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireAdminSession();
    return db.query.webhooks.findMany({
      orderBy: [desc(webhooks.createdAt)],
    });
  },
);

export const createDashboardWebhook = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => webhookCreateSchema.parse(input))
  .handler(async ({ data }) => {
    await requireAdminSession();

    try {
      await db.insert(webhooks).values({
        name: data.name,
        url: data.url,
        event: data.event,
        secret: data.secret || null,
        isActive: true,
        createdAt: new Date(),
      });
      return { success: true as const };
    } catch (error) {
      throw new Error(getFriendlyDbError(error, "Webhook") || "Failed to create webhook");
    }
  });

export const deleteDashboardWebhook = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => recordIdSchema.parse({ id: input }))
  .handler(async ({ data }) => {
    await requireAdminSession();
    await db.delete(webhooks).where(eq(webhooks.id, data.id));
    return { success: true as const };
  });

export const toggleDashboardWebhook = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => webhookToggleSchema.parse(input))
  .handler(async ({ data }) => {
    await requireAdminSession();
    await db
      .update(webhooks)
      .set({ isActive: data.isActive })
      .where(eq(webhooks.id, data.id));
    return { success: true as const };
  });

