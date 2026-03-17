import { z } from "zod";
import {
  NEWSLETTER_CAMPAIGN_ACTIONS,
  newsletterSegmentSchema,
} from "#/schemas/core";

const trimmedRequiredString = (
  min: number,
  message: string,
  max: number,
  tooLongMessage: string,
) => z.string().trim().min(min, message).max(max, tooLongMessage);

const scheduledDateStringSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || !Number.isNaN(Date.parse(value)), {
    message: "Schedule date is invalid.",
  });

export const newsletterCampaignFormSchema = z.object({
  subject: trimmedRequiredString(1, "Subject is required.", 200, "Subject is too long."),
  preheader: z.string().trim().max(255, "Preheader is too long."),
  content: trimmedRequiredString(1, "Content is required.", 200000, "Content is too long."),
  postId: z.number().int().positive().optional(),
  segment: newsletterSegmentSchema,
  scheduledAt: scheduledDateStringSchema,
});

export const newsletterCampaignSubmissionSchema =
  newsletterCampaignFormSchema.extend({
    action: z.enum(NEWSLETTER_CAMPAIGN_ACTIONS),
  });
