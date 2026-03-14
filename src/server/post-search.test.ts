import { describe, expect, it } from "vitest";
import {
  type SearchablePostRecord,
  normalizeSearchQuery,
  rankSearchPosts,
  tokenizeSearchQuery,
} from "#/server/post-search";

const records: SearchablePostRecord[] = [
  {
    id: 1,
    slug: "seo-foundations",
    title: "SEO Foundations for Modern Blogs",
    excerpt: "Canonical tags, archives, and technical cleanup.",
    content: "<p>Learn how redirects and search pages affect indexing.</p>",
    coverImage: null,
    publishedAt: "2026-03-10T10:00:00.000Z",
    category: "SEO",
    categorySlug: "seo",
    tag: "Redirects",
  },
  {
    id: 2,
    slug: "newsletter-jobs",
    title: "Background jobs for newsletters",
    excerpt: "Queues, retries, and async delivery for audience growth.",
    content: "<p>Workers and queues help email pipelines stay reliable.</p>",
    coverImage: null,
    publishedAt: "2026-03-09T10:00:00.000Z",
    category: "Growth",
    categorySlug: "growth",
    tag: "Email",
  },
  {
    id: 3,
    slug: "technical-search",
    title: "Technical search improvements",
    excerpt: "Making on-site search more useful.",
    content: "<p>Search can index title, excerpt, content, categories, and tags.</p>",
    coverImage: null,
    publishedAt: "2026-03-11T10:00:00.000Z",
    category: "SEO",
    categorySlug: "seo",
    tag: "Search",
  },
];

describe("post-search", () => {
  it("normalizes and tokenizes user queries", () => {
    expect(normalizeSearchQuery("  Busca   técnica  ")).toBe("Busca técnica");
    expect(tokenizeSearchQuery("  Busca   técnica  ")).toEqual(["busca", "tecnica"]);
  });

  it("ranks title matches above weaker content-only matches", () => {
    const result = rankSearchPosts(records, "search");

    expect(result.map((post) => post.slug)).toEqual(["technical-search", "seo-foundations"]);
  });

  it("matches taxonomy terms as part of the full-text result", () => {
    const result = rankSearchPosts(records, "redirects");

    expect(result).toHaveLength(1);
    expect(result[0]?.slug).toBe("seo-foundations");
  });

  it("requires all search terms to be present somewhere in the document", () => {
    const result = rankSearchPosts(records, "seo redirects");

    expect(result).toHaveLength(1);
    expect(result[0]?.slug).toBe("seo-foundations");
  });
});
