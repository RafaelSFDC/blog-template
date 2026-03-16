import type { z } from "zod";
import {
  pageServerSchema,
  postServerSchema,
} from "#/schemas/editorial";
import { slugify } from "#/schemas/system";
import type {
  PageEditorFormValues,
} from "#/types/editorial";

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
  seoNoIndex: boolean;
  isPremium: boolean;
  teaserMode: PostSubmissionInput["teaserMode"];
  status: PostSubmissionInput["status"];
  publishedAt?: string;
  editorOwnerId?: string;
  categoryIds: number[];
  tagIds: number[];
};

export function shouldAutoUpdateSlug(currentSlug: string, previousSource: string) {
  return !currentSlug || currentSlug === slugify(previousSource);
}

export function normalizeEditorialSlugInput(value: string) {
  return slugify(value.trim());
}

export function getNextAutoSlug(params: {
  currentSlug: string;
  previousSource: string;
  nextSource: string;
}) {
  if (!shouldAutoUpdateSlug(params.currentSlug, params.previousSource)) {
    return params.currentSlug;
  }

  return normalizeEditorialSlugInput(params.nextSource);
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
    seoNoIndex: values.seoNoIndex,
    isPremium: values.isPremium,
    teaserMode: values.teaserMode,
    publishedAt: undefined,
  };
}

export function normalizePostSubmission(
  values: PostSubmissionValues,
): PostSubmissionInput | null {
  const slug = values.slug.trim() || normalizeEditorialSlugInput(values.title);

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
    seoNoIndex: values.seoNoIndex,
    isPremium: values.isPremium,
    teaserMode: values.teaserMode,
    status: values.status,
    editorOwnerId: values.editorOwnerId?.trim() || undefined,
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
