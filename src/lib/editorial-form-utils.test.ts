import { describe, expect, it } from "vitest";
import {
  normalizePostSubmission,
  shouldAutoUpdateSlug,
} from "#/lib/editorial-form-utils";

describe("editorial-form-utils", () => {
  it("updates the slug automatically only when it still matches the previous source", () => {
    expect(shouldAutoUpdateSlug("", "Old Title")).toBe(true);
    expect(shouldAutoUpdateSlug("old-title", "Old Title")).toBe(true);
    expect(shouldAutoUpdateSlug("custom-slug", "Old Title")).toBe(false);
  });

  it("normalizes scheduled post submissions with a real publication date", () => {
    const result = normalizePostSubmission({
      title: "  Scheduled Launch  ",
      slug: "",
      excerpt: "  Launch notes  ",
      content: "  Content body  ",
      metaTitle: "  Launch Title  ",
      metaDescription: "  Launch Description  ",
      ogImage: "  https://cdn.example.com/og.png  ",
      seoNoIndex: false,
      isPremium: false,
      teaserMode: "excerpt",
      commentsEnabled: true,
      status: "scheduled",
      publishedAt: "2026-04-01T10:30:00.000Z",
      categoryIds: [1],
      tagIds: [2],
    });

    expect(result).toMatchObject({
      title: "Scheduled Launch",
      slug: "scheduled-launch",
      excerpt: "Launch notes",
      content: "Content body",
      metaTitle: "Launch Title",
      metaDescription: "Launch Description",
      ogImage: "https://cdn.example.com/og.png",
      status: "scheduled",
      categoryIds: [1],
      tagIds: [2],
    });
    expect(result?.publishedAt).toEqual(new Date("2026-04-01T10:30:00.000Z"));
  });

  it("returns null when the title and slug cannot produce a valid slug", () => {
    const result = normalizePostSubmission({
      title: "   ",
      slug: "   ",
      excerpt: "Excerpt",
      content: "Content",
      seoNoIndex: false,
      isPremium: false,
      teaserMode: "excerpt",
      commentsEnabled: true,
      status: "draft",
      publishedAt: "",
      categoryIds: [],
      tagIds: [],
    });

    expect(result).toBeNull();
  });
});
