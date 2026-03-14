import type { z } from "zod";
import {
  pageServerSchema,
  postServerSchema,
  slugify,
} from "#/lib/cms-schema";
import type {
  PageEditorFormValues,
} from "#/lib/editorial-preview";

type PageSubmissionInput = z.input<typeof pageServerSchema>;
type PostSubmissionInput = z.input<typeof postServerSchema>;
type PostSubmissionValues = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  isPremium: boolean;
  status: PostSubmissionInput["status"];
  publishedAt?: string;
  categoryIds: number[];
  tagIds: number[];
};

export function shouldAutoUpdateSlug(currentSlug: string, previousSource: string) {
  return !currentSlug || currentSlug === slugify(previousSource);
}

export function normalizePageSubmission(
  values: PageEditorFormValues,
): PageSubmissionInput {
  return {
    ...values,
    title: values.title.trim(),
    slug: values.slug.trim(),
    excerpt: values.excerpt.trim() || undefined,
    content: values.content.trim(),
    metaTitle: values.metaTitle.trim() || undefined,
    metaDescription: values.metaDescription.trim() || undefined,
    ogImage: values.ogImage.trim() || undefined,
    publishedAt: undefined,
  };
}

export function normalizePostSubmission(
  values: PostSubmissionValues,
): PostSubmissionInput | null {
  const slug = values.slug.trim() || slugify(values.title);

  if (!slug) {
    return null;
  }

  return {
    title: values.title.trim(),
    slug,
    excerpt: values.excerpt.trim(),
    content: values.content.trim(),
    metaTitle: values.metaTitle?.trim() || undefined,
    metaDescription: values.metaDescription?.trim() || undefined,
    ogImage: values.ogImage?.trim() || undefined,
    isPremium: values.isPremium,
    status: values.status,
    publishedAt:
      values.status === "scheduled"
        ? new Date(values.publishedAt || "")
        : values.status === "published"
          ? new Date()
          : undefined,
    categoryIds: values.categoryIds,
    tagIds: values.tagIds,
  };
}
