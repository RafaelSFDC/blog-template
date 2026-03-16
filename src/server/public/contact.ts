import { createServerFn } from "@tanstack/react-start";
import { db } from "#/db/index";
import { contactMessages } from "#/db/schema";
import { contactFormSchema } from "#/schemas";

export const submitPublicContactForm = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => contactFormSchema.parse(input))
  .handler(async ({ data }) => {
    try {
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
