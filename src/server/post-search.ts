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
};

export type RankedSearchPost = Omit<SearchablePostRecord, "content" | "tag"> & {
  score: number;
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

function toRankedSearchPost(
  post: SearchablePostRecord & { tags: Set<string> },
  score: number,
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
    score,
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
  const combined = `${title} ${excerpt} ${content} ${category} ${tags}`;

  if (!tokens.every((token) => combined.includes(token))) {
    return 0;
  }

  let score = 0;

  if (normalizedQuery && title.includes(normalizedQuery)) {
    score += 12;
  }
  if (normalizedQuery && excerpt.includes(normalizedQuery)) {
    score += 8;
  }
  if (normalizedQuery && content.includes(normalizedQuery)) {
    score += 4;
  }

  for (const token of tokens) {
    if (title.includes(token)) score += 6;
    if (excerpt.includes(token)) score += 4;
    if (category.includes(token)) score += 4;
    if (tags.includes(token)) score += 3;
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
      .map((post) => toRankedSearchPost(post, 0));
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
    .map(({ post, score }) => toRankedSearchPost(post, score));
}
