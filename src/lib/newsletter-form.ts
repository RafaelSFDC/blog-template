import { z } from "zod";

const trimmedRequiredString = (
  min: number,
  message: string,
  max: number,
  tooLongMessage: string,
) => z.string().trim().min(min, message).max(max, tooLongMessage);

export const newsletterCampaignFormSchema = z.object({
  subject: trimmedRequiredString(
    1,
    "Subject is required.",
    200,
    "Subject is too long.",
  ),
  content: trimmedRequiredString(
    1,
    "Content is required.",
    200000,
    "Content is too long.",
  ),
  postId: z.number().int().positive().optional(),
});

export const newsletterCampaignSubmissionSchema =
  newsletterCampaignFormSchema.extend({
    sendNow: z.boolean(),
  });

export type NewsletterCampaignFormValues = z.infer<
  typeof newsletterCampaignFormSchema
>;

export type NewsletterTemplatePost = {
  id: number;
  title: string;
  excerpt: string | null;
  slug: string;
  publishedAt: string | Date | null;
};

type ExistingNewsletter = {
  subject: string;
  content: string;
  postId: number | null;
} | null;

export function mapNewsletterToFormValues(
  existing: ExistingNewsletter,
): NewsletterCampaignFormValues {
  return {
    subject: existing?.subject ?? "",
    content: existing?.content ?? "",
    postId: existing?.postId ?? undefined,
  };
}

export function buildNewsletterTemplateFromPost(
  post: NewsletterTemplatePost,
): NewsletterCampaignFormValues {
  return {
    subject: `New post: ${post.title}`,
    content: `<h2>${post.title}</h2><p>${post.excerpt ?? ""}</p><a href="/blog/${post.slug}">Read more</a>`,
    postId: post.id,
  };
}

export function normalizeNewsletterCampaignSubmission(
  values: NewsletterCampaignFormValues,
  sendNow: boolean,
) {
  return {
    subject: values.subject.trim(),
    content: values.content.trim(),
    postId: values.postId,
    sendNow,
  };
}
