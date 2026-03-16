import type { Data } from "@puckeditor/core";

const DEFAULT_PAGE_BUILDER_DATA: Data = {
  content: [],
  root: {},
};

export function createDefaultPageBuilderData(input?: {
  title?: string;
  description?: string;
}): Data {
  const title = input?.title?.trim() || "New page";
  const description =
    input?.description?.trim() ||
    "Use the visual builder to compose sections, calls to action, and feature highlights.";

  return {
    root: {},
    content: [
      {
        type: "LaunchHero",
        props: {
          badge: "New page",
          title,
          description,
          primaryCtaText: "",
          primaryCtaHref: "",
          secondaryCtaText: "",
          secondaryCtaHref: "",
        },
      },
    ],
  };
}

export function parsePuckData(content: string): Data | null {
  const trimmed = content.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as Data;
    if (
      parsed &&
      typeof parsed === "object" &&
      "content" in parsed &&
      Array.isArray(parsed.content)
    ) {
      return {
        ...DEFAULT_PAGE_BUILDER_DATA,
        ...parsed,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function isPuckPageContent(content: string) {
  return parsePuckData(content) !== null;
}

export function getPageBuilderData(input: {
  content?: string;
  title?: string;
  description?: string;
}): Data {
  return (
    parsePuckData(input.content ?? "") ??
    createDefaultPageBuilderData({
      title: input.title,
      description: input.description,
    })
  );
}

export function serializePuckData(data: Data) {
  return JSON.stringify(data);
}
