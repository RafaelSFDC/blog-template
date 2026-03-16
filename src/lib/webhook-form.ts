import { z } from "zod";
import type { WebhookFormValues } from "#/types/forms";

export const webhookFormSchema = z.object({
  name: z.string(),
  url: z.string(),
  event: z.literal("post.published"),
  secret: z.string(),
});

export const defaultWebhookFormValues: WebhookFormValues = {
  name: "",
  url: "",
  event: "post.published",
  secret: "",
};

export function normalizeWebhookFormValues(
  values: WebhookFormValues,
): WebhookFormValues {
  return {
    name: values.name.trim(),
    url: values.url.trim(),
    event: values.event,
    secret: values.secret.trim(),
  };
}
