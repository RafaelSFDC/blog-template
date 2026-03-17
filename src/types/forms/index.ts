import type { z } from "zod";
import type { newsletterCampaignFormSchema } from "#/schemas/newsletter";
import type { settingsFormSchema, webhookFormSchema } from "#/schemas/system";

export type SettingsFormValues = z.output<typeof settingsFormSchema>;
export type NewsletterCampaignFormValues = z.output<typeof newsletterCampaignFormSchema>;
export type WebhookFormValues = z.output<typeof webhookFormSchema>;
