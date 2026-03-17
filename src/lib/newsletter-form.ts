import { z } from "zod";
import { newsletterCampaignSchema } from "#/schemas/newsletter";
import type { NewsletterCampaignFormValues } from "#/types/forms";
import type { NewsletterTemplatePost } from "#/types/newsletter";

export type { NewsletterTemplatePost } from "#/types/newsletter";

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
  segment: z.enum(["all_active", "premium_members", "free_subscribers"]),
  scheduledAt: scheduledDateStringSchema,
});

export const newsletterCampaignSubmissionSchema =
  newsletterCampaignFormSchema.extend({
    action: z.enum(["draft", "schedule", "queue"]),
  });

type ExistingNewsletter = {
  subject: string;
  preheader: string | null;
  content: string;
  postId: number | null;
  segment: "all_active" | "premium_members" | "free_subscribers";
  scheduledAt: string | Date | null;
} | null;

export function mapNewsletterToFormValues(
  existing: ExistingNewsletter,
): NewsletterCampaignFormValues {
  return {
    subject: existing?.subject ?? "",
    preheader: existing?.preheader ?? "",
    content: existing?.content ?? "",
    postId: existing?.postId ?? undefined,
    segment: existing?.segment ?? "all_active",
    scheduledAt:
      existing?.scheduledAt instanceof Date
        ? existing.scheduledAt.toISOString().slice(0, 16)
        : existing?.scheduledAt
          ? String(existing.scheduledAt).slice(0, 16)
          : "",
  };
}

export function buildNewsletterTemplateFromPost(
  post: NewsletterTemplatePost,
): NewsletterCampaignFormValues {
  return {
    subject: `New post: ${post.title}`,
    preheader: post.excerpt ?? "",
    content: `<h2>${post.title}</h2><p>${post.excerpt ?? ""}</p><a href="/blog/${post.slug}">Read more</a>`,
    postId: post.id,
    segment: "all_active",
    scheduledAt: "",
  };
}

export function normalizeNewsletterCampaignSubmission(
  values: NewsletterCampaignFormValues,
  action: "draft" | "schedule" | "queue",
) {
  return newsletterCampaignSchema.extend({
    action: z.enum(["draft", "schedule", "queue"]),
  }).parse({
    subject: values.subject.trim(),
    preheader: values.preheader.trim(),
    content: values.content.trim(),
    postId: values.postId,
    segment: values.segment,
    scheduledAt: values.scheduledAt ? new Date(values.scheduledAt) : undefined,
    action,
  });
}
