import { describe, expect, it } from "vitest";
import {
  buildPagePreviewDraft,
  buildPostPreviewDraft,
} from "#/lib/editorial-preview";

describe("editorial preview builders", () => {
  it("builds a post preview draft with computed permalink and taxonomy labels", () => {
    const draft = buildPostPreviewDraft(
      {
        title: "Olá Mundo Editorial",
        slug: "",
        excerpt: "Resumo editorial",
        content: "## Heading",
        metaTitle: "",
        metaDescription: "",
        ogImage: "",
        seoNoIndex: false,
        isPremium: true,
        teaserMode: "excerpt",
        commentsEnabled: true,
        status: "draft",
        publishedAt: "",
        categoryIds: [2],
        tagIds: [5],
      },
      {
        categories: [{ id: 2, name: "Design" }],
        tags: [{ id: 5, name: "UI" }],
        authorName: "Lumina Team",
      },
    );

    expect(draft.slug).toBe("ola-mundo-editorial");
    expect(draft.permalink).toBe("/blog/ola-mundo-editorial");
    expect(draft.categoryNames).toEqual(["Design"]);
    expect(draft.tagNames).toEqual(["UI"]);
    expect(draft.authorName).toBe("Lumina Team");
  });

  it("builds a page preview draft and respects homepage permalink", () => {
    const homepageDraft = buildPagePreviewDraft({
      title: "Home",
      slug: "home",
      excerpt: "",
      content: "Hello world",
      metaTitle: "",
      metaDescription: "",
      ogImage: "",
      seoNoIndex: false,
      isPremium: false,
      teaserMode: "excerpt",
      status: "published",
      isHome: true,
      useVisualBuilder: false,
    });

    const pageDraft = buildPagePreviewDraft({
      title: "Sobre nós",
      slug: "",
      excerpt: "",
      content: "Body",
      metaTitle: "",
      metaDescription: "",
      ogImage: "",
      seoNoIndex: false,
      isPremium: false,
      teaserMode: "excerpt",
      status: "draft",
      isHome: false,
      useVisualBuilder: false,
    });

    expect(homepageDraft.permalink).toBe("/");
    expect(pageDraft.slug).toBe("sobre-nos");
    expect(pageDraft.permalink).toBe("/sobre-nos");
  });
});
