import type { z } from "zod";
import { redirectSchema } from "#/schemas/system";
import type { RedirectFormValues } from "#/types/system";

export type { RedirectFormValues } from "#/types/system";

type RedirectInput = z.input<typeof redirectSchema>;

export function createEmptyRedirectDraft(): RedirectFormValues {
  return {
    sourcePath: "",
    destinationPath: "",
    statusCode: 301,
  };
}

export function mapRedirectToFormValues(redirect: RedirectInput): RedirectFormValues {
  return {
    id: redirect.id,
    sourcePath: redirect.sourcePath,
    destinationPath: redirect.destinationPath,
    statusCode: redirect.statusCode,
  };
}

export function validateRedirectFormValues(values: RedirectFormValues) {
  return redirectSchema.safeParse(values);
}
