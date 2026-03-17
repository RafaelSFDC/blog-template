import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import {
  DEFAULT_SITE_DATA,
  getGlobalSiteData,
} from "#/server/system/site-data";
import { resolveSiteUrl } from "#/lib/seo";

export const getGlobalSettings = createServerFn({ method: "GET" }).handler(
  async () => {
    setResponseHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400",
    );
    try {
      const request = getRequest();
      const site = await getGlobalSiteData();
      return {
        ...site,
        siteUrl: resolveSiteUrl(site.siteUrl, request?.url),
      };
    } catch (error) {
      const { captureServerException } = await import("#/server/sentry");
      captureServerException(error, {
        tags: {
          area: "root",
          flow: "global-settings",
        },
      });
      console.error("Failed to fetch settings from DB, using defaults:", error);
      return DEFAULT_SITE_DATA;
    }
  },
);
