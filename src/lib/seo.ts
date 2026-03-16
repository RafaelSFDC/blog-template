import type { GlobalSiteData } from "#/types/system";

export type JsonLdValue = Record<string, unknown> | Array<Record<string, unknown>>;

export function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function resolveSiteUrl(configuredSiteUrl?: string, requestUrl?: string) {
  if (configuredSiteUrl?.trim()) {
    return stripTrailingSlash(configuredSiteUrl.trim());
  }

  if (requestUrl) {
    return stripTrailingSlash(new URL(requestUrl).origin);
  }

  return "";
}

export function buildCanonicalUrl(siteUrl: string, path: string) {
  if (!siteUrl) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${stripTrailingSlash(siteUrl)}${normalizedPath}`;
}

export function getRobotsMeta(indexable: boolean) {
  return indexable ? "index, follow" : "noindex, nofollow";
}

export function getSeoDefaults(site: GlobalSiteData) {
  return {
    title: site.defaultMetaTitle || `${site.blogName} | Elegant Stories`,
    description: site.defaultMetaDescription || site.blogDescription,
    image: site.defaultOgImage || undefined,
  };
}

export function getPublicCacheControl(ttlSeconds = 900, staleSeconds = 86400) {
  return `public, s-maxage=${ttlSeconds}, stale-while-revalidate=${staleSeconds}`;
}

export function getPrivateCacheControl() {
  return "private, no-cache, no-store, must-revalidate";
}

export function resolvePublicCacheControl(params?: {
  hasSession?: boolean;
  ttlSeconds?: number;
  staleSeconds?: number;
}) {
  if (params?.hasSession) {
    return getPrivateCacheControl();
  }

  return getPublicCacheControl(params?.ttlSeconds, params?.staleSeconds);
}

export function resolvePublicIndexability(params: {
  site: Pick<GlobalSiteData, "robotsIndexingEnabled">;
  seoNoIndex?: boolean | null;
  isPremium?: boolean | null;
  hasAccess?: boolean;
  hasQuery?: boolean;
  currentPage?: number;
  forceNoIndex?: boolean;
}) {
  return (
    params.site.robotsIndexingEnabled &&
    !params.seoNoIndex &&
    !params.forceNoIndex &&
    !params.hasQuery &&
    (params.currentPage ?? 1) === 1 &&
    (!params.isPremium || params.hasAccess)
  );
}

function buildQueryString(query?: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query || {})) {
    if (value === undefined || value === "") {
      continue;
    }

    params.set(key, String(value));
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export function buildPaginatedPath(params: {
  path: string;
  page: number;
  query?: Record<string, string | number | undefined>;
}) {
  const normalizedPage = Math.max(1, params.page);
  const query = {
    ...(params.query || {}),
    page: normalizedPage > 1 ? normalizedPage : undefined,
  };

  return `${params.path}${buildQueryString(query)}`;
}

export function buildPaginationLinks(params: {
  siteUrl: string;
  path: string;
  currentPage: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  query?: Record<string, string | number | undefined>;
}) {
  const links: Array<{ rel: "prev" | "next"; href: string }> = [];

  if (params.hasPreviousPage) {
    links.push({
      rel: "prev",
      href: buildCanonicalUrl(
        params.siteUrl,
        buildPaginatedPath({
          path: params.path,
          page: params.currentPage - 1,
          query: params.query,
        }),
      ),
    });
  }

  if (params.hasNextPage) {
    links.push({
      rel: "next",
      href: buildCanonicalUrl(
        params.siteUrl,
        buildPaginatedPath({
          path: params.path,
          page: params.currentPage + 1,
          query: params.query,
        }),
      ),
    });
  }

  return links;
}

export function truncateText(value: string | null | undefined, maxLength: number) {
  const normalized = (value || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

export function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function buildExcerptFromContent(content: string, maxLength = 180) {
  return truncateText(stripHtml(content), maxLength);
}

export function buildJsonLdScript(data: JsonLdValue) {
  return {
    type: "application/ld+json",
    children: JSON.stringify(data),
  };
}

export function buildOrganizationJsonLd(site: GlobalSiteData) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.blogName,
    description: site.blogDescription,
    url: site.siteUrl || undefined,
    logo: site.blogLogo || site.defaultOgImage || undefined,
    sameAs: site.socialLinks.map((link) => link.url).filter(Boolean),
  };
}

export function buildBreadcrumbJsonLd(
  siteUrl: string,
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: buildCanonicalUrl(siteUrl, item.path),
    })),
  };
}

export function buildArticleJsonLd(params: {
  site: GlobalSiteData;
  post: {
    title: string;
    excerpt?: string | null;
    content?: string | null;
    slug: string;
    publishedAt?: string | Date | null;
    updatedAt?: string | Date | null;
    coverImage?: string | null;
    ogImage?: string | null;
    author?: {
      name: string;
      slug?: string | null;
      image?: string | null;
    } | null;
  };
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: params.post.title,
    description:
      params.post.excerpt ||
      buildExcerptFromContent(params.post.content || "", 220) ||
      params.site.blogDescription,
    image: [params.post.ogImage || params.post.coverImage || params.site.defaultOgImage].filter(Boolean),
    datePublished: params.post.publishedAt
      ? new Date(params.post.publishedAt).toISOString()
      : undefined,
    dateModified: params.post.updatedAt
      ? new Date(params.post.updatedAt).toISOString()
      : params.post.publishedAt
        ? new Date(params.post.publishedAt).toISOString()
        : undefined,
    mainEntityOfPage: buildCanonicalUrl(params.site.siteUrl, `/blog/${params.post.slug}`),
    author: params.post.author
      ? {
          "@type": "Person",
          name: params.post.author.name,
          image: params.post.author.image || undefined,
          url: params.post.author.slug
            ? buildCanonicalUrl(params.site.siteUrl, `/author/${params.post.author.slug}`)
            : undefined,
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: params.site.blogName,
      logo: params.site.blogLogo || params.site.defaultOgImage || undefined,
    },
  };
}

export function buildPersonJsonLd(params: {
  site: GlobalSiteData;
  author: {
    name: string;
    slug: string;
    bio?: string | null;
    headline?: string | null;
    image?: string | null;
  };
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: params.author.name,
    description: params.author.bio || params.author.headline || undefined,
    jobTitle: params.author.headline || undefined,
    image: params.author.image || undefined,
    url: buildCanonicalUrl(params.site.siteUrl, `/author/${params.author.slug}`),
  };
}

export function buildPublicSeo(params: {
  site: GlobalSiteData;
  path: string;
  title?: string;
  description?: string;
  image?: string;
  type?: "website" | "article" | "profile";
  indexable?: boolean;
  links?: Array<{ rel: string; href: string }>;
  jsonLd?: JsonLdValue[];
}) {
  const defaults = getSeoDefaults(params.site);
  const title = params.title || defaults.title;
  const description = params.description || defaults.description;
  const image = params.image || defaults.image;
  const indexable = params.indexable ?? params.site.robotsIndexingEnabled;
  const canonical = buildCanonicalUrl(params.site.siteUrl, params.path);

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: getRobotsMeta(indexable) },
      { property: "og:site_name", content: params.site.blogName },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: params.type || "website" },
      { property: "og:url", content: canonical },
      { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      ...(params.site.twitterHandle
        ? [{ name: "twitter:site", content: params.site.twitterHandle }]
        : []),
      ...(image
        ? [
            { property: "og:image", content: image },
            { name: "twitter:image", content: image },
          ]
        : []),
    ],
    links: canonical
      ? [
          {
            rel: "canonical",
            href: canonical,
          },
          ...(params.links || []),
        ]
      : params.links || [],
    scripts: (params.jsonLd || []).map((entry) => buildJsonLdScript(entry)),
  };
}
