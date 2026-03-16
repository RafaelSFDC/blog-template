import { createFileRoute } from "@tanstack/react-router";
import { confirmNewsletterSubscriptionToken } from "#/server/newsletter-campaigns";

export const Route = createFileRoute("/api/newsletter/confirm")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token");

        if (!token) {
          return new Response("Invalid confirmation link", { status: 400 });
        }

        try {
          const subscriber = await confirmNewsletterSubscriptionToken(token);
          return new Response(
            `<!DOCTYPE html><html><head><title>Subscription Confirmed</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#fafafa;"><div style="background:white;padding:40px;border-radius:20px;box-shadow:0 10px 30px rgba(0,0,0,0.05);text-align:center;max-width:420px;"><h1>Subscription confirmed</h1><p><strong>${subscriber.email}</strong> is now active and will receive future newsletter issues.</p><p><a href="/">Back to blog</a></p></div></body></html>`,
            {
              headers: { "Content-Type": "text/html" },
            },
          );
        } catch {
          return new Response("Confirmation failed. The link may have expired.", {
            status: 400,
          });
        }
      },
    },
  },
});
