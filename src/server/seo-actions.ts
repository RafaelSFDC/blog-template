import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { getGlobalSiteData } from "#/server/system/site-data";
import { resolveSiteUrl } from "#/lib/seo";

export const getSeoSiteData = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getRequest();
    const site = await getGlobalSiteData();

    return {
      ...site,
      siteUrl: resolveSiteUrl(site.siteUrl, request?.url),
    };
  },
);
