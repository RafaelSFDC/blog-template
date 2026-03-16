import { createFileRoute } from "@tanstack/react-router";
import { processResendWebhook } from "#/server/newsletter-campaigns";
import { captureServerException } from "#/server/sentry";
import { logOperationalEvent } from "#/server/system/operations";

export const Route = createFileRoute("/api/newsletter/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const payload = (await request.json()) as {
            type: string;
            created_at?: string;
            data?: {
              email_id?: string;
            };
          };

          const result = await processResendWebhook(payload);
          logOperationalEvent("newsletter-webhook-processed", {
            type: payload.type,
            emailId: payload.data?.email_id ?? null,
            duplicate: result?.duplicate ?? false,
          });
          return Response.json(result);
        } catch (error) {
          captureServerException(error, {
            tags: {
              area: "api",
              flow: "newsletter-webhook",
            },
            extras: {
              requestUrl: request.url,
            },
          });
          return new Response("Webhook processing failed", { status: 500 });
        }
      },
    },
  },
});
