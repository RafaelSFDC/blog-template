import { z } from "zod";

export const POST_STATUSES = ["draft", "published", "scheduled", "private"] as const;
export const PAGE_STATUSES = ["draft", "published", "private"] as const;
export const MENU_KEYS = ["primary", "footer"] as const;
export const MENU_ITEM_KINDS = ["internal", "external"] as const;

export const postStatusSchema = z.enum(POST_STATUSES);
export const pageStatusSchema = z.enum(PAGE_STATUSES);
export const menuKeySchema = z.enum(MENU_KEYS);
export const menuItemKindSchema = z.enum(MENU_ITEM_KINDS);

function emptyStringToUndefined(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

const optionalTrimmedString = z.preprocess(
  emptyStringToUndefined,
  z.string().trim().optional(),
);

const optionalUrlSchema = z.preprocess(
  emptyStringToUndefined,
  z.string().trim().url("Must be a valid URL").optional(),
);

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function normalizeSlug(rawSlug: string | undefined, fallback: string) {
  return slugify(rawSlug && rawSlug.trim().length > 0 ? rawSlug : fallback);
}

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80, "Name is too long"),
  slug: z.string().trim().min(1, "Slug is required").max(120, "Slug is too long"),
  description: optionalTrimmedString,
});

export const tagSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80, "Name is too long"),
  slug: z.string().trim().min(1, "Slug is required").max(120, "Slug is too long"),
});

export const socialLinkSchema = z.object({
  platform: z.string().trim().min(1, "Platform is required").max(40, "Platform is too long"),
  url: z.string().trim().url("Must be a valid URL"),
});

export const settingsSchema = z.object({
  blogName: z.string().trim().min(1, "Publication Name is required").max(120, "Publication Name is too long"),
  blogDescription: z.string().trim().max(300, "Description is too long").catch(""),
  blogLogo: optionalUrlSchema,
  fontFamily: z.string().trim().min(1, "Font family is required").max(80, "Font family is too long"),
  themeVariant: z.string().trim().min(1, "Theme is required").max(120, "Theme is too long"),
  socialLinks: z.array(socialLinkSchema).max(20, "Too many social links"),
});

const scheduledDateSchema = z.preprocess(
  (value) => {
    if (value === null || value === undefined || value === "") return undefined;
    return value;
  },
  z.coerce.date().optional(),
);

export const postServerSchema = z
  .object({
    id: z.number().int().positive().optional(),
    title: z.string().trim().min(1, "Title is required").max(160, "Title is too long"),
    slug: optionalTrimmedString,
    excerpt: z.string().trim().min(1, "Excerpt is required").max(320, "Excerpt is too long"),
    content: z.string().trim().min(1, "Content is required"),
    metaTitle: optionalTrimmedString,
    metaDescription: optionalTrimmedString,
    ogImage: optionalUrlSchema,
    isPremium: z.boolean(),
    status: postStatusSchema,
    publishedAt: scheduledDateSchema,
    categoryIds: z.array(z.number().int().positive()).max(20, "Too many categories"),
    tagIds: z.array(z.number().int().positive()).max(50, "Too many tags"),
  })
  .superRefine((value, ctx) => {
    if (value.status === "scheduled" && !value.publishedAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["publishedAt"],
        message: "Scheduled posts require a publication date",
      });
    }
  });

export const pageServerSchema = z.object({
  id: z.number().int().positive().optional(),
  title: z.string().trim().min(1, "Title is required").max(160, "Title is too long"),
  slug: optionalTrimmedString,
  excerpt: optionalTrimmedString,
  content: z.string().trim().min(1, "Content is required"),
  metaTitle: optionalTrimmedString,
  metaDescription: optionalTrimmedString,
  ogImage: optionalUrlSchema,
  status: pageStatusSchema,
  isHome: z.boolean(),
  publishedAt: scheduledDateSchema,
});

export const menuItemSchema = z.object({
  id: z.number().int().positive().optional(),
  label: z.string().trim().min(1, "Label is required").max(60, "Label is too long"),
  href: z.string().trim().min(1, "Link is required").max(500, "Link is too long"),
  kind: menuItemKindSchema,
  sortOrder: z.number().int().min(0).max(999),
});

export const menuUpdateSchema = z.object({
  key: menuKeySchema,
  items: z.array(menuItemSchema).max(30, "Too many menu items"),
});

export function assertMenuHref(kind: z.infer<typeof menuItemKindSchema>, href: string) {
  if (kind === "internal") {
    if (!href.startsWith("/")) {
      throw new Error("Internal menu links must start with /");
    }
    return;
  }

  try {
    new URL(href);
  } catch {
    throw new Error("External menu links must use a valid URL");
  }
}

export function getFriendlyDbError(error: unknown, entityName: string) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (message.includes("unique") || message.includes("duplicate")) {
    return `${entityName} slug already exists`;
  }
  return null;
}
