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
import {
  buildTemplatePageValues,
  getLaunchTemplateOptions,
  getPresetMenus,
  getPresetThemeVariant,
  getSitePresets,
  resolveSitePresetKey,
} from "#/lib/site-presets";
import { normalizeSettingsFormValues } from "#/lib/settings-form";
import {
  postServerSchema,
} from "#/schemas/editorial";
import { menuUpdateSchema, settingsSchema } from "#/schemas/system";
import { captureServerEvent } from "#/server/analytics";
import { requireAdminSession } from "#/server/auth/session";
import { logActivity } from "#/server/activity-log";
import { createPageRevision, createPostRevision } from "#/server/editorial-workflows";
import { ensureCoreMenus } from "#/server/system/site-data";
import type { SitePresetKey } from "#/types/system";

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
  "sitePresetKey",
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
  sitePresetKey: z.enum([
    "creator-journal",
    "magazine-newsletter",
    "premium-publication",
  ]),
  generateStarterContent: z.boolean(),
});

const saveSetupStepSchema = z.discriminatedUnion("step", [
  identityStepSchema,
  seoStepSchema,
  monetizationStepSchema,
  newsletterStepSchema,
  contentStepSchema,
]);

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
    sitePresetKey: resolveSitePresetKey(settings.sitePresetKey),
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

async function ensureDefaultMenuItems(presetKey: SitePresetKey) {
  await ensureCoreMenus();
  const presetMenus = getPresetMenus(presetKey);

  const menuRows = await db.select().from(menus);

  for (const menu of menuRows) {
    const existingItems = await db
      .select({ id: menuItems.id })
      .from(menuItems)
      .where(eq(menuItems.menuId, menu.id));

    if (existingItems.length > 0) {
      continue;
    }

    const items =
      menu.key === "primary"
        ? menuUpdateSchema.shape.items.parse(presetMenus.primaryMenu)
        : menuUpdateSchema.shape.items.parse(presetMenus.footerMenu);
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
  const presetKey = resolveSitePresetKey(settings.sitePresetKey);
  const effectiveBlogName = settings.blogName?.trim() || "Lumina";
  const effectiveDescription =
    settings.blogDescription?.trim() || "A premium publication for creators and independent editors.";

  await ensureDefaultMenuItems(presetKey);
  await upsertSettingIfMissing("sitePresetKey", presetKey);
  await upsertSettingIfMissing("fontFamily", "Inter");
  await upsertSettingIfMissing("themeVariant", getPresetThemeVariant(presetKey));
  await upsertSettingIfMissing("blogDescription", effectiveDescription);
  await upsertSettingIfMissing("defaultMetaTitle", effectiveBlogName);
  await upsertSettingIfMissing("defaultMetaDescription", effectiveDescription);
  await upsertSettingIfMissing("robotsIndexingEnabled", "true");
}

async function createStarterPages(input: {
  actorUserId: string;
  presetKey: SitePresetKey;
  blogName: string;
  blogDescription: string;
}) {
  const templateDefinitions = getLaunchTemplateOptions();
  const existingPages = await db
    .select({
      id: pages.id,
      slug: pages.slug,
      isHome: pages.isHome,
    })
    .from(pages)
    .where(inArray(pages.slug, templateDefinitions.map((page) => page.slug)));

  const existingHome = await db.query.pages.findFirst({
    where: eq(pages.isHome, true),
  });

  const createdSlugs: string[] = [];

  for (const template of templateDefinitions) {
    if (existingPages.some((page) => page.slug === template.slug)) {
      continue;
    }

    const values = buildTemplatePageValues({
      presetKey: input.presetKey,
      templateKey: template.key,
      blogName: input.blogName,
      blogDescription: input.blogDescription,
    });

    const [created] = await db
      .insert(pages)
      .values({
        slug: values.slug,
        title: values.title,
        excerpt: values.excerpt || null,
        content: values.content,
        metaTitle: values.metaTitle || null,
        metaDescription: values.metaDescription || null,
        ogImage: values.ogImage || null,
        seoNoIndex: values.seoNoIndex,
        isPremium: values.isPremium,
        teaserMode: values.teaserMode,
        status: values.status,
        isHome: values.isHome && !existingHome,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await createPageRevision({
      pageId: created.id,
      createdBy: input.actorUserId,
      source: "manual",
    });

    await logActivity({
      actorUserId: input.actorUserId,
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
  const settings = await getSettingsMap();
  const presetKey = resolveSitePresetKey(settings.sitePresetKey);
  const blogName = settings.blogName?.trim() || "Lumina";
  const blogDescription =
    settings.blogDescription?.trim() || "A launch-ready publication.";

  const [createdPageSlugs, createdWelcomePost] = await Promise.all([
    createStarterPages({
      actorUserId: session.user.id,
      presetKey,
      blogName,
      blogDescription,
    }),
    createStarterPost(session.user.id),
  ]);

  const generatedAt = new Date().toISOString();
  await upsertSetting("setupStarterContentGeneratedAt", generatedAt);

  await captureServerEvent({
    distinctId: session.user.email,
    event: "starter_content_generated",
    properties: {
      actor_user_id: session.user.id,
      created_pages: createdPageSlugs,
      created_welcome_post: createdWelcomePost,
      site_preset_key: presetKey,
      surface: "dashboard_setup",
    },
  });

  return {
    createdPageSlugs,
    createdWelcomePost,
    generatedAt,
  };
}

async function markSetupStartedIfNeeded(session: {
  user: { id: string; email: string; role?: string | null };
}) {
  const settings = await getSettingsMap();
  if (settings.setupWizardStartedAt) {
    return settings.setupWizardStartedAt;
  }

  const startedAt = new Date().toISOString();
  await upsertSetting("setupWizardStartedAt", startedAt);

  await captureServerEvent({
    distinctId: session.user.email,
    event: "project_setup_started",
    properties: {
      actor_user_id: session.user.id,
      user_role: session.user.role === "super-admin" ? "super-admin" : "admin",
      surface: "dashboard_setup",
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

export const getLaunchTemplateCatalog = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession();
  const settings = await getSettingsMap();
  return {
    currentPresetKey: resolveSitePresetKey(settings.sitePresetKey),
    blogName: settings.blogName?.trim() || "Lumina",
    blogDescription: settings.blogDescription?.trim() || "A launch-ready publication.",
    presets: getSitePresets(),
    templates: getLaunchTemplateOptions(),
  };
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

  await captureServerEvent({
    distinctId: session.user.email,
    event: "project_setup_skipped",
    properties: {
      actor_user_id: session.user.id,
      user_role: "admin",
      surface: "dashboard_setup",
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

      await captureServerEvent({
        distinctId: session.user.email,
        event: "pricing_configured",
        properties: {
          actor_user_id: session.user.id,
          has_monthly_price: Boolean(monthly),
          has_annual_price: Boolean(annual),
          surface: "dashboard_setup",
        },
      });
    }

    if (data.step === "newsletter") {
      await upsertSetting(
        "newsletterSenderEmail",
        data.newsletterSenderEmail?.trim() || "",
      );
      await upsertSetting("doubleOptInEnabled", String(data.doubleOptInEnabled));

      await captureServerEvent({
        distinctId: session.user.email,
        event: "newsletter_configured",
        properties: {
          actor_user_id: session.user.id,
          has_sender_email: Boolean(data.newsletterSenderEmail?.trim()),
          double_opt_in_enabled: data.doubleOptInEnabled,
          surface: "dashboard_setup",
        },
      });
    }

    if (data.step === "content") {
      const presetKey = resolveSitePresetKey(data.sitePresetKey);
      await upsertSetting("sitePresetKey", presetKey);
      await upsertSetting("themeVariant", getPresetThemeVariant(presetKey));

      if (data.generateStarterContent) {
        await generateStarterContentInternal(session);
      }

      await upsertSetting("setupWizardCompletedAt", new Date().toISOString());
      await upsertSetting("setupWizardSkippedAt", "");

      await captureServerEvent({
        distinctId: session.user.email,
        event: "project_setup_completed",
        properties: {
          actor_user_id: session.user.id,
          site_preset_key: presetKey,
          starter_content_generated: data.generateStarterContent,
          surface: "dashboard_setup",
        },
      });
    }

    const nextStep = getNextSetupStep(data.step);
    await upsertSetting(
      "setupWizardLastStep",
      data.step === "content" ? "content" : nextStep,
    );

    await captureServerEvent({
      distinctId: session.user.email,
      event: "project_setup_step_completed",
      properties: {
        actor_user_id: session.user.id,
        step: data.step,
        site_preset_key:
          data.step === "content" ? resolveSitePresetKey(data.sitePresetKey) : undefined,
        surface: "dashboard_setup",
      },
    });

    return buildSetupStatusForAdmin();
  });
