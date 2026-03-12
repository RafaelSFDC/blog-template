import type { z } from "zod";
import {
  pageFormSchema,
  postFormSchema,
  slugify,
} from "#/lib/cms-schema";

export type PostEditorFormValues = z.infer<typeof postFormSchema>;
export type PageEditorFormValues = z.infer<typeof pageFormSchema>;

export interface PostPreviewDraft extends PostEditorFormValues {
  permalink: string;
  categoryNames: string[];
  tagNames: string[];
  coverImage?: string | null;
  authorName?: string | null;
  readingTime?: number | null;
}

export interface PagePreviewDraft extends PageEditorFormValues {
  permalink: string;
}

interface NamedRecord {
  id: number;
  name: string;
}

interface PostPreviewOptions {
  categories?: NamedRecord[];
  tags?: NamedRecord[];
  coverImage?: string | null;
  authorName?: string | null;
  readingTime?: number | null;
}

function resolvePreviewSlug(rawSlug: string, title: string, fallback: string) {
  const computed = slugify(rawSlug || title);
  return computed || fallback;
}

export function buildPostPreviewDraft(
  values: PostEditorFormValues,
  options: PostPreviewOptions = {},
): PostPreviewDraft {
  const slug = resolvePreviewSlug(values.slug, values.title, "untitled-post");

  return {
    ...values,
    slug,
    permalink: `/blog/${slug}`,
    categoryNames:
      options.categories
        ?.filter((category) => values.categoryIds.includes(category.id))
        .map((category) => category.name) ?? [],
    tagNames:
      options.tags
        ?.filter((tag) => values.tagIds.includes(tag.id))
        .map((tag) => tag.name) ?? [],
    coverImage: options.coverImage ?? values.ogImage ?? null,
    authorName: options.authorName ?? "Editorial Team",
    readingTime: options.readingTime ?? null,
  };
}

export function buildPagePreviewDraft(
  values: PageEditorFormValues,
): PagePreviewDraft {
  const slug = resolvePreviewSlug(values.slug, values.title, "untitled-page");

  return {
    ...values,
    slug,
    permalink: values.isHome ? "/" : `/${slug}`,
  };
}

export function getEditorialStatusCopy(status: string) {
  switch (status) {
    case "published":
      return "Published";
    case "scheduled":
      return "Scheduled";
    case "private":
      return "Private";
    default:
      return "Draft";
  }
}
