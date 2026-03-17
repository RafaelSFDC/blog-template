import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { withIsolatedDatabase } from "../helpers/sqlite-test-db";

describe("beta ops integration", () => {
  it("promotes a beta request, updates the account, and logs feedback", async () => {
    await withIsolatedDatabase("beta-ops", async () => {
      const { db } = await import("#/db/index");
      const {
        betaOpsAccounts,
        contactMessages,
        user,
      } = await import("#/db/schema");
      const {
        createBetaOpsFeedbackRecord,
        getBetaOpsDashboardData,
        promoteContactMessageToBetaOpsAccount,
        updateBetaOpsAccountRecord,
        updateBetaOpsFeedbackRecord,
      } = await import("#/server/dashboard/beta-ops");

      await db.insert(user).values({
        id: "ops-owner",
        name: "Ops Owner",
        email: "ops@example.com",
        role: "admin",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const [message] = await db
        .insert(contactMessages)
        .values({
          name: "Launch Founder",
          email: "founder@example.com",
          subject: "[Lumina Beta] creator · independent_newsletter",
          message: "Need help with launch setup and pricing clarity.",
          messageType: "beta_request",
          sourcePath: "/lumina/beta",
          source: "beta_form_submit",
          metadataJson: JSON.stringify({
            role: "creator",
            publicationType: "independent_newsletter",
            currentStack: "Ghost and Mailchimp",
          }),
          status: "new",
          createdAt: new Date(),
        })
        .returning();

      const promoted = await promoteContactMessageToBetaOpsAccount(message.id);

      expect(promoted.success).toBe(true);

      const createdAccount = await db.query.betaOpsAccounts.findFirst({
        where: eq(betaOpsAccounts.email, "founder@example.com"),
      });

      expect(createdAccount).toMatchObject({
        accountStage: "new_lead",
        onboardingStatus: "not_started",
        priority: "medium",
        role: "creator",
      });

      await updateBetaOpsAccountRecord({
        id: createdAccount!.id,
        accountStage: "qualified",
        onboardingStatus: "in_progress",
        priority: "high",
        ownerUserId: "ops-owner",
        publicationName: "Launch Weekly",
        notes: "Qualified and moving into assisted onboarding.",
        nextFollowUpOn: "2026-03-22",
      });

      const feedback = await createBetaOpsFeedbackRecord({
        betaAccountId: createdAccount!.id,
        title: "Needs clearer onboarding checklist",
        summary: "The founder wants a more explicit first-week beta onboarding flow.",
        priority: "high",
        status: "new",
        ownerUserId: "ops-owner",
        notes: "Potential doc + product issue.",
      });

      await updateBetaOpsFeedbackRecord({
        id: feedback.id,
        status: "planned",
        priority: "high",
        ownerUserId: "ops-owner",
        notes: "Added to launch ops backlog.",
      });

      const dashboard = await getBetaOpsDashboardData();

      expect(dashboard.summary.accountCount).toBe(1);
      expect(dashboard.summary.untriagedRequests).toBe(0);
      expect(dashboard.accounts[0]).toMatchObject({
        email: "founder@example.com",
        accountStage: "qualified",
        onboardingStatus: "in_progress",
        priority: "high",
        ownerName: "Ops Owner",
      });
      expect(dashboard.accounts[0].feedbackItems[0]).toMatchObject({
        title: "Needs clearer onboarding checklist",
        status: "planned",
        priority: "high",
      });
    });
  }, 15000);
});
