import { describe, expect, it } from "vitest";
import {
  buildSetupChecklist,
  buildSetupStatus,
  shouldRedirectToSetup,
  type SetupSnapshot,
} from "#/lib/setup";

function createSnapshot(overrides: Partial<SetupSnapshot> = {}): SetupSnapshot {
  return {
    hasStoredBlogName: false,
    hasStoredBlogDescription: false,
    hasStoredLogo: false,
    hasStoredThemeVariant: false,
    hasStoredFontFamily: false,
    hasStoredSiteUrl: false,
    hasStoredMetaTitle: false,
    hasStoredMetaDescription: false,
    hasStoredOgImage: false,
    hasStoredTwitterHandle: false,
    hasStoredMonthlyPriceId: false,
    hasStoredAnnualPriceId: false,
    hasStoredNewsletterSenderEmail: false,
    hasStoredDoubleOptInSetting: false,
    hasHomepage: false,
    hasAboutPage: false,
    hasPricingPage: false,
    hasContactPage: false,
    hasFirstPost: false,
    wizardStartedAt: null,
    wizardCompletedAt: null,
    wizardSkippedAt: null,
    wizardLastStep: null,
    starterContentGeneratedAt: null,
    ...overrides,
  };
}

describe("setup", () => {
  it("calculates checklist completion from stored state", () => {
    const checklist = buildSetupChecklist(
      createSnapshot({
        hasStoredBlogName: true,
        hasStoredBlogDescription: true,
        hasStoredThemeVariant: true,
        hasStoredFontFamily: true,
        hasStoredSiteUrl: true,
        hasStoredMetaTitle: true,
        hasStoredMetaDescription: true,
      }),
    );

    expect(checklist.find((item) => item.key === "identity")?.isCompleted).toBe(true);
    expect(checklist.find((item) => item.key === "seo")?.isCompleted).toBe(true);
    expect(checklist.find((item) => item.key === "pricing")?.isCompleted).toBe(false);
  });

  it("builds progress and next action from incomplete setup", () => {
    const status = buildSetupStatus(
      createSnapshot({
        wizardStartedAt: "2026-03-16T10:00:00.000Z",
        hasStoredBlogName: true,
        hasStoredBlogDescription: true,
        hasStoredThemeVariant: true,
        hasStoredFontFamily: true,
      }),
    );

    expect(status.progressPercent).toBe(14);
    expect(status.nextAction?.step).toBe("seo");
    expect(status.lastStep).toBe("seo");
  });

  it("marks content step complete when starter content was generated", () => {
    const status = buildSetupStatus(
      createSnapshot({
        starterContentGeneratedAt: "2026-03-16T10:00:00.000Z",
      }),
    );

    expect(status.steps.find((step) => step.key === "content")?.isCompleted).toBe(true);
    expect(status.starterContentGenerated).toBe(true);
  });

  it("redirects admins to setup until the wizard is completed or skipped", () => {
    expect(
      shouldRedirectToSetup(buildSetupStatus(createSnapshot()), "admin"),
    ).toBe(true);

    expect(
      shouldRedirectToSetup(
        buildSetupStatus(createSnapshot({ wizardSkippedAt: "2026-03-16T10:00:00.000Z" })),
        "admin",
      ),
    ).toBe(false);

    expect(
      shouldRedirectToSetup(buildSetupStatus(createSnapshot()), "author"),
    ).toBe(false);
  });
});
