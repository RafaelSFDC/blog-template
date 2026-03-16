import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { db } from "#/db/index";
import { contactMessages } from "#/db/schema";
import { requireAdminSession } from "#/lib/admin-auth";
import { recordIdSchema } from "#/schemas";
import { z } from "zod";

const messageStatusUpdateSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["read", "archived", "new"]),
});

export const getDashboardMessages = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireAdminSession();
    return db.query.contactMessages.findMany({
      orderBy: desc(contactMessages.createdAt),
    });
  },
);

export const updateDashboardMessageStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => messageStatusUpdateSchema.parse(input))
  .handler(async ({ data }) => {
    await requireAdminSession();
    await db
      .update(contactMessages)
      .set({ status: data.status })
      .where(eq(contactMessages.id, data.id));
    return { success: true as const };
  });

export const deleteDashboardMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => recordIdSchema.parse({ id: input }))
  .handler(async ({ data }) => {
    await requireAdminSession();
    await db.delete(contactMessages).where(eq(contactMessages.id, data.id));
    return { success: true as const };
  });
