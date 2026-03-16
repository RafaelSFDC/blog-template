import { buildExcerptFromContent } from "#/lib/seo";

export type SearchablePostRecord = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  publishedAt: Date | string | null;
  category?: string | null;
  categorySlug?: string | null;
  tag?: string | null;
  authorName?: string | null;
  authorHeadline?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
};

export type RankedSearchPost = Omit<SearchablePostRecord, "content" | "tag" | "authorHeadline" | "metaTitle" | "metaDescription"> & {
  score: number;
  snippet: string;
};

export function normalizeSearchQuery(query: string | undefined) {
  return (query || "").trim().replace(/\s+/g, " ");
}

export function tokenizeSearchQuery(query: string | undefined) {
  return normalizeSearchQuery(query)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 10);
}

function normalizeSearchText(value: string | null | undefined) {
  return (value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ");
}

function buildAggregate(records: SearchablePostRecord[]) {
  const byId = new Map<number, SearchablePostRecord & { tags: Set<string> }>();

  for (const record of records) {
    const existing = byId.get(record.id);
    if (existing) {
      if (!existing.category && record.category) {
        existing.category = record.category;
        existing.categorySlug = record.categorySlug;
      }
      if (!existing.authorName && record.authorName) {
        existing.authorName = record.authorName;
      }
      if (!existing.authorHeadline && record.authorHeadline) {
        existing.authorHeadline = record.authorHeadline;
      }
      if (!existing.metaTitle && record.metaTitle) {
        existing.metaTitle = record.metaTitle;
      }
      if (!existing.metaDescription && record.metaDescription) {
        existing.metaDescription = record.metaDescription;
      }
      if (record.tag) {
        existing.tags.add(record.tag);
      }
      continue;
    }

    byId.set(record.id, {
      ...record,
      tags: new Set(record.tag ? [record.tag] : []),
    });
  }

  return [...byId.values()];
}

function buildSearchSnippet(
  post: SearchablePostRecord & { tags: Set<string> },
  normalizedQuery: string,
  tokens: string[],
) {
  const source = post.excerpt || post.metaDescription || stripHtml(post.content);
  if (!source) {
    return "";
  }

  const plain = source.replace(/\s+/g, " ").trim();
  if (!plain) {
    return "";
  }

  const lowerPlain = normalizeSearchText(plain);
  const needle = normalizedQuery || tokens[0] || "";
  const matchIndex = needle ? lowerPlain.indexOf(needle) : -1;
  if (matchIndex === -1) {
    return buildExcerptFromContent(plain, 180);
  }

  const start = Math.max(0, matchIndex - 60);
  const end = Math.min(plain.length, matchIndex + 120);
  return `${start > 0 ? "…" : ""}${plain.slice(start, end).trim()}${end < plain.length ? "…" : ""}`;
}

function toRankedSearchPost(
  post: SearchablePostRecord & { tags: Set<string> },
  score: number,
  snippet: string,
): RankedSearchPost {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    publishedAt: post.publishedAt,
    category: post.category,
    categorySlug: post.categorySlug,
    authorName: post.authorName,
    score,
    snippet,
  };
}

function getSearchScore(
  post: SearchablePostRecord & { tags: Set<string> },
  normalizedQuery: string,
  tokens: string[],
) {
  const title = normalizeSearchText(post.title);
  const excerpt = normalizeSearchText(post.excerpt);
  const content = normalizeSearchText(stripHtml(post.content));
  const category = normalizeSearchText(post.category);
  const tags = normalizeSearchText([...post.tags].join(" "));
  const authorName = normalizeSearchText(post.authorName);
  const authorHeadline = normalizeSearchText(post.authorHeadline);
  const metaTitle = normalizeSearchText(post.metaTitle);
  const metaDescription = normalizeSearchText(post.metaDescription);
  const combined = `${title} ${excerpt} ${content} ${category} ${tags} ${authorName} ${authorHeadline} ${metaTitle} ${metaDescription}`;

  if (!tokens.every((token) => combined.includes(token))) {
    return 0;
  }

  let score = 0;

  if (normalizedQuery && title.includes(normalizedQuery)) score += 20;
  if (normalizedQuery && metaTitle.includes(normalizedQuery)) score += 16;
  if (normalizedQuery && excerpt.includes(normalizedQuery)) score += 12;
  if (normalizedQuery && authorName.includes(normalizedQuery)) score += 10;
  if (normalizedQuery && category.includes(normalizedQuery)) score += 8;
  if (normalizedQuery && tags.includes(normalizedQuery)) score += 8;
  if (normalizedQuery && metaDescription.includes(normalizedQuery)) score += 6;
  if (normalizedQuery && content.includes(normalizedQuery)) score += 4;

  for (const token of tokens) {
    if (title.includes(token)) score += 8;
    if (metaTitle.includes(token)) score += 7;
    if (excerpt.includes(token)) score += 5;
    if (authorName.includes(token)) score += 5;
    if (authorHeadline.includes(token)) score += 4;
    if (category.includes(token)) score += 4;
    if (tags.includes(token)) score += 4;
    if (metaDescription.includes(token)) score += 3;
    if (content.includes(token)) score += 2;
  }

  return score;
}

export function rankSearchPosts(records: SearchablePostRecord[], query: string | undefined) {
  const normalizedQuery = normalizeSearchText(normalizeSearchQuery(query));
  const tokens = tokenizeSearchQuery(query);

  if (tokens.length === 0) {
    return buildAggregate(records)
      .sort((a, b) => {
        const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return bDate - aDate;
      })
      .map((post) => toRankedSearchPost(post, 0, buildSearchSnippet(post, normalizedQuery, tokens)));
  }

  return buildAggregate(records)
    .map((post) => ({
      post,
      score: getSearchScore(post, normalizedQuery, tokens),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      const aDate = a.post.publishedAt ? new Date(a.post.publishedAt).getTime() : 0;
      const bDate = b.post.publishedAt ? new Date(b.post.publishedAt).getTime() : 0;
      return bDate - aDate;
    })
    .map(({ post, score }) => toRankedSearchPost(post, score, buildSearchSnippet(post, normalizedQuery, tokens)));
}
