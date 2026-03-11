import {
  table,
  text,
  integer,
  boolean,
  timestamp,
  autoIncrementId,
  index,
  now,
} from "./dialect";

export const user = table("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: text("role").default("reader"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  createdAt: timestamp("created_at").default(now),
  updatedAt: timestamp("updated_at").default(now),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),
  stripeCurrentPeriodEnd: timestamp("stripe_current_period_end"),
});

export const session = table(
  "sessions",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").default(now),
    updatedAt: timestamp("updated_at").default(now),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (t: any) => [index("sessions_userId_idx").on(t.userId)],
);

export const account = table(
  "accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").default(now),
    updatedAt: timestamp("updated_at").default(now),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (t: any) => [index("accounts_userId_idx").on(t.userId)],
);

export const verification = table(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").default(now),
    updatedAt: timestamp("updated_at").default(now),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (t: any) => [index("verifications_identifier_idx").on(t.identifier)],
);

export const categories = table("categories", {
  id: autoIncrementId("id"),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
});

export const tags = table("tags", {
  id: autoIncrementId("id"),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const media = table("media", {
  id: autoIncrementId("id"),
  url: text("url").notNull(),
  altText: text("alt_text"),
  filename: text("filename").notNull(),
  mimeType: text("mime_type"),
  size: integer("size"),
  createdAt: timestamp("created_at").default(now),
});

export const posts = table("posts", {
  id: autoIncrementId("id"),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  coverImage: text("cover_image"),
  featuredImageId: integer("featured_image_id").references(() => media.id),
  status: text("status").notNull().default("draft"),
  readingTime: integer("reading_time"),
  viewCount: integer("view_count").notNull().default(0),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  ogImage: text("og_image"),
  authorId: text("author_id").references(() => user.id),
  isPremium: boolean("is_premium").default(false),
  publishedAt: timestamp("published_at"),
  updatedAt: timestamp("updated_at").default(now),
});

export const pages = table(
  "pages",
  {
    id: autoIncrementId("id"),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    content: text("content").notNull(),
    status: text("status").notNull().default("draft"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    ogImage: text("og_image"),
    isHome: boolean("is_home").notNull().default(false),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").default(now),
    updatedAt: timestamp("updated_at").default(now),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (t: any) => [
    index("pages_slug_idx").on(t.slug),
    index("pages_status_idx").on(t.status),
    index("pages_is_home_idx").on(t.isHome),
  ],
);

export const comments = table(
  "comments",
  {
    id: autoIncrementId("id"),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorId: text("author_id").references(() => user.id),
    authorName: text("author_name").notNull(),
    authorEmail: text("author_email"),
    content: text("content").notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at").default(now),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (t: any) => [
    index("comments_post_id_idx").on(t.postId),
    index("comments_author_id_idx").on(t.authorId),
  ],
);

export const postCategories = table(
  "post_categories",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (t: any) => [index("post_categories_idx").on(t.postId, t.categoryId)],
);

export const postTags = table(
  "post_tags",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (t: any) => [index("post_tags_idx").on(t.postId, t.tagId)],
);

export const appSettings = table("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").default(now),
});

export const menus = table("menus", {
  id: autoIncrementId("id"),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  createdAt: timestamp("created_at").default(now),
  updatedAt: timestamp("updated_at").default(now),
});

export const menuItems = table(
  "menu_items",
  {
    id: autoIncrementId("id"),
    menuId: integer("menu_id")
      .notNull()
      .references(() => menus.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    href: text("href").notNull(),
    kind: text("kind").notNull().default("internal"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").default(now),
    updatedAt: timestamp("updated_at").default(now),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (t: any) => [
    index("menu_items_menu_id_idx").on(t.menuId),
    index("menu_items_sort_order_idx").on(t.menuId, t.sortOrder),
  ],
);

export const subscribers = table("subscribers", {
  id: autoIncrementId("id"),
  email: text("email").notNull().unique(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").default(now),
});

export const newsletters = table("newsletters", {
  id: autoIncrementId("id"),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("draft"),
  sentAt: timestamp("sent_at"),
  postId: integer("post_id").references(() => posts.id),
  createdAt: timestamp("created_at").default(now),
});

export const newsletterLogs = table("newsletter_logs", {
  id: autoIncrementId("id"),
  newsletterId: integer("newsletter_id")
    .notNull()
    .references(() => newsletters.id, { onDelete: "cascade" }),
  subscriberEmail: text("subscriber_email").notNull(),
  status: text("status").notNull().default("sent"),
  error: text("error"),
  sentAt: timestamp("sent_at").default(now),
});

export const contactMessages = table("contact_messages", {
  id: autoIncrementId("id"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject"),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at").default(now),
});

export const webhooks = table("webhooks", {
  id: autoIncrementId("id"),
  name: text("name").notNull(),
  url: text("url").notNull(),
  event: text("event").notNull().default("post.published"),
  secret: text("secret"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").default(now),
});

export const webhookDeliveries = table(
  "webhook_deliveries",
  {
    id: autoIncrementId("id"),
    webhookId: integer("webhook_id")
      .notNull()
      .references(() => webhooks.id, { onDelete: "cascade" }),
    status: integer("status"),
    success: boolean("success").notNull(),
    payload: text("payload").notNull(),
    response: text("response"),
    error: text("error"),
    duration: integer("duration"),
    createdAt: timestamp("created_at").default(now),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (t: any) => [index("webhook_deliveries_webhook_id_idx").on(t.webhookId)],
);

export const visitors = table("visitors", {
  id: text("id").primaryKey(), // Hashed IP + User Agent or a UUID from cookie
  lastSeenAt: timestamp("last_seen_at").default(now),
  createdAt: timestamp("created_at").default(now),
});

export const pageViews = table(
  "page_views",
  {
    id: autoIncrementId("id"),
    visitorId: text("visitor_id").references(() => visitors.id),
    url: text("url").notNull(),
    pathname: text("pathname").notNull(),
    referrer: text("referrer"),
    userAgent: text("user_agent"),
    browser: text("browser"),
    os: text("os"),
    device: text("device"), // mobile, desktop, tablet
    timestamp: timestamp("timestamp").default(now),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (t: any) => [
    index("page_views_visitor_id_idx").on(t.visitorId),
    index("page_views_pathname_idx").on(t.pathname),
    index("page_views_timestamp_idx").on(t.timestamp),
  ],
);
