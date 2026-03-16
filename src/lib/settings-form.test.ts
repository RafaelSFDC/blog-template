import { describe, expect, it } from "vitest";
import {
  getLegacySocialLinks,
  mapSettingsRowsToFormValues,
  normalizeSettingsFormValues,
} from "#/lib/settings-form";

describe("settings-form", () => {
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
});
