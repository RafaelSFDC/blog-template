import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getLegacySocialLinks,
  mapSettingsRowsToFormValues,
  normalizeSettingsFormValues,
  settingsFormSchema,
} from "#/lib/settings-form";

describe("settings-form", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("falls back to legacy social profile keys when socialLinks is absent", () => {
    const values = mapSettingsRowsToFormValues([
      { key: "blogName", value: "Lumina" },
      { key: "twitterProfile", value: "https://x.com/lumina" },
      { key: "githubProfile", value: "https://github.com/lumina" },
    ]);

    expect(values.socialLinks).toEqual([
      { platform: "x", url: "https://x.com/lumina" },
      { platform: "github", url: "https://github.com/lumina" },
    ]);
  });

  it("prefers stored socialLinks JSON over legacy profile fields", () => {
    const values = mapSettingsRowsToFormValues([
      {
        key: "socialLinks",
        value: JSON.stringify([
          { platform: "linkedin", url: "https://linkedin.com/company/lumina" },
        ]),
      },
      { key: "twitterProfile", value: "https://x.com/legacy-lumina" },
    ]);

    expect(values.socialLinks).toEqual([
      { platform: "linkedin", url: "https://linkedin.com/company/lumina" },
    ]);
  });

  it("normalizes whitespace before persisting settings form values", () => {
    const payload = normalizeSettingsFormValues({
      blogName: "  Lumina  ",
      blogDescription: "  Editorial platform  ",
      blogLogo: "  https://cdn.example.com/logo.png  ",
      fontFamily: "  Sora  ",
      themeVariant: "  default  ",
      siteUrl: "  https://lumina.example.com  ",
      defaultMetaTitle: "  Lumina  ",
      defaultMetaDescription: "  Better publishing workflows.  ",
      defaultOgImage: "  https://cdn.example.com/og.png  ",
      twitterHandle: "  @lumina  ",
      stripeMonthlyPriceId: "  price_monthly_123  ",
      stripeAnnualPriceId: "  price_annual_456  ",
      newsletterSenderEmail: "  editorial@example.com  ",
      doubleOptInEnabled: true,
      membershipGracePeriodDays: 5,
      robotsIndexingEnabled: true,
      socialLinks: [
        { platform: "  x  ", url: "  https://x.com/lumina  " },
      ],
    });

    expect(payload).toEqual({
      blogName: "Lumina",
      blogDescription: "Editorial platform",
      blogLogo: "https://cdn.example.com/logo.png",
      fontFamily: "Sora",
      themeVariant: "default",
      siteUrl: "https://lumina.example.com",
      defaultMetaTitle: "Lumina",
      defaultMetaDescription: "Better publishing workflows.",
      defaultOgImage: "https://cdn.example.com/og.png",
      twitterHandle: "@lumina",
      stripeMonthlyPriceId: "price_monthly_123",
      stripeAnnualPriceId: "price_annual_456",
      newsletterSenderEmail: "editorial@example.com",
      doubleOptInEnabled: true,
      membershipGracePeriodDays: 5,
      robotsIndexingEnabled: true,
      socialLinks: [{ platform: "x", url: "https://x.com/lumina" }],
    });
  });

  it("builds legacy social links only from keys that are actually present", () => {
    expect(
      getLegacySocialLinks({
        twitterProfile: "https://x.com/lumina",
      }),
    ).toEqual([{ platform: "x", url: "https://x.com/lumina" }]);
  });

  it("returns sensible defaults when settings rows are missing", () => {
    const values = mapSettingsRowsToFormValues([]);

    expect(values).toMatchObject({
      blogName: "Lumina",
      blogDescription: "An elegant premium blog for creators.",
      fontFamily: "Inter",
      themeVariant: "default",
      siteUrl: "",
      defaultMetaTitle: "",
      defaultMetaDescription: "",
      defaultOgImage: "",
      twitterHandle: "",
      stripeMonthlyPriceId: "",
      stripeAnnualPriceId: "",
      newsletterSenderEmail: "",
      doubleOptInEnabled: false,
      membershipGracePeriodDays: 3,
      robotsIndexingEnabled: true,
      socialLinks: [],
    });
  });

  it("ignores invalid stored socialLinks json without crashing", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const values = mapSettingsRowsToFormValues([
      { key: "socialLinks", value: "{not-json" },
      { key: "blogName", value: "Lumina" },
    ]);

    expect(values.socialLinks).toEqual([]);
    expect(values.blogName).toBe("Lumina");
  });

  it("rejects invalid settings payloads for urls, emails, and numeric limits", () => {
    const result = settingsFormSchema.safeParse({
      blogName: "Lumina",
      blogDescription: "Fixture description",
      blogLogo: "not-a-url",
      fontFamily: "Inter",
      themeVariant: "default",
      siteUrl: "still-not-a-url",
      defaultMetaTitle: "Meta",
      defaultMetaDescription: "Description",
      defaultOgImage: "bad-url",
      twitterHandle: "@lumina",
      stripeMonthlyPriceId: "",
      stripeAnnualPriceId: "",
      newsletterSenderEmail: "not-an-email",
      doubleOptInEnabled: true,
      membershipGracePeriodDays: 99,
      robotsIndexingEnabled: true,
      socialLinks: [{ platform: "x", url: "bad-url" }],
    });

    expect(result.success).toBe(false);
    expect(result.error.flatten().fieldErrors.blogLogo).toBeTruthy();
    expect(result.error.flatten().fieldErrors.siteUrl).toBeTruthy();
    expect(result.error.flatten().fieldErrors.defaultOgImage).toBeTruthy();
    expect(result.error.flatten().fieldErrors.newsletterSenderEmail).toBeTruthy();
    expect(result.error.flatten().fieldErrors.membershipGracePeriodDays).toBeTruthy();
    expect(result.error.flatten().fieldErrors.socialLinks).toBeTruthy();
  });
});
