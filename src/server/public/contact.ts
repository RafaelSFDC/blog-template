import { createServerFn } from "@tanstack/react-start";
import { contactFormSubmissionSchema } from "#/schemas";

export const submitPublicContactForm = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => contactFormSubmissionSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const { submitPublicInquiry } = await import("#/server/public/contact-inquiry");
      return await submitPublicInquiry({
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        turnstileToken: data.turnstileToken,
        scope: "contact.submit",
      });
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
