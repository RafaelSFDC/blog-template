export type ObservabilityTags = Record<
  string,
  string | number | boolean | null | undefined
>;

export type ObservabilityUser = {
  id?: string;
  email?: string;
  username?: string;
};

export type ObservabilityContext = {
  tags?: ObservabilityTags;
  extras?: Record<string, unknown>;
  user?: ObservabilityUser | null;
  fingerprint?: string[];
};

export function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string") {
    return new Error(error);
  }

  try {
    return new Error(JSON.stringify(error));
  } catch {
    return new Error("Unknown error");
  }
}

export function normalizeObservabilityTags(tags?: ObservabilityTags) {
  if (!tags) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(tags)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)]),
  );
}
