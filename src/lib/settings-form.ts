import { z } from "zod";
import { settingsSchema } from "#/lib/cms-schema";

const trimmedRequiredString = (
  min: number,
  message: string,
  max: number,
  tooLongMessage: string,
) => z.string().trim().min(min, message).max(max, tooLongMessage);

const trimmedOptionalString = (max: number, tooLongMessage: string) =>
  z.string().trim().max(max, tooLongMessage);

export const settingsFormSchema = z.object({
  blogName: trimmedRequiredString(
    1,
    "Publication Name is required",
    120,
    "Publication Name is too long",
  ),
  blogDescription: trimmedOptionalString(300, "Description is too long"),
  blogLogo: trimmedOptionalString(2048, "Logo URL is too long").refine(
    (value) => !value || z.string().url().safeParse(value).success,
    { message: "Must be a valid URL" },
  ),
  fontFamily: trimmedRequiredString(
    1,
    "Font family is required",
    80,
    "Font family is too long",
  ),
  themeVariant: trimmedRequiredString(
    1,
    "Theme is required",
    120,
    "Theme is too long",
  ),
  siteUrl: trimmedOptionalString(2048, "Site URL is too long").refine(
    (value) => !value || z.string().url().safeParse(value).success,
    { message: "Must be a valid URL" },
  ),
  defaultMetaTitle: trimmedOptionalString(160, "Default meta title is too long"),
  defaultMetaDescription: trimmedOptionalString(
    320,
    "Default meta description is too long",
  ),
  defaultOgImage: trimmedOptionalString(2048, "Default OG image is too long").refine(
    (value) => !value || z.string().url().safeParse(value).success,
    { message: "Must be a valid URL" },
  ),
  twitterHandle: trimmedOptionalString(50, "Twitter handle is too long"),
  robotsIndexingEnabled: z.boolean(),
  socialLinks: z
    .array(
      z.object({
        platform: trimmedRequiredString(
          1,
          "Platform is required",
          40,
          "Platform is too long",
        ),
        url: z.string().trim().url("Must be a valid URL"),
      }),
    )
    .max(20, "Too many social links"),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;
type SettingsPayload = z.input<typeof settingsSchema>;
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
    robotsIndexingEnabled: values.robotsIndexingEnabled,
    socialLinks: values.socialLinks.map((link) => ({
      platform: link.platform.trim(),
      url: link.url.trim(),
    })),
  };
}
