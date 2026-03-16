import {
  slugify,
} from "#/schemas/system";
import type {
  PageEditorFormValues,
  PagePreviewDraft,
  PostEditorFormValues,
  PostPreviewDraft,
} from "#/types/editorial";

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
