import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { db } from "#/db/index";
import { contactMessages } from "#/db/schema";
import { contactFormSubmissionSchema } from "#/schemas";
import { enforceRateLimit } from "#/server/security/rate-limit";
import { getSecurityRequestMetadata } from "#/server/security/request";
import { verifyTurnstileToken } from "#/server/integrations/turnstile";
import { logSecurityEvent } from "#/server/security/events";

export const submitPublicContactForm = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => contactFormSubmissionSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const request = getRequest();
      if (!request) {
        throw new Error("Request context unavailable");
      }

      const decision = await enforceRateLimit({
        scope: "contact.submit",
        request,
        keyParts: [data.email.toLowerCase()],
        limit: 5,
        windowMs: 15 * 60 * 1000,
      });

      if (!decision.allowed) {
        throw new Error("Too many contact requests. Please try again later.");
      }

      const metadata = getSecurityRequestMetadata(request);
      const verification = await verifyTurnstileToken({
        token: data.turnstileToken,
        ip: metadata.ip,
      });

      if (!verification.success) {
        await logSecurityEvent({
          type: "turnstile.failed",
          scope: "contact.submit",
          ipHash: metadata.ipHash,
          userAgent: metadata.userAgentShort,
          metadata: {
            email: data.email.toLowerCase(),
            errors: verification.errors ?? [],
          },
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        throw new Error("Security verification failed. Please try again.");
      }

      await db.insert(contactMessages).values({
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        status: "new",
      });
      return { success: true as const };
    } catch (error) {
      const { captureServerException } = await import("#/server/sentry");
      captureServerException(error, {
        tags: {
          area: "server",
          flow: "contact-form",
        },
        extras: {
          email: data.email,
          subject: data.subject,
        },
      });
      throw error;
    }
  });
