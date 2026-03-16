import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { db } from "#/db/index";
import { betaOpsAccounts, contactMessages } from "#/db/schema";
import { requireAdminSession } from "#/server/auth/session";
import { recordIdSchema } from "#/schemas";
import { z } from "zod";
import { parseContactMessageMetadata } from "#/server/dashboard/beta-ops";

const messageStatusUpdateSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["read", "archived", "new"]),
});

export const getDashboardMessages = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireAdminSession();
    const [messages, accounts] = await Promise.all([
      db.query.contactMessages.findMany({
        orderBy: desc(contactMessages.createdAt),
      }),
      db.query.betaOpsAccounts.findMany(),
    ]);

    const accountByContactMessageId = new Map(
      accounts
        .filter((account) => account.contactMessageId)
        .map((account) => [account.contactMessageId as number, account.id]),
    );

    return messages.map((message) => ({
      ...message,
      linkedBetaAccountId: accountByContactMessageId.get(message.id) ?? null,
      metadata: parseContactMessageMetadata(message.metadataJson),
    }));
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
