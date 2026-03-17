import { describe, expect, it } from "vitest";
import {
  betaOpsAccountUpdateSchema,
  betaOpsFeedbackCreateSchema,
} from "#/schemas";
import { buildBetaOpsAccountSeedFromMessage } from "#/server/actions/dashboard/beta-ops";

describe("beta ops", () => {
  it("parses canonical account and feedback enums", () => {
    expect(
      betaOpsAccountUpdateSchema.parse({
        id: 1,
        accountStage: "qualified",
        onboardingStatus: "in_progress",
        priority: "high",
        ownerUserId: "fixture-admin",
        publicationName: "Calm Dispatch",
        notes: "Need launch help",
        nextFollowUpOn: "2026-03-20",
      }),
    ).toMatchObject({
      accountStage: "qualified",
      onboardingStatus: "in_progress",
      priority: "high",
    });

    expect(
      betaOpsFeedbackCreateSchema.parse({
        betaAccountId: 1,
        title: "Pricing confusion",
        summary: "The founder could not tell what beta onboarding changes in paid rollout.",
        priority: "medium",
        status: "reviewed",
      }),
    ).toMatchObject({
      priority: "medium",
      status: "reviewed",
    });
  });

  it("maps beta request contact metadata into an ops account seed", () => {
    const seed = buildBetaOpsAccountSeedFromMessage({
      id: 42,
      name: "Beta Founder",
      email: "beta-founder@example.com",
      sourcePath: "/lumina/beta",
      source: "beta_form_submit",
      metadataJson: JSON.stringify({
        role: "creator",
        publicationType: "independent_newsletter",
        currentStack: "Ghost and Mailchimp",
      }),
    });

    expect(seed).toMatchObject({
      contactMessageId: 42,
      email: "beta-founder@example.com",
      role: "creator",
      publicationType: "independent_newsletter",
      currentStack: "Ghost and Mailchimp",
      accountStage: "new_lead",
      onboardingStatus: "not_started",
      priority: "medium",
    });
  });
});

