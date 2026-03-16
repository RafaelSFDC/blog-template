export const MEDIA_PRESETS = {
  sm: 480,
  md: 768,
  lg: 1280,
  og: 1200,
} as const;

export type MediaPreset = keyof typeof MEDIA_PRESETS;

function isAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

export function getResponsiveMediaUrl(filenameOrUrl: string | null | undefined, preset: MediaPreset) {
  if (!filenameOrUrl) {
    return null;
  }

  if (isAbsoluteUrl(filenameOrUrl)) {
    const url = new URL(filenameOrUrl);
    url.searchParams.set("preset", preset);
    return url.toString();
  }

  return `/api/media/${filenameOrUrl}?preset=${preset}`;
}

export function buildResponsiveMediaSet(filenameOrUrl: string | null | undefined) {
  if (!filenameOrUrl) {
    return null;
  }

  const src = getResponsiveMediaUrl(filenameOrUrl, "lg");
  const srcSet = (Object.keys(MEDIA_PRESETS) as MediaPreset[])
    .map((preset) => `${getResponsiveMediaUrl(filenameOrUrl, preset)} ${MEDIA_PRESETS[preset]}w`)
    .join(", ");

  return {
    src,
    srcSet,
    sizes: "(max-width: 768px) 100vw, 50vw",
    ogImage: getResponsiveMediaUrl(filenameOrUrl, "og"),
  };
}

export function getMediaFallbackLabel(title: string, category?: string | null) {
  return category || title.slice(0, 32) || "Lumina";
}
