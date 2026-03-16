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

    expect(status.status).toBe("in_progress");
    expect(status.progressPercent).toBe(14);
    expect(status.nextAction?.step).toBe("seo");
    expect(status.lastStep).toBe("seo");
  });

  it("keeps setup as not_started before the first wizard entry", () => {
    const status = buildSetupStatus(createSnapshot());

    expect(status.status).toBe("not_started");
    expect(status.isBlocking).toBe(true);
    expect(status.nextAction?.step).toBe("identity");
  });

  it("treats skipped setup as in_progress without blocking redirects", () => {
    const status = buildSetupStatus(
      createSnapshot({
        wizardStartedAt: "2026-03-16T10:00:00.000Z",
        wizardSkippedAt: "2026-03-16T10:05:00.000Z",
      }),
    );

    expect(status.status).toBe("in_progress");
    expect(status.isSkipped).toBe(true);
    expect(status.isCompleted).toBe(false);
    expect(status.nextAction?.step).toBe("identity");
    expect(shouldRedirectToSetup(status, "admin")).toBe(false);
  });

  it("keeps lastStep aligned with the first blocking step while setup is incomplete", () => {
    const status = buildSetupStatus(
      createSnapshot({
        wizardStartedAt: "2026-03-16T10:00:00.000Z",
        wizardLastStep: "content",
        hasStoredBlogName: false,
      }),
    );

    expect(status.nextAction?.step).toBe("identity");
    expect(status.lastStep).toBe("identity");
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

  it("treats setup as effectively complete when the checklist has no blocking items", () => {
    const status = buildSetupStatus(
      createSnapshot({
        hasStoredBlogName: true,
        hasStoredBlogDescription: true,
        hasStoredThemeVariant: true,
        hasStoredFontFamily: true,
        hasStoredSiteUrl: true,
        hasStoredMetaTitle: true,
        hasStoredMetaDescription: true,
        hasStoredMonthlyPriceId: true,
        hasStoredAnnualPriceId: true,
        hasStoredNewsletterSenderEmail: true,
        hasStoredDoubleOptInSetting: true,
        hasHomepage: true,
        hasAboutPage: true,
        hasPricingPage: true,
        hasContactPage: true,
        hasFirstPost: true,
      }),
    );

    expect(status.status).toBe("completed");
    expect(status.progressPercent).toBe(100);
    expect(status.nextAction).toBeNull();
    expect(status.isCompleted).toBe(true);
  });

  it("treats explicitly completed setup as non-blocking even with remaining checklist work", () => {
    const status = buildSetupStatus(
      createSnapshot({
        wizardStartedAt: "2026-03-16T10:00:00.000Z",
        wizardCompletedAt: "2026-03-16T10:10:00.000Z",
        wizardLastStep: "content",
      }),
    );

    expect(status.status).toBe("completed");
    expect(status.isCompleted).toBe(true);
    expect(status.isBlocking).toBe(false);
    expect(status.lastStep).toBe("content");
    expect(status.nextAction).toBeNull();
  });

  it("redirects admins to setup until the wizard is completed or skipped", () => {
    expect(
      shouldRedirectToSetup(buildSetupStatus(createSnapshot()), "admin"),
    ).toBe(true);

    expect(
      shouldRedirectToSetup(buildSetupStatus(createSnapshot()), "super-admin"),
    ).toBe(true);

    expect(
      shouldRedirectToSetup(buildSetupStatus(createSnapshot()), "superAdmin"),
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

  it("does not redirect admins when setup no longer blocks first use", () => {
    const status = buildSetupStatus(
      createSnapshot({
        hasStoredBlogName: true,
        hasStoredBlogDescription: true,
        hasStoredThemeVariant: true,
        hasStoredFontFamily: true,
        hasStoredSiteUrl: true,
        hasStoredMetaTitle: true,
        hasStoredMetaDescription: true,
        hasStoredMonthlyPriceId: true,
        hasStoredAnnualPriceId: true,
        hasStoredNewsletterSenderEmail: true,
        hasStoredDoubleOptInSetting: true,
        hasHomepage: true,
        hasAboutPage: true,
        hasPricingPage: true,
        hasContactPage: true,
        hasFirstPost: true,
      }),
    );

    expect(shouldRedirectToSetup(status, "admin")).toBe(false);
  });
});
