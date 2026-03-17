import {
  newsletterCampaignActionTypeSchema,
  newsletterCampaignFormSchema,
  newsletterCampaignSchema,
  newsletterSegmentSchema,
  newsletterCampaignSubmissionSchema,
} from "#/schemas/newsletter";
import type { NewsletterCampaignFormValues } from "#/types/forms";
import type { NewsletterTemplatePost } from "#/types/newsletter";

export type { NewsletterTemplatePost } from "#/types/newsletter";
export { newsletterCampaignFormSchema, newsletterCampaignSubmissionSchema };

type ExistingNewsletter = {
  subject: string;
  preheader: string | null;
  content: string;
  postId: number | null;
  segment: string;
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
    segment: newsletterSegmentSchema.catch("all_active").parse(existing?.segment),
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
  return newsletterCampaignSubmissionSchema
    .transform((value) =>
      newsletterCampaignSchema
        .extend({ action: newsletterCampaignActionTypeSchema })
        .parse({
          ...value,
          scheduledAt: value.scheduledAt ? new Date(value.scheduledAt) : undefined,
        }),
    )
    .parse({
      subject: values.subject.trim(),
      preheader: values.preheader.trim(),
      content: values.content.trim(),
      postId: values.postId,
      segment: values.segment,
      scheduledAt: values.scheduledAt,
      action,
    });
}
