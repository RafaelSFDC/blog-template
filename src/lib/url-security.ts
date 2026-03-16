const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const ALLOWED_YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

export function isSafeExternalUrl(
  value: string,
  options?: { allowMailto?: boolean; allowLocalHttp?: boolean },
) {
  try {
    const url = new URL(value);
    const protocol = url.protocol.toLowerCase();

    if (protocol === "https:") {
      return true;
    }

    if (options?.allowMailto && protocol === "mailto:") {
      return true;
    }

    if (
      options?.allowLocalHttp &&
      protocol === "http:" &&
      LOCALHOST_HOSTS.has(url.hostname.toLowerCase())
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export function assertSafeExternalUrl(
  value: string,
  options?: { allowMailto?: boolean; allowLocalHttp?: boolean; label?: string },
) {
  if (!isSafeExternalUrl(value, options)) {
    throw new Error(
      `${options?.label ?? "URL"} must use https${
        options?.allowMailto ? " or mailto" : ""
      }`,
    );
  }
}

export function sanitizeEditorLink(url: string) {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error("Link URL is required");
  }

  assertSafeExternalUrl(trimmed, {
    allowMailto: true,
    allowLocalHttp: true,
    label: "Link URL",
  });
  return trimmed;
}

export function sanitizeYoutubeUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error("YouTube URL is required");
  }

  const parsed = new URL(trimmed);
  if (
    parsed.protocol !== "https:" &&
    !(parsed.protocol === "http:" && LOCALHOST_HOSTS.has(parsed.hostname))
  ) {
    throw new Error("YouTube embeds must use a secure URL");
  }

  if (!ALLOWED_YOUTUBE_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new Error("Only YouTube embeds are allowed");
  }

  return trimmed;
}
