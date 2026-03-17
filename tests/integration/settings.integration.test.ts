import { describe, expect, it, vi } from "vitest";
import { withIsolatedDatabase } from "../helpers/sqlite-test-db";

vi.mock("#/server/auth/session", () => ({
  requireAdminSession: vi.fn().mockResolvedValue({
    user: {
      id: "fixture-admin",
      email: "admin@lumina.test",
      role: "admin",
    },
  }),
}));

describe("settings integration", () => {
  it("round-trips dashboard settings into stored public site data", async () => {
    await withIsolatedDatabase("settings-actions", async () => {
      const { db } = await import("#/db/index");
      const { appSettings } = await import("#/db/schema");
      const { mapSettingsRowsToFormValues } = await import("#/lib/settings-form");
      const { updateDashboardSettings } = await import(
        "#/server/system/settings"
      );
      const { getGlobalSiteData } = await import("#/server/system/site-data");

      await updateDashboardSettings({
        data: {
          blogName: "Signal Ledger",
          blogDescription: "Coverage-ready publication for local testing.",
          blogLogo: "https://example.test/logo.png",
          fontFamily: "Space Grotesk",
          themeVariant: "theme-lumina",
          siteUrl: "https://signal-ledger.test",
          defaultMetaTitle: "Signal Ledger Home",
          defaultMetaDescription: "Local coverage without external services.",
          defaultOgImage: "https://example.test/og.png",
          twitterHandle: "@signalledger",
          stripeMonthlyPriceId: "price_monthly_fixture",
          stripeAnnualPriceId: "price_annual_fixture",
          newsletterSenderEmail: "newsletter@signalledger.test",
          doubleOptInEnabled: true,
          membershipGracePeriodDays: 7,
          robotsIndexingEnabled: false,
          socialLinks: [
            {
              platform: "github",
              url: "https://github.com/signal-ledger",
            },
            {
              platform: "linkedin",
              url: "https://linkedin.com/company/signal-ledger",
            },
          ],
        },
      });

      const storedRows = await db.select().from(appSettings);
      const dashboard = mapSettingsRowsToFormValues(
        storedRows.map((row) => ({
          key: row.key,
          value: row.value ?? "",
        })),
      );

      expect(dashboard).toMatchObject({
        blogName: "Signal Ledger",
        blogDescription: "Coverage-ready publication for local testing.",
        blogLogo: "https://example.test/logo.png",
        fontFamily: "Space Grotesk",
        themeVariant: "theme-lumina",
        siteUrl: "https://signal-ledger.test",
        defaultMetaTitle: "Signal Ledger Home",
        defaultMetaDescription: "Local coverage without external services.",
        defaultOgImage: "https://example.test/og.png",
        twitterHandle: "@signalledger",
        stripeMonthlyPriceId: "price_monthly_fixture",
        stripeAnnualPriceId: "price_annual_fixture",
        newsletterSenderEmail: "newsletter@signalledger.test",
        doubleOptInEnabled: true,
        membershipGracePeriodDays: 7,
        robotsIndexingEnabled: false,
      });
      expect(dashboard.socialLinks).toEqual([
        {
          platform: "github",
          url: "https://github.com/signal-ledger",
        },
        {
          platform: "linkedin",
          url: "https://linkedin.com/company/signal-ledger",
        },
      ]);

      const site = await getGlobalSiteData();
      expect(site.blogName).toBe("Signal Ledger");
      expect(site.defaultMetaTitle).toBe("Signal Ledger Home");
      expect(site.defaultMetaDescription).toBe(
        "Local coverage without external services.",
      );
      expect(site.robotsIndexingEnabled).toBe(false);
      expect(site.socialLinks).toEqual([
        {
          platform: "github",
          url: "https://github.com/signal-ledger",
        },
        {
          platform: "linkedin",
          url: "https://linkedin.com/company/signal-ledger",
        },
      ]);
    });
  }, 15000);

  it("hydrates dashboard settings defaults and local security warnings without external services", async () => {
    await withIsolatedDatabase("settings-defaults", async () => {
      const { mapSettingsRowsToFormValues } = await import("#/lib/settings-form");
      const { getSecurityConfigAudit } = await import("#/server/security/config");

      const previousSiteKey = process.env.TURNSTILE_SITE_KEY;
      const previousSecretKey = process.env.TURNSTILE_SECRET_KEY;
      const previousSecurityContact = process.env.SECURITY_CONTACT_EMAIL;

      Reflect.deleteProperty(process.env, "TURNSTILE_SITE_KEY");
      Reflect.deleteProperty(process.env, "TURNSTILE_SECRET_KEY");
      Reflect.deleteProperty(process.env, "SECURITY_CONTACT_EMAIL");

      try {
        const result = mapSettingsRowsToFormValues([]);
        const audit = getSecurityConfigAudit();

        expect(result).toMatchObject({
          blogName: "Lumina",
          blogDescription: "An elegant premium blog for creators.",
          fontFamily: "Inter",
          themeVariant: "default",
          doubleOptInEnabled: false,
          membershipGracePeriodDays: 3,
          robotsIndexingEnabled: true,
          socialLinks: [],
        });
        expect(audit.turnstileEnabled).toBe(false);
        expect(audit.missingRequired).toEqual([
          "TURNSTILE_SITE_KEY",
          "TURNSTILE_SECRET_KEY",
        ]);
        expect(audit.optionalWarnings).toEqual([
          "SECURITY_CONTACT_EMAIL",
        ]);
      } finally {
        if (previousSiteKey === undefined) {
          Reflect.deleteProperty(process.env, "TURNSTILE_SITE_KEY");
        } else {
          process.env.TURNSTILE_SITE_KEY = previousSiteKey;
        }

        if (previousSecretKey === undefined) {
          Reflect.deleteProperty(process.env, "TURNSTILE_SECRET_KEY");
        } else {
          process.env.TURNSTILE_SECRET_KEY = previousSecretKey;
        }

        if (previousSecurityContact === undefined) {
          Reflect.deleteProperty(process.env, "SECURITY_CONTACT_EMAIL");
        } else {
          process.env.SECURITY_CONTACT_EMAIL = previousSecurityContact;
        }
      }
    });
  }, 15000);
});
