import { createFileRoute } from "@tanstack/react-router";
import { isSafeExternalUrl } from "#/lib/url-security";
import { recordNewsletterClick } from "#/server/newsletter-campaigns";
import { isStrictEnvironment } from "#/server/system/runtime-config";

export const Route = createFileRoute("/api/newsletter/click")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const deliveryId = Number(url.searchParams.get("deliveryId"));
        const targetUrl = url.searchParams.get("url");

        if (!targetUrl) {
          return new Response("Missing target URL", { status: 400 });
        }

        const isValidTarget = isSafeExternalUrl(targetUrl, {
          allowLocalHttp: !isStrictEnvironment(),
        });

        if (!isValidTarget) {
          return new Response("Invalid target URL", { status: 400 });
        }

        if (Number.isFinite(deliveryId) && deliveryId > 0) {
          await recordNewsletterClick(deliveryId, targetUrl);
        }

        return Response.redirect(targetUrl, 302);
      },
    },
  },
});
