import type { GlobalSiteData } from "#/lib/cms";

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

export function buildPublicSeo(params: {
  site: GlobalSiteData;
  path: string;
  title?: string;
  description?: string;
  image?: string;
  type?: "website" | "article";
  indexable?: boolean;
  links?: Array<{ rel: string; href: string }>;
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
  };
}
