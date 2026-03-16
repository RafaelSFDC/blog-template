import { z } from "zod";

export const POST_STATUSES = ["draft", "in_review", "scheduled", "published", "archived"] as const;
export const PAGE_STATUSES = ["draft", "published", "private"] as const;
export const MENU_KEYS = ["primary", "footer"] as const;
export const MENU_ITEM_KINDS = ["internal", "external"] as const;
export const WEBHOOK_EVENTS = ["post.published"] as const;
export const COMMENT_STATUSES = ["approved", "spam", "pending"] as const;
export const REDIRECT_STATUS_CODES = [301, 302] as const;
export const USER_ROLES = [
  "reader",
  "author",
  "editor",
  "moderator",
  "admin",
  "super-admin",
] as const;
export const REVISION_SOURCES = ["manual", "autosave", "restore", "publish"] as const;
export const TEASER_MODES = ["excerpt", "truncate"] as const;
export const SUBSCRIPTION_STATUSES = [
  "inactive",
  "active",
  "past_due",
  "canceled",
  "expired",
] as const;
export const NEWSLETTER_CAMPAIGN_STATUSES = [
  "draft",
  "scheduled",
  "queued",
  "sending",
  "sent",
  "partial",
  "failed",
  "canceled",
] as const;
export const NEWSLETTER_DELIVERY_STATUSES = [
  "pending",
  "queued",
  "sending",
  "sent",
  "delivered",
  "opened",
  "clicked",
  "failed",
  "bounced",
  "complained",
] as const;
export const SUBSCRIBER_STATUSES = [
  "pending",
  "active",
  "unsubscribed",
  "bounced",
  "complained",
] as const;
export const NEWSLETTER_SEGMENTS = [
  "all_active",
  "premium_members",
  "free_subscribers",
] as const;
export const NEWSLETTER_CAMPAIGN_ACTIONS = ["draft", "schedule", "queue"] as const;
export const EDITORIAL_WORKFLOW_ACTIONS = [
  "request_review",
  "approve",
  "send_back",
  "schedule",
  "publish",
  "archive",
] as const;
export const POST_BULK_ACTIONS = [
  "request_review",
  "move_to_draft",
  "archive",
  "delete",
  "publish",
  "schedule",
] as const;
export const COMMENT_BULK_ACTIONS = ["approve", "spam", "pending", "delete"] as const;
export const MEDIA_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
] as const;

export const postStatusSchema = z.enum(POST_STATUSES);
export const pageStatusSchema = z.enum(PAGE_STATUSES);
export const menuKeySchema = z.enum(MENU_KEYS);
export const menuItemKindSchema = z.enum(MENU_ITEM_KINDS);
export const webhookEventSchema = z.enum(WEBHOOK_EVENTS);
export const commentStatusSchema = z.enum(COMMENT_STATUSES);
export const redirectStatusCodeSchema = z.union([z.literal(301), z.literal(302)]);
export const userRoleSchema = z.enum(USER_ROLES);
export const revisionSourceSchema = z.enum(REVISION_SOURCES);
export const editorialWorkflowActionSchema = z.enum(EDITORIAL_WORKFLOW_ACTIONS);
export const postBulkActionSchema = z.enum(POST_BULK_ACTIONS);
export const commentBulkActionSchema = z.enum(COMMENT_BULK_ACTIONS);
export const mediaImageMimeTypeSchema = z.enum(MEDIA_IMAGE_MIME_TYPES);
export const teaserModeSchema = z.enum(TEASER_MODES);
export const subscriptionStatusSchema = z.enum(SUBSCRIPTION_STATUSES);
export const newsletterCampaignStatusSchema = z.enum(NEWSLETTER_CAMPAIGN_STATUSES);
export const newsletterDeliveryStatusSchema = z.enum(NEWSLETTER_DELIVERY_STATUSES);
export const subscriberStatusSchema = z.enum(SUBSCRIBER_STATUSES);
export const newsletterSegmentSchema = z.enum(NEWSLETTER_SEGMENTS);
export const newsletterCampaignActionTypeSchema = z.enum(NEWSLETTER_CAMPAIGN_ACTIONS);

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

const trimmedString = (min: number, message: string, max: number, tooLongMessage: string) =>
  z.string().trim().min(min, message).max(max, tooLongMessage);

export const positiveIntSchema = z.number().int().positive("Invalid id");
export const recordIdSchema = z.object({
  id: positiveIntSchema,
});

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
  name: trimmedString(1, "Name is required", 80, "Name is too long"),
  slug: trimmedString(1, "Slug is required", 120, "Slug is too long"),
  description: optionalTrimmedString,
});

export const tagSchema = z.object({
  name: trimmedString(1, "Name is required", 80, "Name is too long"),
  slug: trimmedString(1, "Slug is required", 120, "Slug is too long"),
});

export const socialLinkSchema = z.object({
  platform: trimmedString(1, "Platform is required", 40, "Platform is too long"),
  url: z.string().trim().url("Must be a valid URL"),
});

export const settingsSchema = z.object({
  blogName: trimmedString(1, "Publication Name is required", 120, "Publication Name is too long"),
  blogDescription: z.string().trim().max(300, "Description is too long").catch(""),
  blogLogo: optionalUrlSchema,
  fontFamily: trimmedString(1, "Font family is required", 80, "Font family is too long"),
  themeVariant: trimmedString(1, "Theme is required", 120, "Theme is too long"),
  siteUrl: optionalUrlSchema,
  defaultMetaTitle: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().max(160, "Default meta title is too long").optional(),
  ),
  defaultMetaDescription: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().max(320, "Default meta description is too long").optional(),
  ),
  defaultOgImage: optionalUrlSchema,
  twitterHandle: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().max(50, "Twitter handle is too long").optional(),
  ),
  stripeMonthlyPriceId: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().max(255, "Monthly Stripe Price ID is too long").optional(),
  ),
  stripeAnnualPriceId: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().max(255, "Annual Stripe Price ID is too long").optional(),
  ),
  newsletterSenderEmail: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().email("Must be a valid email").max(320, "Sender email is too long").optional(),
  ),
  doubleOptInEnabled: z.boolean(),
  membershipGracePeriodDays: z.number().int().min(0).max(30),
  robotsIndexingEnabled: z.boolean(),
  socialLinks: z.array(socialLinkSchema).max(20, "Too many social links"),
});

const scheduledDateSchema = z.preprocess(
  (value) => {
    if (value === null || value === undefined || value === "") return undefined;
    return value;
  },
  z.coerce.date().optional(),
);

export const postFormSchema = z
  .object({
    title: trimmedString(1, "Title is required", 160, "Title is too long"),
    slug: z.string().trim().min(1, "Slug is required").max(160, "Slug is too long"),
    excerpt: trimmedString(1, "Excerpt is required", 320, "Excerpt is too long"),
    content: trimmedString(1, "Content is required", 500000, "Content is too long"),
    metaTitle: z.string().trim().max(160, "Meta title is too long").catch(""),
    metaDescription: z.string().trim().max(320, "Meta description is too long").catch(""),
    ogImage: z.string().trim().refine((value) => !value || z.string().url().safeParse(value).success, {
      message: "Must be a valid URL",
    }),
    isPremium: z.boolean(),
    teaserMode: teaserModeSchema,
    status: postStatusSchema,
    publishedAt: z.string(),
    editorOwnerId: z.string().trim().optional().catch(""),
    categoryIds: z.array(z.number().int().positive()).max(20, "Too many categories"),
    tagIds: z.array(z.number().int().positive()).max(50, "Too many tags"),
  })
  .superRefine((value, ctx) => {
    if (value.status === "scheduled" && !value.publishedAt.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["publishedAt"],
        message: "Scheduled posts require a publication date",
      });
    }
  });

export const pageFormSchema = z.object({
  title: trimmedString(1, "Title is required", 160, "Title is too long"),
  slug: z.string().trim().min(1, "Slug is required").max(160, "Slug is too long"),
  excerpt: z.string().trim().max(320, "Excerpt is too long").catch(""),
  content: trimmedString(1, "Content is required", 500000, "Content is too long"),
  metaTitle: z.string().trim().max(160, "Meta title is too long").catch(""),
  metaDescription: z.string().trim().max(320, "Meta description is too long").catch(""),
  ogImage: z.string().trim().refine((value) => !value || z.string().url().safeParse(value).success, {
    message: "Must be a valid URL",
  }),
  isPremium: z.boolean(),
  teaserMode: teaserModeSchema,
  status: pageStatusSchema,
  isHome: z.boolean(),
  useVisualBuilder: z.boolean(),
});

export const postServerSchema = z
  .object({
    id: z.number().int().positive().optional(),
    title: trimmedString(1, "Title is required", 160, "Title is too long"),
    slug: optionalTrimmedString,
    excerpt: trimmedString(1, "Excerpt is required", 320, "Excerpt is too long"),
    content: trimmedString(1, "Content is required", 500000, "Content is too long"),
    metaTitle: z.preprocess(emptyStringToUndefined, z.string().trim().max(160, "Meta title is too long").optional()),
    metaDescription: z.preprocess(emptyStringToUndefined, z.string().trim().max(320, "Meta description is too long").optional()),
    ogImage: optionalUrlSchema,
    isPremium: z.boolean(),
    teaserMode: teaserModeSchema,
    status: postStatusSchema,
    publishedAt: scheduledDateSchema,
    editorOwnerId: z.preprocess(emptyStringToUndefined, z.string().trim().optional()),
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
  title: trimmedString(1, "Title is required", 160, "Title is too long"),
  slug: optionalTrimmedString,
  excerpt: z.preprocess(emptyStringToUndefined, z.string().trim().max(320, "Excerpt is too long").optional()),
  content: trimmedString(1, "Content is required", 500000, "Content is too long"),
  metaTitle: z.preprocess(emptyStringToUndefined, z.string().trim().max(160, "Meta title is too long").optional()),
  metaDescription: z.preprocess(emptyStringToUndefined, z.string().trim().max(320, "Meta description is too long").optional()),
  ogImage: optionalUrlSchema,
  isPremium: z.boolean(),
  teaserMode: teaserModeSchema,
  status: pageStatusSchema,
  isHome: z.boolean(),
  useVisualBuilder: z.boolean().optional(),
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

export const newsletterSubscribeSchema = z.object({
  email: z.string().trim().email("Must be a valid email").max(320, "Email is too long"),
  source: z.preprocess(emptyStringToUndefined, z.string().trim().max(120).optional()),
});

export const newsletterCampaignSchema = z.object({
  subject: trimmedString(1, "Subject is required", 200, "Subject is too long"),
  preheader: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().max(255, "Preheader is too long").optional(),
  ),
  content: trimmedString(1, "Content is required", 200000, "Content is too long"),
  postId: z.number().int().positive().optional(),
  segment: newsletterSegmentSchema,
  scheduledAt: scheduledDateSchema,
});

export const newsletterCampaignActionSchema = z.object({
  newsletterId: positiveIntSchema,
  action: newsletterCampaignActionTypeSchema,
  scheduledAt: scheduledDateSchema,
});

export const contactFormSchema = z.object({
  name: trimmedString(1, "Full name required", 120, "Name is too long"),
  email: z.string().trim().email("Invalid email").max(320, "Email is too long"),
  subject: trimmedString(3, "Subject too short", 160, "Subject is too long"),
  message: trimmedString(10, "Message too short", 5000, "Message is too long"),
});

export const publicCommentSchema = z.object({
  postId: positiveIntSchema,
  authorName: trimmedString(1, "Author name is required", 120, "Author name is too long"),
  authorEmail: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().email("Must be a valid email").max(320, "Email is too long").optional(),
  ),
  content: trimmedString(3, "Comment is too short", 5000, "Comment is too long"),
});

export const commentStatusUpdateSchema = z.object({
  id: positiveIntSchema,
  status: commentStatusSchema,
});

export const webhookCreateSchema = z.object({
  name: trimmedString(1, "Name is required", 120, "Name is too long"),
  url: z.string().trim().url("Must be a valid URL").max(2048, "URL is too long"),
  event: webhookEventSchema,
  secret: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().max(255, "Secret is too long").optional(),
  ),
});

export const webhookToggleSchema = z.object({
  id: positiveIntSchema,
  isActive: z.boolean(),
});

const pathStringSchema = z
  .string()
  .trim()
  .min(1, "Path is required")
  .max(2048, "Path is too long");

export const redirectSchema = z
  .object({
    id: positiveIntSchema.optional(),
    sourcePath: pathStringSchema,
    destinationPath: pathStringSchema,
    statusCode: redirectStatusCodeSchema,
  })
  .superRefine((value, ctx) => {
    if (!value.sourcePath.startsWith("/")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourcePath"],
        message: "Source path must start with /",
      });
    }

    const isInternalDestination = value.destinationPath.startsWith("/");
    const isExternalDestination = z.string().url().safeParse(value.destinationPath).success;

    if (!isInternalDestination && !isExternalDestination) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["destinationPath"],
        message: "Destination must be an internal path or valid URL",
      });
    }
  });

export const mediaUploadSchema = z.object({
  filename: trimmedString(1, "A file is required", 255, "Filename is too long"),
  mimeType: mediaImageMimeTypeSchema,
  size: z.number().int().positive("A file is required").max(10 * 1024 * 1024, "File is too large"),
  altText: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().max(255, "Alt text is too long").optional(),
  ),
});

export const invitationCreateSchema = z.object({
  email: z.string().trim().email("Must be a valid email").max(320, "Email is too long"),
  role: z.enum(["author", "editor", "moderator", "admin", "super-admin"]),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});

export const invitationAcceptSchema = z.object({
  token: z.string().trim().min(16, "Invalid invitation token"),
});

export const postWorkflowActionInputSchema = z.object({
  id: positiveIntSchema,
  action: editorialWorkflowActionSchema,
  scheduledFor: scheduledDateSchema,
  editorOwnerId: z.preprocess(emptyStringToUndefined, z.string().trim().optional()),
});

export const bulkPostActionSchema = z
  .object({
    ids: z.array(positiveIntSchema).min(1, "Select at least one post").max(100),
    action: postBulkActionSchema,
    scheduledFor: scheduledDateSchema,
  })
  .superRefine((value, ctx) => {
    if (value.action === "schedule" && !value.scheduledFor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scheduledFor"],
        message: "Scheduled posts require a publication date",
      });
    }
  });

export const editorialCommentCreateSchema = z.object({
  postId: positiveIntSchema,
  content: trimmedString(2, "Comment is too short", 5000, "Comment is too long"),
});

export const editorialCommentResolveSchema = z.object({
  commentId: positiveIntSchema,
});

export const editorialChecklistUpdateSchema = z.object({
  postId: positiveIntSchema,
  itemKey: trimmedString(1, "Checklist item required", 80, "Checklist item is too long"),
  isCompleted: z.boolean(),
});

export const dashboardPostsFilterSchema = z.object({
  status: z.preprocess(emptyStringToUndefined, postStatusSchema.optional()),
  authorId: z.preprocess(emptyStringToUndefined, z.string().trim().optional()),
  editorOwnerId: z.preprocess(emptyStringToUndefined, z.string().trim().optional()),
  taxonomyId: z.preprocess((value) => (value === "" ? undefined : value), z.coerce.number().int().positive().optional()),
  taxonomyType: z.preprocess(emptyStringToUndefined, z.enum(["category", "tag"]).optional()),
  visibility: z.preprocess(emptyStringToUndefined, z.enum(["mine", "team", "all"]).optional()),
  query: z.preprocess(emptyStringToUndefined, z.string().trim().max(120).optional()),
  from: scheduledDateSchema,
  to: scheduledDateSchema,
});

export const bulkCommentActionSchema = z.object({
  ids: z.array(positiveIntSchema).min(1, "Select at least one comment").max(100),
  action: commentBulkActionSchema,
});

export const bulkMediaDeleteSchema = z.object({
  ids: z.array(positiveIntSchema).min(1, "Select at least one media item").max(100),
});

export const stripeCheckoutSchema = z.object({
  planSlug: z.enum(["monthly", "annual"]).optional(),
  priceId: z.preprocess(emptyStringToUndefined, z.string().trim().min(1).optional()),
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
    if (message.includes("email")) {
      return `${entityName} email already exists`;
    }
    if (message.includes("url")) {
      return `${entityName} URL already exists`;
    }
    return `${entityName} slug already exists`;
  }
  return null;
}
