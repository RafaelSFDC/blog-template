import { createServerFn } from "@tanstack/react-start";
import { db } from "#/db/index";
import { appSettings } from "#/db/schema";
import { requireAdminSession } from "#/server/auth/session";
import {
  mapSettingsRowsToFormValues,
} from "#/lib/settings-form";
import { settingsSchema } from "#/schemas";
import { getSecurityConfigAudit } from "#/server/security/config";

type AppSettingRow = typeof appSettings.$inferSelect;

export const getDashboardSettings = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireAdminSession();
    const settings = (await db.select().from(appSettings)) as AppSettingRow[];
    const securityAudit = getSecurityConfigAudit();
    const settingsData = settings.map((row) => ({
      key: row.key,
      value: row.value ?? "",
    }));

    return {
      settings: mapSettingsRowsToFormValues(settingsData),
      securityAudit,
    };
  },
);

export const updateDashboardSettings = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => settingsSchema.parse(input))
  .handler(async ({ data }) => {
    await requireAdminSession();
    const normalized = {
      ...data,
      blogDescription: data.blogDescription ?? "",
      blogLogo: data.blogLogo ?? "",
      siteUrl: data.siteUrl ?? "",
      defaultMetaTitle: data.defaultMetaTitle ?? "",
      defaultMetaDescription: data.defaultMetaDescription ?? "",
      defaultOgImage: data.defaultOgImage ?? "",
      twitterHandle: data.twitterHandle ?? "",
      stripeMonthlyPriceId: data.stripeMonthlyPriceId ?? "",
      stripeAnnualPriceId: data.stripeAnnualPriceId ?? "",
      newsletterSenderEmail: data.newsletterSenderEmail ?? "",
      socialLinks: data.socialLinks ?? [],
    };

    const upsert = async (key: string, value: string) => {
      await db
        .insert(appSettings)
        .values({ key, value, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: appSettings.key,
          set: { value, updatedAt: new Date() },
        });
    };

    await upsert("blogName", normalized.blogName);
    await upsert("blogDescription", normalized.blogDescription);
    await upsert("blogLogo", normalized.blogLogo || "");
    await upsert("fontFamily", normalized.fontFamily);
    await upsert("themeVariant", normalized.themeVariant);
    await upsert("siteUrl", normalized.siteUrl || "");
    await upsert("defaultMetaTitle", normalized.defaultMetaTitle || "");
    await upsert("defaultMetaDescription", normalized.defaultMetaDescription || "");
    await upsert("defaultOgImage", normalized.defaultOgImage || "");
    await upsert("twitterHandle", normalized.twitterHandle || "");
    await upsert("stripeMonthlyPriceId", normalized.stripeMonthlyPriceId || "");
    await upsert("stripeAnnualPriceId", normalized.stripeAnnualPriceId || "");
    await upsert("newsletterSenderEmail", normalized.newsletterSenderEmail || "");
    await upsert("doubleOptInEnabled", String(normalized.doubleOptInEnabled));
    await upsert(
      "membershipGracePeriodDays",
      String(normalized.membershipGracePeriodDays),
    );
    await upsert(
      "robotsIndexingEnabled",
      String(normalized.robotsIndexingEnabled),
    );
    await upsert("socialLinks", JSON.stringify(normalized.socialLinks));

    return { ok: true as const };
  });
