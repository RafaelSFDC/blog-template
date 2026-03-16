import { createFileRoute } from "@tanstack/react-router";
import { getOpenPixelResponse, recordNewsletterOpen } from "#/server/newsletter-campaigns";

export const Route = createFileRoute("/api/newsletter/open")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const deliveryId = Number(url.searchParams.get("deliveryId"));

        if (Number.isFinite(deliveryId) && deliveryId > 0) {
          await recordNewsletterOpen(deliveryId);
        }

        return getOpenPixelResponse();
      },
    },
  },
});
