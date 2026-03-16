import { createServerFn } from "@tanstack/react-start";
import { count, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/index";
import {
  appSettings,
  membershipPlans,
  menuItems,
  menus,
  pages,
  posts,
} from "#/db/schema";
import {
  buildSetupStatus,
  getNextSetupStep,
  SETUP_WIZARD_STEPS,
  type SetupSnapshot,
} from "#/lib/setup";
import { normalizeSettingsFormValues } from "#/lib/settings-form";
import {
  pageServerSchema,
  postServerSchema,
} from "#/schemas/editorial";
import { menuUpdateSchema, settingsSchema } from "#/schemas/system";
import { requireAdminSession } from "#/server/auth/session";
import { logActivity } from "#/server/activity-log";
import { createPageRevision, createPostRevision } from "#/server/editorial-workflows";
import { getPostHogClient } from "#/server/posthog";
import { ensureCoreMenus } from "#/server/system/site-data";

const SETUP_SETTINGS_KEYS = [
  "blogName",
  "blogDescription",
  "blogLogo",
  "fontFamily",
  "themeVariant",
  "siteUrl",
  "defaultMetaTitle",
  "defaultMetaDescription",
  "defaultOgImage",
  "twitterHandle",
  "stripeMonthlyPriceId",
  "stripeAnnualPriceId",
  "newsletterSenderEmail",
  "doubleOptInEnabled",
  "robotsIndexingEnabled",
  "setupWizardStartedAt",
  "setupWizardCompletedAt",
  "setupWizardSkippedAt",
  "setupWizardLastStep",
  "setupStarterContentGeneratedAt",
  "socialLinks",
  "membershipGracePeriodDays",
];

const setupStepSchema = z.enum(SETUP_WIZARD_STEPS);

const identityStepSchema = settingsSchema.pick({
  blogName: true,
  blogDescription: true,
  blogLogo: true,
  fontFamily: true,
  themeVariant: true,
}).extend({
  step: z.literal("identity"),
});

const seoStepSchema = settingsSchema.pick({
  siteUrl: true,
  defaultMetaTitle: true,
  defaultMetaDescription: true,
  defaultOgImage: true,
  robotsIndexingEnabled: true,
  twitterHandle: true,
}).extend({
  step: z.literal("seo"),
});

const monetizationStepSchema = settingsSchema.pick({
  stripeMonthlyPriceId: true,
  stripeAnnualPriceId: true,
}).extend({
  step: z.literal("monetization"),
});

const newsletterStepSchema = settingsSchema.pick({
  newsletterSenderEmail: true,
  doubleOptInEnabled: true,
}).extend({
  step: z.literal("newsletter"),
});

const contentStepSchema = z.object({
  step: z.literal("content"),
  generateStarterContent: z.boolean(),
});

const saveSetupStepSchema = z.discriminatedUnion("step", [
  identityStepSchema,
  seoStepSchema,
  monetizationStepSchema,
  newsletterStepSchema,
  contentStepSchema,
]);

const STARTER_PAGE_TEMPLATES: Array<z.input<typeof pageServerSchema>> = [
  {
    title: "Home",
    slug: "home",
    excerpt: "A clear, polished first impression for your publication.",
    content: [
      "# Welcome to your publication",
      "",
      "Use this homepage draft to introduce your point of view, highlight recent stories, and point readers toward subscription.",
      "",
      "## Start with a strong promise",
      "",
      "Explain what readers get here, why your publication matters, and what makes it worth returning to.",
    ].join("\n"),
    metaTitle: "Home",
    metaDescription: "Start here and shape the public face of your publication.",
    ogImage: undefined,
    seoNoIndex: false,
    isPremium: false,
    teaserMode: "excerpt",
    status: "draft",
    isHome: true,
    useVisualBuilder: false,
    publishedAt: undefined,
  },
  {
    title: "About",
    slug: "about",
    excerpt: "Tell readers who is behind the publication and why it exists.",
    content: [
      "# About this publication",
      "",
      "Share the story behind the publication, your editorial lens, and the audience you want to serve.",
      "",
      "## Why readers subscribe",
      "",
      "List the kinds of analysis, essays, reporting, or commentary they can expect.",
    ].join("\n"),
    metaTitle: "About",
    metaDescription: "Meet the team and editorial mission behind this publication.",
    ogImage: undefined,
    seoNoIndex: false,
    isPremium: false,
    teaserMode: "excerpt",
    status: "draft",
    isHome: false,
    useVisualBuilder: false,
    publishedAt: undefined,
  },
  {
    title: "Pricing",
    slug: "pricing",
    excerpt: "Outline the value of becoming a paying member.",
    content: [
      "# Membership options",
      "",
      "Use this page to explain what readers unlock with a paid plan and why your work is worth supporting.",
      "",
      "## What members get",
      "",
      "- Premium posts and archives",
      "- Direct support for your editorial work",
      "- A closer relationship with your best readers",
    ].join("\n"),
    metaTitle: "Pricing",
    metaDescription: "Compare plans and explain the value behind your membership.",
    ogImage: undefined,
    seoNoIndex: false,
    isPremium: false,
    teaserMode: "excerpt",
    status: "draft",
    isHome: false,
    useVisualBuilder: false,
    publishedAt: undefined,
  },
  {
    title: "Contact",
    slug: "contact",
    excerpt: "Give readers and partners a clear path to reach you.",
    content: [
      "# Contact",
      "",
      "Invite readers, collaborators, and sponsors to get in touch.",
      "",
      "## How to reach us",
      "",
      "Add your preferred email, response expectations, and any partnership context here.",
    ].join("\n"),
    metaTitle: "Contact",
    metaDescription: "Get in touch with the publication team.",
    ogImage: undefined,
    seoNoIndex: false,
    isPremium: false,
    teaserMode: "excerpt",
    status: "draft",
    isHome: false,
    useVisualBuilder: false,
    publishedAt: undefined,
  },
];

const STARTER_POST_TEMPLATE: z.input<typeof postServerSchema> = {
  title: "Welcome to your publication",
  slug: "welcome-to-your-publication",
  excerpt: "A first draft to help you shape tone, format, and the public launch story.",
  content: [
    "# Welcome to your publication",
    "",
    "This starter draft gives you a place to define your voice and publish your first real update quickly.",
    "",
    "## What readers can expect",
    "",
    "Use this section to explain your cadence, your editorial focus, and what subscribers will gain over time.",
    "",
    "## What to customize before publishing",
    "",
    "- Rewrite the opening with your voice",
    "- Add a cover image",
    "- Link to your About or Pricing page",
  ].join("\n"),
  metaTitle: "Welcome",
  metaDescription: "Shape this draft into your first public post.",
  ogImage: undefined,
  seoNoIndex: false,
  isPremium: false,
  commentsEnabled: true,
  teaserMode: "excerpt",
  status: "draft",
  publishedAt: undefined,
  editorOwnerId: undefined,
  categoryIds: [],
  tagIds: [],
};

const DEFAULT_PRIMARY_MENU = menuUpdateSchema.shape.items.element.array().parse([
  { label: "Home", href: "/", kind: "internal", sortOrder: 0 },
  { label: "About", href: "/about", kind: "internal", sortOrder: 1 },
  { label: "Pricing", href: "/pricing", kind: "internal", sortOrder: 2 },
  { label: "Blog", href: "/blog", kind: "internal", sortOrder: 3 },
  { label: "Contact", href: "/contact", kind: "internal", sortOrder: 4 },
]);

const DEFAULT_FOOTER_MENU = menuUpdateSchema.shape.items.element.array().parse([
  { label: "About", href: "/about", kind: "internal", sortOrder: 0 },
  { label: "Pricing", href: "/pricing", kind: "internal", sortOrder: 1 },
  { label: "Contact", href: "/contact", kind: "internal", sortOrder: 2 },
]);

type SettingsMap = Record<string, string>;

function hasValue(value: string | undefined) {
  return Boolean(value && value.trim().length > 0);
}

function hasBooleanSetting(value: string | undefined) {
  return value === "true" || value === "false";
}

async function upsertSetting(key: string, value: string) {
  await db
    .insert(appSettings)
    .values({
      key,
      value,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: {
        value,
        updatedAt: new Date(),
      },
    });
}

async function upsertSettingIfMissing(key: string, value: string) {
  const existing = await db.query.appSettings.findFirst({
    where: eq(appSettings.key, key),
  });

  if (!existing || !hasValue(existing.value)) {
    await upsertSetting(key, value);
  }
}

function safeCaptureSetupEvent(input: {
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
}) {
  const key =
    process.env.VITE_PUBLIC_POSTHOG_KEY || import.meta.env.VITE_PUBLIC_POSTHOG_KEY;

  if (!key) {
    return;
  }

  try {
    getPostHogClient().capture(input);
  } catch (error) {
    console.error("Failed to capture setup event", error);
  }
}

async function getSettingsMap(): Promise<SettingsMap> {
  const rows = await db
    .select()
    .from(appSettings)
    .where(inArray(appSettings.key, SETUP_SETTINGS_KEYS));

  return rows.reduce<SettingsMap>((record, row) => {
    record[row.key] = row.value;
    return record;
  }, {});
}

async function loadSetupSnapshot(): Promise<SetupSnapshot> {
  await ensureCoreMenus();

  const [settings, pageRows, [postCountRow], planRows] = await Promise.all([
    getSettingsMap(),
    db
      .select({
        slug: pages.slug,
        isHome: pages.isHome,
      })
      .from(pages),
    db.select({ value: count() }).from(posts),
    db
      .select({
        slug: membershipPlans.slug,
        stripePriceId: membershipPlans.stripePriceId,
      })
      .from(membershipPlans)
      .where(inArray(membershipPlans.slug, ["monthly", "annual"])),
  ]);

  const monthlyPlan = planRows.find((plan) => plan.slug === "monthly");
  const annualPlan = planRows.find((plan) => plan.slug === "annual");

  return {
    hasStoredBlogName: hasValue(settings.blogName),
    hasStoredBlogDescription: hasValue(settings.blogDescription),
    hasStoredLogo: hasValue(settings.blogLogo),
    hasStoredThemeVariant: hasValue(settings.themeVariant),
    hasStoredFontFamily: hasValue(settings.fontFamily),
    hasStoredSiteUrl: hasValue(settings.siteUrl),
    hasStoredMetaTitle: hasValue(settings.defaultMetaTitle),
    hasStoredMetaDescription: hasValue(settings.defaultMetaDescription),
    hasStoredOgImage: hasValue(settings.defaultOgImage),
    hasStoredTwitterHandle: hasValue(settings.twitterHandle),
    hasStoredMonthlyPriceId:
      hasValue(settings.stripeMonthlyPriceId) || hasValue(monthlyPlan?.stripePriceId ?? undefined),
    hasStoredAnnualPriceId:
      hasValue(settings.stripeAnnualPriceId) || hasValue(annualPlan?.stripePriceId ?? undefined),
    hasStoredNewsletterSenderEmail: hasValue(settings.newsletterSenderEmail),
    hasStoredDoubleOptInSetting: hasBooleanSetting(settings.doubleOptInEnabled),
    hasHomepage: pageRows.some((page) => page.isHome),
    hasAboutPage: pageRows.some((page) => page.slug === "about"),
    hasPricingPage: pageRows.some((page) => page.slug === "pricing"),
    hasContactPage: pageRows.some((page) => page.slug === "contact"),
    hasFirstPost: (postCountRow?.value ?? 0) > 0,
    wizardStartedAt: settings.setupWizardStartedAt ?? null,
    wizardCompletedAt: settings.setupWizardCompletedAt ?? null,
    wizardSkippedAt: settings.setupWizardSkippedAt ?? null,
    wizardLastStep: setupStepSchema.safeParse(settings.setupWizardLastStep).success
      ? (settings.setupWizardLastStep as SetupSnapshot["wizardLastStep"])
      : null,
    starterContentGeneratedAt: settings.setupStarterContentGeneratedAt ?? null,
  };
}

async function syncMembershipPlanPriceIds(input: {
  stripeMonthlyPriceId?: string;
  stripeAnnualPriceId?: string;
}) {
  const updates = [
    { slug: "monthly", stripePriceId: input.stripeMonthlyPriceId?.trim() || null },
    { slug: "annual", stripePriceId: input.stripeAnnualPriceId?.trim() || null },
  ];

  for (const update of updates) {
    const existing = await db.query.membershipPlans.findFirst({
      where: eq(membershipPlans.slug, update.slug),
    });

    if (!existing) {
      continue;
    }

    await db
      .update(membershipPlans)
      .set({
        stripePriceId: update.stripePriceId,
        isActive: Boolean(update.stripePriceId),
        isDefault:
          update.slug === "annual" ? Boolean(update.stripePriceId) : !input.stripeAnnualPriceId?.trim(),
        updatedAt: new Date(),
      })
      .where(eq(membershipPlans.id, existing.id));
  }
}

async function ensureDefaultMenuItems() {
  await ensureCoreMenus();

  const menuRows = await db.select().from(menus);

  for (const menu of menuRows) {
    const existingItems = await db
      .select({ id: menuItems.id })
      .from(menuItems)
      .where(eq(menuItems.menuId, menu.id));

    if (existingItems.length > 0) {
      continue;
    }

    const items = menu.key === "primary" ? DEFAULT_PRIMARY_MENU : DEFAULT_FOOTER_MENU;
    await db.insert(menuItems).values(
      items.map((item, index) => ({
        menuId: menu.id,
        label: item.label,
        href: item.href,
        kind: item.kind,
        sortOrder: index,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );
  }
}

async function applyLaunchDefaultsInternal() {
  const settings = await getSettingsMap();
  const effectiveBlogName = settings.blogName?.trim() || "Lumina";
  const effectiveDescription =
    settings.blogDescription?.trim() || "A premium publication for creators and independent editors.";

  await ensureDefaultMenuItems();
  await upsertSettingIfMissing("fontFamily", "Inter");
  await upsertSettingIfMissing("themeVariant", "default");
  await upsertSettingIfMissing("blogDescription", effectiveDescription);
  await upsertSettingIfMissing("defaultMetaTitle", effectiveBlogName);
  await upsertSettingIfMissing("defaultMetaDescription", effectiveDescription);
  await upsertSettingIfMissing("robotsIndexingEnabled", "true");
}

async function createStarterPages(actorUserId: string) {
  const existingPages = await db
    .select({
      id: pages.id,
      slug: pages.slug,
      isHome: pages.isHome,
    })
    .from(pages)
    .where(inArray(pages.slug, STARTER_PAGE_TEMPLATES.map((page) => page.slug || "")));

  const existingHome = await db.query.pages.findFirst({
    where: eq(pages.isHome, true),
  });

  const createdSlugs: string[] = [];

  for (const template of STARTER_PAGE_TEMPLATES) {
    if (existingPages.some((page) => page.slug === template.slug)) {
      continue;
    }

    const [created] = await db
      .insert(pages)
      .values({
        slug: template.slug!,
        title: template.title,
        excerpt: template.excerpt,
        content: template.content,
        metaTitle: template.metaTitle,
        metaDescription: template.metaDescription,
        ogImage: template.ogImage ?? null,
        seoNoIndex: template.seoNoIndex,
        isPremium: template.isPremium,
        teaserMode: template.teaserMode,
        status: template.status,
        isHome: template.isHome && !existingHome,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await createPageRevision({
      pageId: created.id,
      createdBy: actorUserId,
      source: "manual",
    });

    await logActivity({
      actorUserId,
      entityType: "page",
      entityId: created.id,
      action: "create",
      summary: `Starter page "${created.title}" created`,
      metadata: {
        slug: created.slug,
        isHome: created.isHome,
        source: "starter-kit",
      },
    });

    createdSlugs.push(created.slug);
  }

  return createdSlugs;
}

async function createStarterPost(actorUserId: string) {
  const existing = await db.query.posts.findFirst({
    where: eq(posts.slug, STARTER_POST_TEMPLATE.slug),
  });

  if (existing) {
    return false;
  }

  const [created] = await db
    .insert(posts)
    .values({
      title: STARTER_POST_TEMPLATE.title,
      slug: STARTER_POST_TEMPLATE.slug!,
      excerpt: STARTER_POST_TEMPLATE.excerpt,
      content: STARTER_POST_TEMPLATE.content,
      metaTitle: STARTER_POST_TEMPLATE.metaTitle,
      metaDescription: STARTER_POST_TEMPLATE.metaDescription,
      ogImage: STARTER_POST_TEMPLATE.ogImage ?? null,
      seoNoIndex: STARTER_POST_TEMPLATE.seoNoIndex,
      authorId: actorUserId,
      editorOwnerId: null,
      isPremium: STARTER_POST_TEMPLATE.isPremium,
      commentsEnabled: STARTER_POST_TEMPLATE.commentsEnabled,
      teaserMode: STARTER_POST_TEMPLATE.teaserMode,
      status: STARTER_POST_TEMPLATE.status,
      reviewRequestedAt: null,
      reviewRequestedBy: null,
      approvedAt: null,
      approvedBy: null,
      lastReviewedAt: null,
      lastReviewedBy: null,
      scheduledAt: null,
      archivedAt: null,
      publishedAt: null,
      updatedAt: new Date(),
    })
    .returning({ id: posts.id, title: posts.title, slug: posts.slug });

  await createPostRevision({
    postId: created.id,
    createdBy: actorUserId,
    source: "manual",
  });

  await logActivity({
    actorUserId,
    entityType: "post",
    entityId: created.id,
    action: "create",
    summary: `Starter post "${created.title}" created`,
    metadata: {
      slug: created.slug,
      source: "starter-kit",
    },
  });

  return true;
}

async function generateStarterContentInternal(session: {
  user: { id: string; email: string };
}) {
  const [createdPageSlugs, createdWelcomePost] = await Promise.all([
    createStarterPages(session.user.id),
    createStarterPost(session.user.id),
  ]);

  const generatedAt = new Date().toISOString();
  await upsertSetting("setupStarterContentGeneratedAt", generatedAt);

  safeCaptureSetupEvent({
    distinctId: session.user.email,
    event: "starter_content_generated",
    properties: {
      actor_user_id: session.user.id,
      created_pages: createdPageSlugs,
      created_welcome_post: createdWelcomePost,
    },
  });

  return {
    createdPageSlugs,
    createdWelcomePost,
    generatedAt,
  };
}

async function markSetupStartedIfNeeded(session: {
  user: { id: string; email: string };
}) {
  const settings = await getSettingsMap();
  if (settings.setupWizardStartedAt) {
    return settings.setupWizardStartedAt;
  }

  const startedAt = new Date().toISOString();
  await upsertSetting("setupWizardStartedAt", startedAt);

  safeCaptureSetupEvent({
    distinctId: session.user.email,
    event: "project_setup_started",
    properties: {
      actor_user_id: session.user.id,
    },
  });

  return startedAt;
}

async function buildSetupStatusForAdmin() {
  const snapshot = await loadSetupSnapshot();
  return buildSetupStatus(snapshot);
}

export async function getSetupStatusSummaryForRole(role?: string | null) {
  if (role !== "admin" && role !== "super-admin") {
    return null;
  }

  return buildSetupStatusForAdmin();
}

export const getSetupStatus = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession();
  return buildSetupStatusForAdmin();
});

export const applyLaunchDefaults = createServerFn({ method: "POST" }).handler(async () => {
  const session = await requireAdminSession();
  await applyLaunchDefaultsInternal();
  await markSetupStartedIfNeeded(session);
  return buildSetupStatusForAdmin();
});

export const generateStarterContent = createServerFn({ method: "POST" }).handler(async () => {
  const session = await requireAdminSession();
  const result = await generateStarterContentInternal(session);
  return {
    ...result,
    status: await buildSetupStatusForAdmin(),
  };
});

export const skipSetup = createServerFn({ method: "POST" }).handler(async () => {
  const session = await requireAdminSession();
  await markSetupStartedIfNeeded(session);
  await upsertSetting("setupWizardSkippedAt", new Date().toISOString());

  safeCaptureSetupEvent({
    distinctId: session.user.email,
    event: "project_setup_skipped",
    properties: {
      actor_user_id: session.user.id,
    },
  });

  return buildSetupStatusForAdmin();
});

export const saveSetupStep = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => saveSetupStepSchema.parse(input))
  .handler(async ({ data }) => {
    const session = await requireAdminSession();
    await markSetupStartedIfNeeded(session);
    await applyLaunchDefaultsInternal();

    if (data.step === "identity") {
      const normalized = normalizeSettingsFormValues({
        ...data,
        siteUrl: "",
        defaultMetaTitle: "",
        defaultMetaDescription: "",
        defaultOgImage: "",
        twitterHandle: "",
        stripeMonthlyPriceId: "",
        stripeAnnualPriceId: "",
        newsletterSenderEmail: "",
        doubleOptInEnabled: false,
        membershipGracePeriodDays: 3,
        robotsIndexingEnabled: true,
        socialLinks: [],
      });

      await upsertSetting("blogName", normalized.blogName);
      await upsertSetting("blogDescription", normalized.blogDescription);
      await upsertSetting("blogLogo", normalized.blogLogo || "");
      await upsertSetting("fontFamily", normalized.fontFamily);
      await upsertSetting("themeVariant", normalized.themeVariant);
    }

    if (data.step === "seo") {
      await upsertSetting("siteUrl", data.siteUrl?.trim() || "");
      await upsertSetting("defaultMetaTitle", data.defaultMetaTitle?.trim() || "");
      await upsertSetting(
        "defaultMetaDescription",
        data.defaultMetaDescription?.trim() || "",
      );
      await upsertSetting("defaultOgImage", data.defaultOgImage?.trim() || "");
      await upsertSetting("robotsIndexingEnabled", String(data.robotsIndexingEnabled));
      await upsertSetting("twitterHandle", data.twitterHandle?.trim() || "");
    }

    if (data.step === "monetization") {
      const monthly = data.stripeMonthlyPriceId?.trim() || "";
      const annual = data.stripeAnnualPriceId?.trim() || "";
      await upsertSetting("stripeMonthlyPriceId", monthly);
      await upsertSetting("stripeAnnualPriceId", annual);
      await syncMembershipPlanPriceIds({
        stripeMonthlyPriceId: monthly,
        stripeAnnualPriceId: annual,
      });
    }

    if (data.step === "newsletter") {
      await upsertSetting(
        "newsletterSenderEmail",
        data.newsletterSenderEmail?.trim() || "",
      );
      await upsertSetting("doubleOptInEnabled", String(data.doubleOptInEnabled));
    }

    if (data.step === "content") {
      if (data.generateStarterContent) {
        await generateStarterContentInternal(session);
      }

      await upsertSetting("setupWizardCompletedAt", new Date().toISOString());
      await upsertSetting("setupWizardSkippedAt", "");

      safeCaptureSetupEvent({
        distinctId: session.user.email,
        event: "project_setup_completed",
        properties: {
          actor_user_id: session.user.id,
          starter_content_generated: data.generateStarterContent,
        },
      });
    }

    const nextStep = getNextSetupStep(data.step);
    await upsertSetting(
      "setupWizardLastStep",
      data.step === "content" ? "content" : nextStep,
    );

    safeCaptureSetupEvent({
      distinctId: session.user.email,
      event: "project_setup_step_completed",
      properties: {
        actor_user_id: session.user.id,
        step: data.step,
      },
    });

    return buildSetupStatusForAdmin();
  });
