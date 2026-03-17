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
import { relations } from "drizzle-orm";


export const user = table("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: text("role").default("reader"),
  publicAuthorSlug: text("public_author_slug").unique(),
  authorBio: text("author_bio"),
  authorHeadline: text("author_headline"),
  authorSeoTitle: text("author_seo_title"),
  authorSeoDescription: text("author_seo_description"),
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
  (t) => [index("sessions_userId_idx").on(t.userId)],
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
  (t) => [index("accounts_userId_idx").on(t.userId)],
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
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
);

export const categories = table("categories", {
  id: autoIncrementId("id"),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  seoNoIndex: boolean("seo_no_index").notNull().default(false),
});

export const tags = table("tags", {
  id: autoIncrementId("id"),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  seoNoIndex: boolean("seo_no_index").notNull().default(false),
});

export const media = table("media", {
  id: autoIncrementId("id"),
  url: text("url").notNull(),
  altText: text("alt_text"),
  filename: text("filename").notNull(),
  mimeType: text("mime_type"),
  size: integer("size"),
  width: integer("width"),
  height: integer("height"),
  placeholderData: text("placeholder_data"),
  variantsJson: text("variants_json"),
  ownerId: text("owner_id").references(() => user.id, { onDelete: "set null" }),
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
  seoNoIndex: boolean("seo_no_index").notNull().default(false),
  authorId: text("author_id").references(() => user.id),
  editorOwnerId: text("editor_owner_id").references(() => user.id, { onDelete: "set null" }),
  isPremium: boolean("is_premium").default(false),
  teaserMode: text("teaser_mode").notNull().default("excerpt"),
  commentsEnabled: boolean("comments_enabled").notNull().default(true),
  reviewRequestedAt: timestamp("review_requested_at"),
  reviewRequestedBy: text("review_requested_by").references(() => user.id, { onDelete: "set null" }),
  lastReviewedAt: timestamp("last_reviewed_at"),
  lastReviewedBy: text("last_reviewed_by").references(() => user.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  approvedBy: text("approved_by").references(() => user.id, { onDelete: "set null" }),
  scheduledAt: timestamp("scheduled_at"),
  archivedAt: timestamp("archived_at"),
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
  seoNoIndex: boolean("seo_no_index").notNull().default(false),
  isPremium: boolean("is_premium").notNull().default(false),
    teaserMode: text("teaser_mode").notNull().default("excerpt"),
    isHome: boolean("is_home").notNull().default(false),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").default(now),
    updatedAt: timestamp("updated_at").default(now),
  },(t) => [
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
    sourceIpHash: text("source_ip_hash"),
    userAgent: text("user_agent"),
    spamReason: text("spam_reason"),
    content: text("content").notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at").default(now),
  },(t) => [
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
  },(t) => [index("post_categories_idx").on(t.postId, t.categoryId)],
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
  },(t) => [index("post_tags_idx").on(t.postId, t.tagId)],
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
  },(t) => [
    index("menu_items_menu_id_idx").on(t.menuId),
    index("menu_items_sort_order_idx").on(t.menuId, t.sortOrder),
  ],
);

export const subscribers = table("subscribers", {
  id: autoIncrementId("id"),
  email: text("email").notNull().unique(),
  status: text("status").notNull().default("active"),
  source: text("source"),
  confirmedAt: timestamp("confirmed_at"),
  unsubscribedAt: timestamp("unsubscribed_at"),
  lastEmailSentAt: timestamp("last_email_sent_at"),
  lastOpenedAt: timestamp("last_opened_at"),
  lastClickedAt: timestamp("last_clicked_at"),
  createdAt: timestamp("created_at").default(now),
});

export const newsletters = table("newsletters", {
  id: autoIncrementId("id"),
  subject: text("subject").notNull(),
  preheader: text("preheader"),
  content: text("content").notNull(),
  status: text("status").notNull().default("draft"),
  segment: text("segment").notNull().default("all_active"),
  scheduledAt: timestamp("scheduled_at"),
  queuedAt: timestamp("queued_at"),
  sendingStartedAt: timestamp("sending_started_at"),
  sendingCompletedAt: timestamp("sending_completed_at"),
  canceledAt: timestamp("canceled_at"),
  totalRecipients: integer("total_recipients").notNull().default(0),
  sentCount: integer("sent_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  openCount: integer("open_count").notNull().default(0),
  clickCount: integer("click_count").notNull().default(0),
  sentAt: timestamp("sent_at"),
  postId: integer("post_id").references(() => posts.id),
  createdAt: timestamp("created_at").default(now),
});

export const newsletterDeliveries = table(
  "newsletter_deliveries",
  {
    id: autoIncrementId("id"),
    newsletterId: integer("newsletter_id")
      .notNull()
      .references(() => newsletters.id, { onDelete: "cascade" }),
    subscriberId: integer("subscriber_id")
      .notNull()
      .references(() => subscribers.id, { onDelete: "cascade" }),
    subscriberEmail: text("subscriber_email").notNull(),
    status: text("status").notNull().default("pending"),
    resendEmailId: text("resend_email_id"),
    lastEventId: text("last_event_id"),
    attemptCount: integer("attempt_count").notNull().default(0),
    lastError: text("last_error"),
    sentAt: timestamp("sent_at"),
    deliveredAt: timestamp("delivered_at"),
    openedAt: timestamp("opened_at"),
    clickedAt: timestamp("clicked_at"),
    bouncedAt: timestamp("bounced_at"),
    complainedAt: timestamp("complained_at"),
    failedAt: timestamp("failed_at"),
    lastAttemptAt: timestamp("last_attempt_at"),
    createdAt: timestamp("created_at").default(now),
    updatedAt: timestamp("updated_at").default(now),
  },(t) => [
    index("newsletter_deliveries_newsletter_id_idx").on(t.newsletterId),
    index("newsletter_deliveries_subscriber_id_idx").on(t.subscriberId),
    index("newsletter_deliveries_status_idx").on(t.status),
    index("newsletter_deliveries_resend_email_id_idx").on(t.resendEmailId),
  ],
);

export const subscriberEvents = table(
  "subscriber_events",
  {
    id: autoIncrementId("id"),
    subscriberId: integer("subscriber_id")
      .notNull()
      .references(() => subscribers.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    metadataJson: text("metadata_json"),
    createdAt: timestamp("created_at").default(now),
  },(t) => [
    index("subscriber_events_subscriber_id_idx").on(t.subscriberId),
    index("subscriber_events_type_idx").on(t.type),
    index("subscriber_events_created_at_idx").on(t.createdAt),
  ],
);

export const newsletterConsents = table(
  "newsletter_consents",
  {
    id: autoIncrementId("id"),
    subscriberId: integer("subscriber_id").references(() => subscribers.id, {
      onDelete: "set null",
    }),
    email: text("email").notNull(),
    source: text("source"),
    status: text("status").notNull(),
    lawfulBasis: text("lawful_basis").notNull().default("consent"),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").default(now),
  },(t) => [
    index("newsletter_consents_subscriber_id_idx").on(t.subscriberId),
    index("newsletter_consents_email_idx").on(t.email),
    index("newsletter_consents_status_idx").on(t.status),
    index("newsletter_consents_created_at_idx").on(t.createdAt),
  ],
);

export const rateLimitEvents = table(
  "rate_limit_events",
  {
    id: autoIncrementId("id"),
    scope: text("scope").notNull(),
    identifierHash: text("identifier_hash").notNull(),
    keyJson: text("key_json"),
    createdAt: timestamp("created_at").default(now),
    expiresAt: timestamp("expires_at").notNull(),
  },(t) => [
    index("rate_limit_events_scope_identifier_idx").on(t.scope, t.identifierHash),
    index("rate_limit_events_expires_at_idx").on(t.expiresAt),
    index("rate_limit_events_created_at_idx").on(t.createdAt),
  ],
);

export const securityEvents = table(
  "security_events",
  {
    id: autoIncrementId("id"),
    type: text("type").notNull(),
    scope: text("scope"),
    identifierHash: text("identifier_hash"),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    metadataJson: text("metadata_json"),
    createdAt: timestamp("created_at").default(now),
    expiresAt: timestamp("expires_at"),
  },(t) => [
    index("security_events_type_idx").on(t.type),
    index("security_events_scope_idx").on(t.scope),
    index("security_events_expires_at_idx").on(t.expiresAt),
    index("security_events_created_at_idx").on(t.createdAt),
  ],
);

export const membershipPlans = table(
  "membership_plans",
  {
    id: autoIncrementId("id"),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    interval: text("interval").notNull(),
    stripePriceId: text("stripe_price_id").unique(),
    priceCents: integer("price_cents"),
    currency: text("currency").notNull().default("usd"),
    isActive: boolean("is_active").notNull().default(true),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at").default(now),
    updatedAt: timestamp("updated_at").default(now),
  },(t) => [
    index("membership_plans_slug_idx").on(t.slug),
    index("membership_plans_active_idx").on(t.isActive),
  ],
);

export const subscriptions = table(
  "subscriptions",
  {
    id: autoIncrementId("id"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    membershipPlanId: integer("membership_plan_id").references(() => membershipPlans.id, {
      onDelete: "set null",
    }),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    stripePriceId: text("stripe_price_id"),
    status: text("status").notNull().default("inactive"),
    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    canceledAt: timestamp("canceled_at"),
    endedAt: timestamp("ended_at"),
    gracePeriodEndsAt: timestamp("grace_period_ends_at"),
    createdAt: timestamp("created_at").default(now),
    updatedAt: timestamp("updated_at").default(now),
  },(t) => [
    index("subscriptions_user_id_idx").on(t.userId),
    index("subscriptions_status_idx").on(t.status),
    index("subscriptions_stripe_subscription_id_idx").on(t.stripeSubscriptionId),
  ],
);

export const subscriptionEvents = table(
  "subscription_events",
  {
    id: autoIncrementId("id"),
    subscriptionId: integer("subscription_id").references(() => subscriptions.id, {
      onDelete: "set null",
    }),
    stripeEventId: text("stripe_event_id").notNull().unique(),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    type: text("type").notNull(),
    payloadJson: text("payload_json").notNull(),
    processedAt: timestamp("processed_at").default(now),
    createdAt: timestamp("created_at").default(now),
  },(t) => [
    index("subscription_events_subscription_id_idx").on(t.subscriptionId),
    index("subscription_events_type_idx").on(t.type),
    index("subscription_events_stripe_subscription_id_idx").on(t.stripeSubscriptionId),
  ],
);

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
  messageType: text("message_type").notNull().default("general"),
  sourcePath: text("source_path"),
  source: text("source"),
  metadataJson: text("metadata_json"),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at").default(now),
});

export const betaOpsAccounts = table(
  "beta_ops_accounts",
  {
    id: autoIncrementId("id"),
    contactMessageId: integer("contact_message_id").references(() => contactMessages.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    publicationName: text("publication_name"),
    role: text("role"),
    publicationType: text("publication_type"),
    currentStack: text("current_stack"),
    accountStage: text("account_stage").notNull().default("new_lead"),
    onboardingStatus: text("onboarding_status").notNull().default("not_started"),
    priority: text("priority").notNull().default("medium"),
    ownerUserId: text("owner_user_id").references(() => user.id, { onDelete: "set null" }),
    notes: text("notes"),
    sourcePath: text("source_path"),
    source: text("source"),
    nextFollowUpAt: timestamp("next_follow_up_at"),
    lastContactedAt: timestamp("last_contacted_at"),
    createdAt: timestamp("created_at").default(now),
    updatedAt: timestamp("updated_at").default(now),
  },(t) => [
    index("beta_ops_accounts_email_idx").on(t.email),
    index("beta_ops_accounts_stage_idx").on(t.accountStage),
    index("beta_ops_accounts_owner_idx").on(t.ownerUserId),
    index("beta_ops_accounts_priority_idx").on(t.priority),
  ],
);

export const betaOpsFeedback = table(
  "beta_ops_feedback",
  {
    id: autoIncrementId("id"),
    betaAccountId: integer("beta_account_id").references(() => betaOpsAccounts.id, {
      onDelete: "cascade",
    }),
    contactMessageId: integer("contact_message_id").references(() => contactMessages.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    status: text("status").notNull().default("new"),
    priority: text("priority").notNull().default("medium"),
    source: text("source").notNull().default("ops_manual"),
    ownerUserId: text("owner_user_id").references(() => user.id, { onDelete: "set null" }),
    notes: text("notes"),
    createdAt: timestamp("created_at").default(now),
    updatedAt: timestamp("updated_at").default(now),
  },(t) => [
    index("beta_ops_feedback_account_idx").on(t.betaAccountId),
    index("beta_ops_feedback_status_idx").on(t.status),
    index("beta_ops_feedback_priority_idx").on(t.priority),
  ],
);

export const webhooks = table("webhooks", {
  id: autoIncrementId("id"),
  name: text("name").notNull(),
  url: text("url").notNull(),
  event: text("event").notNull().default("post.published"),
  secret: text("secret"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").default(now),
});

export const redirects = table(
  "redirects",
  {
    id: autoIncrementId("id"),
    sourcePath: text("source_path").notNull().unique(),
    destinationPath: text("destination_path").notNull(),
    statusCode: integer("status_code").notNull().default(301),
    createdAt: timestamp("created_at").default(now),
    updatedAt: timestamp("updated_at").default(now),
  },(t) => [index("redirects_source_path_idx").on(t.sourcePath)],
);

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
  },(t) => [index("webhook_deliveries_webhook_id_idx").on(t.webhookId)],
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
  },(t) => [
    index("page_views_visitor_id_idx").on(t.visitorId),
    index("page_views_pathname_idx").on(t.pathname),
    index("page_views_timestamp_idx").on(t.timestamp),
  ],
);

export const postRevisions = table(
  "post_revisions",
  {
    id: autoIncrementId("id"),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    excerpt: text("excerpt").notNull(),
    content: text("content").notNull(),
      metaTitle: text("meta_title"),
      metaDescription: text("meta_description"),
      ogImage: text("og_image"),
      seoNoIndex: boolean("seo_no_index").notNull().default(false),
      isPremium: boolean("is_premium").default(false),
      teaserMode: text("teaser_mode").notNull().default("excerpt"),
      status: text("status").notNull(),
    publishedAt: timestamp("published_at"),
    categoryIdsSnapshot: text("category_ids_snapshot").notNull().default("[]"),
    tagIdsSnapshot: text("tag_ids_snapshot").notNull().default("[]"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    source: text("source").notNull().default("manual"),
    createdAt: timestamp("created_at").default(now),
  },(t) => [
    index("post_revisions_post_id_idx").on(t.postId),
    index("post_revisions_created_at_idx").on(t.createdAt),
  ],
);

export const pageRevisions = table(
  "page_revisions",
  {
    id: autoIncrementId("id"),
    pageId: integer("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    excerpt: text("excerpt"),
    content: text("content").notNull(),
      metaTitle: text("meta_title"),
      metaDescription: text("meta_description"),
      ogImage: text("og_image"),
      seoNoIndex: boolean("seo_no_index").notNull().default(false),
      isPremium: boolean("is_premium").notNull().default(false),
      teaserMode: text("teaser_mode").notNull().default("excerpt"),
      status: text("status").notNull(),
    isHome: boolean("is_home").notNull().default(false),
    publishedAt: timestamp("published_at"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    source: text("source").notNull().default("manual"),
    createdAt: timestamp("created_at").default(now),
  },(t) => [
    index("page_revisions_page_id_idx").on(t.pageId),
    index("page_revisions_created_at_idx").on(t.createdAt),
  ],
);

export const activityLogs = table(
  "activity_logs",
  {
    id: autoIncrementId("id"),
    actorUserId: text("actor_user_id").references(() => user.id, { onDelete: "set null" }),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    action: text("action").notNull(),
    summary: text("summary").notNull(),
    metadataJson: text("metadata_json"),
    createdAt: timestamp("created_at").default(now),
  },(t) => [
    index("activity_logs_actor_user_id_idx").on(t.actorUserId),
    index("activity_logs_entity_idx").on(t.entityType, t.entityId),
    index("activity_logs_created_at_idx").on(t.createdAt),
  ],
);

export const invitations = table(
  "invitations",
  {
    id: autoIncrementId("id"),
    email: text("email").notNull(),
    role: text("role").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    invitedBy: text("invited_by").references(() => user.id, { onDelete: "set null" }),
    expiresAt: timestamp("expires_at").notNull(),
    acceptedAt: timestamp("accepted_at"),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").default(now),
  },(t) => [
    index("invitations_email_idx").on(t.email),
    index("invitations_expires_at_idx").on(t.expiresAt),
  ],
);

export const contentLocks = table(
  "content_locks",
  {
    id: autoIncrementId("id"),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    acquiredAt: timestamp("acquired_at").default(now),
    expiresAt: timestamp("expires_at").notNull(),
    lastHeartbeatAt: timestamp("last_heartbeat_at").default(now),
  },(t) => [
    index("content_locks_entity_idx").on(t.entityType, t.entityId),
    index("content_locks_user_id_idx").on(t.userId),
    index("content_locks_expires_at_idx").on(t.expiresAt),
  ],
);

export const editorialComments = table(
  "editorial_comments",
  {
    id: autoIncrementId("id"),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorUserId: text("author_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    resolvedAt: timestamp("resolved_at"),
    resolvedBy: text("resolved_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").default(now),
  },(t) => [
    index("editorial_comments_post_id_idx").on(t.postId),
    index("editorial_comments_author_user_id_idx").on(t.authorUserId),
    index("editorial_comments_resolved_at_idx").on(t.resolvedAt),
  ],
);

export const editorialChecklists = table(
  "editorial_checklists",
  {
    id: autoIncrementId("id"),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    itemKey: text("item_key").notNull(),
    isCompleted: boolean("is_completed").notNull().default(false),
    completedAt: timestamp("completed_at"),
    completedBy: text("completed_by").references(() => user.id, { onDelete: "set null" }),
    updatedAt: timestamp("updated_at").default(now),
  },(t) => [
    index("editorial_checklists_post_id_idx").on(t.postId),
    index("editorial_checklists_post_item_idx").on(t.postId, t.itemKey),
  ],
);

export const postsRelations = relations(posts, ({ many, one }) => ({
  author: one(user, {
    fields: [posts.authorId],
    references: [user.id],
  }),
  editorOwner: one(user, {
    fields: [posts.editorOwnerId],
    references: [user.id],
  }),
  reviewRequester: one(user, {
    fields: [posts.reviewRequestedBy],
    references: [user.id],
  }),
  lastReviewer: one(user, {
    fields: [posts.lastReviewedBy],
    references: [user.id],
  }),
  approver: one(user, {
    fields: [posts.approvedBy],
    references: [user.id],
  }),
  featuredImage: one(media, {
    fields: [posts.featuredImageId],
    references: [media.id],
  }),
  postCategories: many(postCategories),
  postTags: many(postTags),
  revisions: many(postRevisions),
  editorialComments: many(editorialComments),
  editorialChecklistItems: many(editorialChecklists),
}));

export const postCategoriesRelations = relations(postCategories, ({ one }) => ({
  post: one(posts, {
    fields: [postCategories.postId],
    references: [posts.id],
  }),
  category: one(categories, {
    fields: [postCategories.categoryId],
    references: [categories.id],
  }),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, {
    fields: [postTags.postId],
    references: [posts.id],
  }),
  tag: one(tags, {
    fields: [postTags.tagId],
    references: [tags.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  postCategories: many(postCategories),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  postTags: many(postTags),
}));

export const mediaRelations = relations(media, ({ one }) => ({
  owner: one(user, {
    fields: [media.ownerId],
    references: [user.id],
  }),
}));

export const postRevisionsRelations = relations(postRevisions, ({ one }) => ({
  post: one(posts, {
    fields: [postRevisions.postId],
    references: [posts.id],
  }),
  createdByUser: one(user, {
    fields: [postRevisions.createdBy],
    references: [user.id],
  }),
}));

export const pageRevisionsRelations = relations(pageRevisions, ({ one }) => ({
  page: one(pages, {
    fields: [pageRevisions.pageId],
    references: [pages.id],
  }),
  createdByUser: one(user, {
    fields: [pageRevisions.createdBy],
    references: [user.id],
  }),
}));

export const editorialCommentsRelations = relations(editorialComments, ({ one }) => ({
  post: one(posts, {
    fields: [editorialComments.postId],
    references: [posts.id],
  }),
  author: one(user, {
    fields: [editorialComments.authorUserId],
    references: [user.id],
  }),
  resolver: one(user, {
    fields: [editorialComments.resolvedBy],
    references: [user.id],
  }),
}));

export const editorialChecklistsRelations = relations(editorialChecklists, ({ one }) => ({
  post: one(posts, {
    fields: [editorialChecklists.postId],
    references: [posts.id],
  }),
  completedByUser: one(user, {
    fields: [editorialChecklists.completedBy],
    references: [user.id],
  }),
}));

export const subscribersRelations = relations(subscribers, ({ many }) => ({
  deliveries: many(newsletterDeliveries),
  events: many(subscriberEvents),
  consents: many(newsletterConsents),
}));

export const newslettersRelations = relations(newsletters, ({ many, one }) => ({
  deliveries: many(newsletterDeliveries),
  logs: many(newsletterLogs),
  post: one(posts, {
    fields: [newsletters.postId],
    references: [posts.id],
  }),
}));

export const newsletterDeliveriesRelations = relations(newsletterDeliveries, ({ one }) => ({
  newsletter: one(newsletters, {
    fields: [newsletterDeliveries.newsletterId],
    references: [newsletters.id],
  }),
  subscriber: one(subscribers, {
    fields: [newsletterDeliveries.subscriberId],
    references: [subscribers.id],
  }),
}));

export const subscriberEventsRelations = relations(subscriberEvents, ({ one }) => ({
  subscriber: one(subscribers, {
    fields: [subscriberEvents.subscriberId],
    references: [subscribers.id],
  }),
}));

export const newsletterConsentsRelations = relations(newsletterConsents, ({ one }) => ({
  subscriber: one(subscribers, {
    fields: [newsletterConsents.subscriberId],
    references: [subscribers.id],
  }),
}));

export const newsletterLogsRelations = relations(newsletterLogs, ({ one }) => ({
  newsletter: one(newsletters, {
    fields: [newsletterLogs.newsletterId],
    references: [newsletters.id],
  }),
}));

export const membershipPlansRelations = relations(membershipPlans, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ many, one }) => ({
  user: one(user, {
    fields: [subscriptions.userId],
    references: [user.id],
  }),
  membershipPlan: one(membershipPlans, {
    fields: [subscriptions.membershipPlanId],
    references: [membershipPlans.id],
  }),
  events: many(subscriptionEvents),
}));

export const subscriptionEventsRelations = relations(subscriptionEvents, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [subscriptionEvents.subscriptionId],
    references: [subscriptions.id],
  }),
}));





