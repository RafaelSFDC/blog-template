import { z } from "zod";
import { webhookEventSchema } from "#/schemas/core";

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
  stripeMonthlyPriceId: trimmedOptionalString(255, "Monthly Stripe Price ID is too long"),
  stripeAnnualPriceId: trimmedOptionalString(255, "Annual Stripe Price ID is too long"),
  newsletterSenderEmail: trimmedOptionalString(320, "Sender email is too long").refine(
    (value) => !value || z.string().email().safeParse(value).success,
    { message: "Must be a valid email" },
  ),
  doubleOptInEnabled: z.boolean(),
  membershipGracePeriodDays: z.number().int().min(0).max(30),
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

export const webhookFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "Name is too long"),
  url: z.string().trim().url("Must be a valid URL").max(2048, "URL is too long"),
  event: webhookEventSchema,
  secret: z.string().trim().max(255, "Secret is too long"),
});
