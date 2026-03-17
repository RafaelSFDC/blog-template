import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyResendWebhookRequest } from "#/routes/api/newsletter/webhook";
import { withIsolatedDatabase } from "../helpers/sqlite-test-db";

function signSvix(secret: string, id: string, timestamp: string, payload: string) {
  const normalizedSecret = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const signedPayload = `${id}.${timestamp}.${payload}`;
  const digest = createHmac("sha256", Buffer.from(normalizedSecret, "base64"))
    .update(signedPayload)
    .digest("base64");
  return `v1,${digest}`;
}

describe("newsletter webhook security integration", () => {
  it("accepts a valid svix signature within the timestamp window", () => {
    const payload = JSON.stringify({ type: "email.delivered", data: { email_id: "x-1" } });
    const secret = "whsec_dGVzdC1zZWNyZXQ=";
    const timestamp = "1735689600";
    const signature = signSvix(secret, "msg_1", timestamp, payload);

    const result = verifyResendWebhookRequest({
      payload,
      secret,
      headers: {
        id: "msg_1",
        timestamp,
        signature,
      },
      now: 1735689600 * 1000,
    });

    expect(result).toEqual({ valid: true });
  });

  it("rejects invalid signature", () => {
    const payload = JSON.stringify({ type: "email.delivered", data: { email_id: "x-2" } });

    const result = verifyResendWebhookRequest({
      payload,
      secret: "whsec_dGVzdC1zZWNyZXQ=",
      headers: {
        id: "msg_2",
        timestamp: "1735689600",
        signature: "v1,invalid",
      },
      now: 1735689600 * 1000,
    });

    expect(result).toEqual({ valid: false, reason: "invalid_signature" });
  });

  it("rejects expired timestamps", () => {
    const payload = JSON.stringify({ type: "email.delivered", data: { email_id: "x-3" } });
    const secret = "whsec_dGVzdC1zZWNyZXQ=";
    const signature = signSvix(secret, "msg_3", "1735689600", payload);

    const result = verifyResendWebhookRequest({
      payload,
      secret,
      headers: {
        id: "msg_3",
        timestamp: "1735689600",
        signature,
      },
      now: 1735689600 * 1000 + 11 * 60 * 1000,
    });

    expect(result).toEqual({ valid: false, reason: "expired_timestamp" });
  });

  it("rejects replayed webhook requests for the same svix event id", async () => {
    await withIsolatedDatabase("newsletter-webhook-replay", async () => {
      const previousSecret = process.env.RESEND_WEBHOOK_SECRET;
      process.env.RESEND_WEBHOOK_SECRET = "whsec_dGVzdC1zZWNyZXQ=";

      try {
        const { Route } = await import("#/routes/api/newsletter/webhook");
        const handler = (Route as unknown as {
          options?: {
            server?: {
              handlers?: {
                POST?: (input: { request: Request }) => Promise<Response>;
              };
            };
          };
        }).options?.server?.handlers?.POST;

        expect(handler).toBeTypeOf("function");

        const body = JSON.stringify({
          type: "email.delivered",
          created_at: "2026-03-17T12:00:00.000Z",
          data: { email_id: "email-1" },
        });

        const timestamp = String(Math.floor(Date.now() / 1000));
        const signature = signSvix(process.env.RESEND_WEBHOOK_SECRET, "msg_replay", timestamp, body);

        const firstResponse = await handler!({
          request: new Request("http://localhost:3000/api/newsletter/webhook", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "svix-id": "msg_replay",
              "svix-timestamp": timestamp,
              "svix-signature": signature,
            },
            body,
          }),
        });

        const secondResponse = await handler!({
          request: new Request("http://localhost:3000/api/newsletter/webhook", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "svix-id": "msg_replay",
              "svix-timestamp": timestamp,
              "svix-signature": signature,
            },
            body,
          }),
        });

        expect(firstResponse.status).toBe(200);
        expect(secondResponse.status).toBe(409);
      } finally {
        if (previousSecret === undefined) {
          Reflect.deleteProperty(process.env, "RESEND_WEBHOOK_SECRET");
        } else {
          process.env.RESEND_WEBHOOK_SECRET = previousSecret;
        }
      }
    });
  }, 15000);
});
