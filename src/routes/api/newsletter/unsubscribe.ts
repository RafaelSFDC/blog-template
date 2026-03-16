import { createFileRoute } from "@tanstack/react-router";
import { unsubscribeNewsletterToken } from "#/server/newsletter-campaigns";

export const Route = createFileRoute("/api/newsletter/unsubscribe")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token");

        if (!token) {
          return new Response("Invalid unsubscribe link", { status: 400 });
        }

        try {
          const subscriber = await unsubscribeNewsletterToken(token);
          return new Response(
            `<!DOCTYPE html><html><head><title>Unsubscribed</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#fafafa;"><div style="background:white;padding:40px;border-radius:20px;box-shadow:0 10px 30px rgba(0,0,0,0.05);text-align:center;max-width:420px;"><h1>You're unsubscribed</h1><p>We've removed <strong>${subscriber.email}</strong> from future newsletter sends.</p><p><a href="/">Back to blog</a></p></div></body></html>`,
            {
              headers: { "Content-Type": "text/html" },
            },
          );
        } catch {
          return new Response("Unsubscribe failed. Please contact support.", { status: 400 });
        }
      },
    },
  },
});
