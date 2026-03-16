import { db } from "#/db/index";
import { webhooks, webhookDeliveries } from "#/db/schema";
import { eq, and, type InferSelectModel } from "drizzle-orm";
import { type z } from "zod";
import * as schema from "#/db/schema";
import { webhookEventSchema } from "#/schemas/system";

type Webhook = InferSelectModel<typeof schema.webhooks>;

export type WebhookEvent = z.infer<typeof webhookEventSchema>;

export async function triggerWebhook(event: WebhookEvent, payload: unknown) {
  const activeWebhooks = await db.query.webhooks.findMany({
    where: and(eq(webhooks.event, event), eq(webhooks.isActive, true)),
  });

  if (activeWebhooks.length === 0) return;

  const deliveryPromises = activeWebhooks.map(async (webhook: Webhook) => {
    const startTime = Date.now();
    let status: number | null = null;
    let success = false;
    let responseText = null;
    let errorText = null;

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Event": event,
          ...(webhook.secret && { "X-Webhook-Secret": webhook.secret }),
        },
        body: JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          data: payload,
        }),
      });

      status = response.status;
      success = response.ok;
      responseText = await response.text();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      success = false;
      errorText = errorMsg;
    } finally {
      const duration = Date.now() - startTime;

      await db.insert(webhookDeliveries).values({
        webhookId: webhook.id,
        status,
        success,
        payload: JSON.stringify(payload),
        response: responseText,
        error: errorText,
        duration,
      });
    }
  });

  // We don't necessarily want to block the main process, but we want them to start
  // In a serverless env, we might need to wait or use event.waitUntil
  await Promise.allSettled(deliveryPromises);
}
