import { createServerFn } from "@tanstack/react-start";
import { count, desc, eq, inArray } from "drizzle-orm";
import { db } from "#/server/db/index";
import {
  betaOpsAccounts,
  betaOpsFeedback,
  contactMessages,
  user,
} from "#/server/db/schema";
import {
  betaOpsAccountCreateFromMessageSchema,
  betaOpsAccountUpdateSchema,
  betaOpsFeedbackCreateSchema,
  betaOpsFeedbackUpdateSchema,
} from "#/schemas";
import { requireAdminSession } from "#/server/auth/session";
import type { BetaAccountStage, BetaOnboardingStatus, OpsPriority } from "#/types/system";

type ContactMessageMetadata = {
  role?: string;
  publicationType?: string;
  currentStack?: string | null;
};

export function parseContactMessageMetadata(raw: string | null) {
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as ContactMessageMetadata;
  } catch {
    return {};
  }
}

function parseDateInput(value?: string) {
  return value ? new Date(`${value}T12:00:00.000Z`) : null;
}

export function buildBetaOpsAccountSeedFromMessage(message: {
  id: number;
  name: string;
  email: string;
  sourcePath: string | null;
  source: string | null;
  metadataJson: string | null;
}) {
  const metadata = parseContactMessageMetadata(message.metadataJson);

  return {
    contactMessageId: message.id,
    name: message.name,
    email: message.email,
    role: metadata.role ?? null,
    publicationType: metadata.publicationType ?? null,
    currentStack: metadata.currentStack ?? null,
    accountStage: "new_lead" as BetaAccountStage,
    onboardingStatus: "not_started" as BetaOnboardingStatus,
    priority: "medium" as OpsPriority,
    sourcePath: message.sourcePath,
    source: message.source,
    lastContactedAt: new Date(),
  };
}

async function getOpsOwners() {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
    .from(user)
    .where(inArray(user.role, ["admin", "super-admin", "editor"]));
}

export async function getBetaOpsDashboardData() {
  const [owners, accountsRaw, feedbackRaw, triageMessages, [accountCount], [blockedCount], [newFeedbackCount]] =
    await Promise.all([
      getOpsOwners(),
      db.select().from(betaOpsAccounts).orderBy(desc(betaOpsAccounts.updatedAt)),
      db.select().from(betaOpsFeedback).orderBy(desc(betaOpsFeedback.updatedAt)),
      db
        .select()
        .from(contactMessages)
        .where(eq(contactMessages.messageType, "beta_request"))
        .orderBy(desc(contactMessages.createdAt)),
      db.select({ value: count() }).from(betaOpsAccounts),
      db
        .select({ value: count() })
        .from(betaOpsAccounts)
        .where(eq(betaOpsAccounts.onboardingStatus, "blocked")),
      db
        .select({ value: count() })
        .from(betaOpsFeedback)
        .where(eq(betaOpsFeedback.status, "new")),
    ]);

  type OpsOwner = (typeof owners)[number];
  type BetaOpsAccount = (typeof accountsRaw)[number];
  type BetaOpsFeedbackItem = (typeof feedbackRaw)[number];
  type TriageMessage = (typeof triageMessages)[number];

  const ownerById = new Map<string, OpsOwner>(owners.map((owner: OpsOwner) => [owner.id, owner]));
  const feedbackByAccount = new Map<number, BetaOpsFeedbackItem[]>();

  for (const item of feedbackRaw) {
    if (!item.betaAccountId) {
      continue;
    }

    const current = feedbackByAccount.get(item.betaAccountId) ?? [];
    current.push(item);
    feedbackByAccount.set(item.betaAccountId, current);
  }

  const accountByContactMessageId = new Map<number, number>(
    accountsRaw
      .filter((account: BetaOpsAccount) => account.contactMessageId)
      .map((account: BetaOpsAccount) => [account.contactMessageId as number, account.id]),
  );

  const accounts = accountsRaw.map((account: BetaOpsAccount) => ({
    ...account,
    ownerName: account.ownerUserId ? ownerById.get(account.ownerUserId)?.name ?? null : null,
    feedbackItems: (feedbackByAccount.get(account.id) ?? []).map((item: BetaOpsFeedbackItem) => ({
      ...item,
      ownerName: item.ownerUserId ? ownerById.get(item.ownerUserId)?.name ?? null : null,
    })),
  }));

  return {
    owners,
    summary: {
      accountCount: accountCount.value || 0,
      blockedOnboarding: blockedCount.value || 0,
      newFeedbackCount: newFeedbackCount.value || 0,
      untriagedRequests: triageMessages.filter((message: TriageMessage) => !accountByContactMessageId.has(message.id))
        .length,
    },
    accounts,
    recentFeedback: feedbackRaw.slice(0, 8).map((item: BetaOpsFeedbackItem) => ({
      ...item,
      ownerName: item.ownerUserId ? ownerById.get(item.ownerUserId)?.name ?? null : null,
    })),
    triageMessages: triageMessages.map((message: TriageMessage) => {
      const metadata = parseContactMessageMetadata(message.metadataJson);
      return {
        ...message,
        linkedBetaAccountId: accountByContactMessageId.get(message.id) ?? null,
        metadata,
      };
    }),
  };
}

export const getBetaOpsDashboard = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession();
  return getBetaOpsDashboardData();
});

export async function promoteContactMessageToBetaOpsAccount(messageId: number) {
  const message = await db.query.contactMessages.findFirst({
    where: eq(contactMessages.id, messageId),
  });

  if (!message) {
    throw new Error("Message not found.");
  }

  const seed = buildBetaOpsAccountSeedFromMessage(message);
  const existing = await db.query.betaOpsAccounts.findFirst({
    where: eq(betaOpsAccounts.email, message.email),
  });

  if (existing) {
    await db
      .update(betaOpsAccounts)
      .set({
        contactMessageId: existing.contactMessageId ?? message.id,
        role: existing.role ?? seed.role,
        publicationType: existing.publicationType ?? seed.publicationType,
        currentStack: existing.currentStack ?? seed.currentStack,
        sourcePath: existing.sourcePath ?? seed.sourcePath,
        source: existing.source ?? seed.source,
        lastContactedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(betaOpsAccounts.id, existing.id));

    await db
      .update(contactMessages)
      .set({ status: "read" })
      .where(eq(contactMessages.id, message.id));

    return { success: true as const, id: existing.id };
  }

  const [created] = await db
    .insert(betaOpsAccounts)
    .values({
      ...seed,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  await db
    .update(contactMessages)
    .set({ status: "read" })
    .where(eq(contactMessages.id, message.id));

  return { success: true as const, id: created.id };
}

export async function updateBetaOpsAccountRecord(
  data: Awaited<ReturnType<typeof betaOpsAccountUpdateSchema.parse>>,
) {
  await db
    .update(betaOpsAccounts)
    .set({
      accountStage: data.accountStage,
      onboardingStatus: data.onboardingStatus,
      priority: data.priority,
      ownerUserId: data.ownerUserId ?? null,
      publicationName: data.publicationName ?? null,
      notes: data.notes ?? null,
      nextFollowUpAt: parseDateInput(data.nextFollowUpOn),
      updatedAt: new Date(),
    })
    .where(eq(betaOpsAccounts.id, data.id));

  return { success: true as const };
}

export async function createBetaOpsFeedbackRecord(
  data: Awaited<ReturnType<typeof betaOpsFeedbackCreateSchema.parse>>,
) {
  const [created] = await db
    .insert(betaOpsFeedback)
    .values({
      betaAccountId: data.betaAccountId,
      contactMessageId: data.contactMessageId ?? null,
      title: data.title,
      summary: data.summary,
      priority: data.priority,
      status: data.status,
      ownerUserId: data.ownerUserId ?? null,
      notes: data.notes ?? null,
      source: "ops_manual",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return { success: true as const, id: created.id };
}

export async function updateBetaOpsFeedbackRecord(
  data: Awaited<ReturnType<typeof betaOpsFeedbackUpdateSchema.parse>>,
) {
  await db
    .update(betaOpsFeedback)
    .set({
      status: data.status,
      priority: data.priority,
      ownerUserId: data.ownerUserId ?? null,
      notes: data.notes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(betaOpsFeedback.id, data.id));

  return { success: true as const };
}

export const promoteMessageToBetaOpsAccount = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => betaOpsAccountCreateFromMessageSchema.parse(input))
  .handler(async ({ data }) => {
    await requireAdminSession();
    return promoteContactMessageToBetaOpsAccount(data.messageId);
  });

export const updateBetaOpsAccount = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => betaOpsAccountUpdateSchema.parse(input))
  .handler(async ({ data }) => {
    await requireAdminSession();
    return updateBetaOpsAccountRecord(data);
  });

export const createBetaOpsFeedback = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => betaOpsFeedbackCreateSchema.parse(input))
  .handler(async ({ data }) => {
    await requireAdminSession();
    return createBetaOpsFeedbackRecord(data);
  });

export const updateBetaOpsFeedback = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => betaOpsFeedbackUpdateSchema.parse(input))
  .handler(async ({ data }) => {
    await requireAdminSession();
    return updateBetaOpsFeedbackRecord(data);
  });

export type BetaOpsDashboardData = Awaited<ReturnType<typeof getBetaOpsDashboard>>;

