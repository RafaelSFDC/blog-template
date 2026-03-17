import { webhookFormSchema } from "#/schemas/system";
import type { WebhookFormValues } from "#/types/forms";

export { webhookFormSchema };

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
