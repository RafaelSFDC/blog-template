import { createServerFn } from "@tanstack/react-start";
import { betaRequestSubmissionSchema } from "#/schemas";
import { formatLuminaBetaRequestMessage } from "#/lib/lumina-marketing";
import { captureServerEvent } from "#/server/analytics";

export function buildLuminaBetaRequestRecord(data: {
  name: string;
  email: string;
  role: "creator" | "journalist" | "publication_lead";
  publicationType: "independent_newsletter" | "digital_magazine" | "premium_blog" | "other";
  currentStack: string;
  message: string;
}) {
  return {
    subject: `[Lumina Beta] ${data.role} · ${data.publicationType}`,
    message: formatLuminaBetaRequestMessage(data),
  };
}

export const submitLuminaBetaRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => betaRequestSubmissionSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const { submitPublicInquiry } = await import("#/server/public/contact-inquiry");
      const record = buildLuminaBetaRequestRecord(data);
      const response = await submitPublicInquiry({
        name: data.name,
        email: data.email,
        subject: record.subject,
        message: record.message,
        turnstileToken: data.turnstileToken,
        scope: "lumina.beta.submit",
      });

      await captureServerEvent({
        distinctId: data.email,
        event: "lumina_beta_request_submitted",
        properties: {
          role: data.role,
          publication_type: data.publicationType,
          current_stack: data.currentStack || null,
          surface: "lumina_marketing",
        },
      });

      return response;
    } catch (error) {
      const { captureServerException } = await import("#/server/sentry");
      captureServerException(error, {
        tags: {
          area: "server",
          flow: "lumina-beta-request",
        },
        extras: {
          email: data.email,
          role: data.role,
          publicationType: data.publicationType,
        },
      });
      throw error;
    }
  });
