import type { z } from "zod";
import { settingsFormSchema, settingsSchema } from "#/schemas/system";
import type { SettingsFormValues } from "#/types/forms";

export { settingsFormSchema };

type SettingsPayload = z.output<typeof settingsSchema>;
type SettingsRow = { key: string; value: string };

function buildSettingsRecord(rows: SettingsRow[]) {
  const settingsRecord: Record<string, string> = {};

  for (const row of rows) {
    settingsRecord[row.key] = row.value;
  }

  return settingsRecord;
}

function parseStoredSocialLinks(settingsRecord: Record<string, string>) {
  try {
    return settingsRecord.socialLinks
      ? (JSON.parse(settingsRecord.socialLinks) as SettingsFormValues["socialLinks"])
      : [];
  } catch (error) {
    console.error("Failed to parse socialLinks", error);
    return [];
  }
}

export function getLegacySocialLinks(settingsRecord: Record<string, string>) {
  const legacySocialLinks: SettingsFormValues["socialLinks"] = [];

  if (settingsRecord.twitterProfile) {
    legacySocialLinks.push({
      platform: "x",
      url: settingsRecord.twitterProfile,
    });
  }

  if (settingsRecord.githubProfile) {
    legacySocialLinks.push({
      platform: "github",
      url: settingsRecord.githubProfile,
    });
  }

  if (settingsRecord.linkedinProfile) {
    legacySocialLinks.push({
      platform: "linkedin",
      url: settingsRecord.linkedinProfile,
    });
  }

  return legacySocialLinks;
}

export function mapSettingsRowsToFormValues(rows: SettingsRow[]): SettingsFormValues {
  const settingsRecord = buildSettingsRecord(rows);
  const parsedSocialLinks = parseStoredSocialLinks(settingsRecord);
  const socialLinks =
    parsedSocialLinks.length > 0
      ? parsedSocialLinks
      : getLegacySocialLinks(settingsRecord);

  return {
    blogName: settingsRecord.blogName || "Lumina",
    blogDescription:
      settingsRecord.blogDescription || "An elegant premium blog for creators.",
    blogLogo: settingsRecord.blogLogo || "",
    fontFamily: settingsRecord.fontFamily || "Inter",
    themeVariant: settingsRecord.themeVariant || "default",
    siteUrl: settingsRecord.siteUrl || "",
    defaultMetaTitle: settingsRecord.defaultMetaTitle || "",
    defaultMetaDescription: settingsRecord.defaultMetaDescription || "",
    defaultOgImage: settingsRecord.defaultOgImage || "",
    twitterHandle: settingsRecord.twitterHandle || "",
    stripeMonthlyPriceId: settingsRecord.stripeMonthlyPriceId || settingsRecord.stripePriceId || "",
    stripeAnnualPriceId: settingsRecord.stripeAnnualPriceId || "",
    newsletterSenderEmail: settingsRecord.newsletterSenderEmail || "",
    doubleOptInEnabled: settingsRecord.doubleOptInEnabled === "true",
    membershipGracePeriodDays: Number(settingsRecord.membershipGracePeriodDays || "3"),
    robotsIndexingEnabled: settingsRecord.robotsIndexingEnabled !== "false",
    socialLinks,
  };
}

export function normalizeSettingsFormValues(
  values: SettingsFormValues,
): SettingsPayload {
  return {
    blogName: values.blogName.trim(),
    blogDescription: values.blogDescription.trim(),
    blogLogo: values.blogLogo.trim(),
    fontFamily: values.fontFamily.trim(),
    themeVariant: values.themeVariant.trim(),
    siteUrl: values.siteUrl.trim(),
    defaultMetaTitle: values.defaultMetaTitle.trim(),
    defaultMetaDescription: values.defaultMetaDescription.trim(),
    defaultOgImage: values.defaultOgImage.trim(),
    twitterHandle: values.twitterHandle.trim(),
    stripeMonthlyPriceId: values.stripeMonthlyPriceId?.trim() ?? "",
    stripeAnnualPriceId: values.stripeAnnualPriceId?.trim() ?? "",
    newsletterSenderEmail: values.newsletterSenderEmail?.trim() ?? "",
    doubleOptInEnabled: values.doubleOptInEnabled,
    membershipGracePeriodDays: values.membershipGracePeriodDays ?? 3,
    robotsIndexingEnabled: values.robotsIndexingEnabled,
    socialLinks: values.socialLinks.map((link) => ({
      platform: link.platform.trim(),
      url: link.url.trim(),
    })),
  };
}
