import fs from "node:fs";
import path from "node:path";
import { hashPassword } from "better-auth/crypto";
import { eq, inArray } from "drizzle-orm";
import { db } from "#/db/index";
import {
  account,
  appSettings,
  betaOpsAccounts,
  betaOpsFeedback,
  categories,
  comments,
  contactMessages,
  media,
  membershipPlans,
  menuItems,
  menus,
  newsletterConsents,
  newsletters,
  pages,
  postCategories,
  postTags,
  posts,
  rateLimitEvents,
  redirects,
  securityEvents,
  subscriptions,
  subscribers,
  tags,
  user,
  webhooks,
} from "#/db/schema";

const FIXTURE_PASSWORD = "Password123!";

type FixtureUser = {
  id: string;
  name: string;
  email: string;
  role: "reader" | "author" | "editor" | "moderator" | "admin" | "super-admin";
  publicAuthorSlug?: string;
  authorHeadline?: string;
  authorBio?: string;
};

const FIXTURE_USERS: readonly FixtureUser[] = [
  {
    id: "fixture-admin",
    name: "Fixture Admin",
    email: "admin@lumina.test",
    role: "admin",
  },
  {
    id: "fixture-super-admin",
    name: "Fixture Super Admin",
    email: "super-admin@lumina.test",
    role: "super-admin",
  },
  {
    id: "fixture-editor",
    name: "Fixture Editor",
    email: "editor@lumina.test",
    role: "editor",
  },
  {
    id: "fixture-author",
    name: "Fixture Author",
    email: "author@lumina.test",
    role: "author",
    publicAuthorSlug: "fixture-author",
    authorHeadline: "Senior Features Writer",
    authorBio: "Writes fixture stories for end-to-end coverage.",
  },
  {
    id: "fixture-moderator",
    name: "Fixture Moderator",
    email: "moderator@lumina.test",
    role: "moderator",
  },
  {
    id: "fixture-reader",
    name: "Fixture Reader",
    email: "reader@lumina.test",
    role: "reader",
  },
  {
    id: "fixture-member",
    name: "Fixture Member",
    email: "member@lumina.test",
    role: "reader",
  },
  {
    id: "fixture-past-due",
    name: "Fixture Past Due",
    email: "past-due@lumina.test",
    role: "reader",
  },
];

const FIXTURE_SETTINGS = [
  { key: "blogName", value: "Lumina" },
  { key: "blogDescription", value: "Fixture publication for staging and tests." },
  { key: "siteUrl", value: "http://127.0.0.1:3000" },
  { key: "fontFamily", value: "Space Grotesk" },
  { key: "themeVariant", value: "theme-lumina" },
  { key: "doubleOptInEnabled", value: "false" },
  { key: "membershipGracePeriodDays", value: "3" },
  { key: "robotsIndexingEnabled", value: "true" },
];

const SETUP_RESET_KEYS = [
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
  "registration_locked",
] as const;

const SETUP_STARTER_PAGE_SLUGS = [
  "home",
  "about",
  "pricing",
  "contact",
  "newsletter",
  "members-only-archive",
] as const;

const FIXTURE_PAGE_SLUGS = [
  "fixture-about",
  "fixture-contact",
  "fixture-newsletter",
  "fixture-private-briefing",
] as const;

const FIXTURE_UPLOAD_FILENAME = "fixture-library-cover.png";

async function ensureFixtureUser(
  input: (typeof FIXTURE_USERS)[number],
  passwordHash: string,
) {
  await db
    .insert(user)
    .values({
      id: input.id,
      name: input.name,
      email: input.email,
      emailVerified: true,
      role: input.role,
      publicAuthorSlug: input.publicAuthorSlug ?? null,
      authorHeadline: input.authorHeadline ?? null,
      authorBio: input.authorBio ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: user.id,
      set: {
        name: input.name,
        email: input.email,
        emailVerified: true,
        role: input.role,
        publicAuthorSlug: input.publicAuthorSlug ?? null,
        authorHeadline: input.authorHeadline ?? null,
        authorBio: input.authorBio ?? null,
        updatedAt: new Date(),
      },
    });

  await db
    .insert(account)
    .values({
      id: `${input.id}-credentials`,
      accountId: input.email,
      providerId: "credential",
      userId: input.id,
      password: passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: account.id,
      set: {
        accountId: input.email,
        providerId: "credential",
        userId: input.id,
        password: passwordHash,
        updatedAt: new Date(),
      },
    });
}

async function ensureTaxonomyFixtures() {
  const categoryFixtures = [
    {
      name: "Operations",
      slug: "operations",
      description: "Operational publishing coverage",
    },
    {
      name: "Editorial Strategy",
      slug: "editorial-strategy",
      description: "Planning, workflow, and editorial direction",
    },
  ];

  for (const fixture of categoryFixtures) {
    await db
      .insert(categories)
      .values(fixture)
      .onConflictDoUpdate({
        target: categories.slug,
        set: {
          name: fixture.name,
          description: fixture.description,
        },
      });
  }

  const tagFixtures = [
    { name: "Readiness", slug: "readiness" },
    { name: "Launch", slug: "launch" },
  ];

  for (const fixture of tagFixtures) {
    await db
      .insert(tags)
      .values(fixture)
      .onConflictDoUpdate({
        target: tags.slug,
        set: {
          name: fixture.name,
        },
      });
  }
}

async function ensureFixturePosts(authorId: string) {
  const postFixtures = [
    {
      slug: "fixture-published-post",
      title: "Fixture published post",
      excerpt: "Operational fixture excerpt for smoke tests.",
      content: "Fixture published content for smoke tests and staging verification.",
      status: "published",
      authorId,
      isPremium: false,
      commentsEnabled: true,
      teaserMode: "excerpt",
      publishedAt: new Date("2026-03-16T10:00:00.000Z"),
      updatedAt: new Date(),
    },
    {
      slug: "fixture-premium-post",
      title: "Fixture premium post",
      excerpt: "Premium excerpt for member smoke coverage.",
      content: "Premium content that should stay behind the membership gate.",
      status: "published",
      authorId,
      isPremium: true,
      commentsEnabled: false,
      teaserMode: "excerpt",
      publishedAt: new Date("2026-03-16T11:00:00.000Z"),
      updatedAt: new Date(),
    },
    {
      slug: "fixture-draft-post",
      title: "Fixture draft post",
      excerpt: "Draft content waiting on editorial review.",
      content: "Draft body for editorial workflow coverage.",
      status: "draft",
      authorId,
      isPremium: false,
      commentsEnabled: true,
      teaserMode: "excerpt",
      publishedAt: null,
      updatedAt: new Date(),
    },
    {
      slug: "fixture-review-post",
      title: "Fixture review post",
      excerpt: "In-review content for workflow assertions.",
      content: "Review body for editorial workflow coverage.",
      status: "in_review",
      authorId,
      editorOwnerId: "fixture-editor",
      isPremium: false,
      commentsEnabled: true,
      teaserMode: "excerpt",
      publishedAt: null,
      updatedAt: new Date(),
    },
    {
      slug: "fixture-scheduled-post",
      title: "Fixture scheduled post",
      excerpt: "Scheduled content for dashboard actions.",
      content: "Scheduled body for workflow coverage.",
      status: "scheduled",
      authorId,
      editorOwnerId: "fixture-editor",
      isPremium: false,
      commentsEnabled: true,
      teaserMode: "excerpt",
      publishedAt: new Date("2026-03-25T09:00:00.000Z"),
      updatedAt: new Date(),
    },
  ];

  for (const fixture of postFixtures) {
    await db
      .insert(posts)
      .values(fixture)
      .onConflictDoUpdate({
        target: posts.slug,
        set: {
          title: fixture.title,
          excerpt: fixture.excerpt,
          content: fixture.content,
          status: fixture.status,
          authorId: fixture.authorId,
          editorOwnerId: fixture.editorOwnerId ?? null,
          isPremium: fixture.isPremium,
          commentsEnabled: fixture.commentsEnabled,
          teaserMode: fixture.teaserMode,
          publishedAt: fixture.publishedAt,
          updatedAt: fixture.updatedAt,
        },
      });
  }

  const allCategories = await db.query.categories.findMany();
  const allTags = await db.query.tags.findMany();
  const operations = allCategories.find((entry: { slug: string }) => entry.slug === "operations");
  const strategy = allCategories.find(
    (entry: { slug: string }) => entry.slug === "editorial-strategy",
  );
  const readiness = allTags.find((entry: { slug: string }) => entry.slug === "readiness");
  const launch = allTags.find((entry: { slug: string }) => entry.slug === "launch");

  const publishedPost = await db.query.posts.findFirst({
    where: eq(posts.slug, "fixture-published-post"),
  });

  if (!publishedPost || !operations || !strategy || !readiness || !launch) {
    throw new Error("Fixture editorial records were not created.");
  }

  const premiumPost = await db.query.posts.findFirst({
    where: eq(posts.slug, "fixture-premium-post"),
  });

  await db.delete(postCategories).where(
    inArray(
      postCategories.postId,
      [publishedPost.id, premiumPost?.id].filter((value): value is number => Boolean(value)),
    ),
  );
  await db.delete(postTags).where(
    inArray(
      postTags.postId,
      [publishedPost.id, premiumPost?.id].filter((value): value is number => Boolean(value)),
    ),
  );

  await db.insert(postCategories).values([
    { postId: publishedPost.id, categoryId: operations.id },
    { postId: publishedPost.id, categoryId: strategy.id },
    ...(premiumPost ? [{ postId: premiumPost.id, categoryId: strategy.id }] : []),
  ]);

  await db.insert(postTags).values([
    { postId: publishedPost.id, tagId: readiness.id },
    { postId: publishedPost.id, tagId: launch.id },
    ...(premiumPost ? [{ postId: premiumPost.id, tagId: launch.id }] : []),
  ]);

  const existingComments = await db.query.comments.findMany({
    where: eq(comments.postId, publishedPost.id),
  });

  if (existingComments.length === 0) {
    await db.insert(comments).values([
      {
        postId: publishedPost.id,
        authorName: "Fixture Reader",
        authorEmail: "reader@lumina.test",
        content: "Fixture pending comment for moderation flows.",
        status: "pending",
        createdAt: new Date(),
      },
      {
        postId: publishedPost.id,
        authorName: "Approved Reader",
        authorEmail: "approved@lumina.test",
        content: "Fixture approved comment for moderation coverage.",
        status: "approved",
        createdAt: new Date(),
      },
      {
        postId: publishedPost.id,
        authorName: "Spam Reader",
        authorEmail: "spam@lumina.test",
        content: "Fixture spam comment for dashboard moderation.",
        status: "spam",
        createdAt: new Date(),
      },
    ]);
  }
}

async function ensureFixturePages() {
  const pageFixtures = [
    {
      slug: "fixture-about",
      title: "Fixture About",
      excerpt: "About page managed from the CMS.",
      content: "<p>About Lumina fixture content.</p>",
      status: "published",
      isHome: false,
    },
    {
      slug: "fixture-contact",
      title: "Fixture Contact",
      excerpt: "Reach the team through the managed contact page.",
      content: "<p>Fixture contact page content.</p>",
      status: "published",
      isHome: false,
    },
    {
      slug: "fixture-newsletter",
      title: "Fixture Newsletter",
      excerpt: "Newsletter landing page managed through CMS.",
      content: "<p>Newsletter landing content.</p>",
      status: "published",
      isHome: false,
    },
    {
      slug: "fixture-private-briefing",
      title: "Fixture Private Briefing",
      excerpt: "Members-only page fixture.",
      content: "<p>Premium page body for gating coverage.</p>",
      status: "published",
      isPremium: true,
      teaserMode: "excerpt",
      isHome: false,
    },
  ];

  for (const fixture of pageFixtures) {
    await db
      .insert(pages)
      .values({
        ...fixture,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: fixture.status === "published" ? new Date("2026-03-16T12:00:00.000Z") : null,
      })
      .onConflictDoUpdate({
        target: pages.slug,
        set: {
          title: fixture.title,
          excerpt: fixture.excerpt,
          content: fixture.content,
          status: fixture.status,
          isPremium: fixture.isPremium ?? false,
          teaserMode: fixture.teaserMode ?? "excerpt",
          isHome: fixture.isHome,
          publishedAt: fixture.status === "published" ? new Date("2026-03-16T12:00:00.000Z") : null,
          updatedAt: new Date(),
        },
      });
  }
}

async function ensureNavigationFixtures() {
  const now = new Date();
  await db
    .insert(menus)
    .values([
      {
        key: "primary",
        label: "Primary Navigation",
        createdAt: now,
        updatedAt: now,
      },
      {
        key: "footer",
        label: "Footer Navigation",
        createdAt: now,
        updatedAt: now,
      },
    ])
    .onConflictDoNothing();

  const menuRows = await db.query.menus.findMany();
  const primaryMenu = menuRows.find((entry: { key: string }) => entry.key === "primary");
  const footerMenu = menuRows.find((entry: { key: string }) => entry.key === "footer");

  if (!primaryMenu || !footerMenu) {
    throw new Error("Fixture menus were not created.");
  }

  await db.delete(menuItems).where(inArray(menuItems.menuId, [primaryMenu.id, footerMenu.id]));

  await db.insert(menuItems).values([
    {
      menuId: primaryMenu.id,
      label: "About",
      href: "/about",
      kind: "internal",
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      menuId: primaryMenu.id,
      label: "Pricing",
      href: "/pricing",
      kind: "internal",
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      menuId: footerMenu.id,
      label: "Contact",
      href: "/contact",
      kind: "internal",
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    },
  ]);
}

async function ensureRedirectAndWebhookFixtures() {
  await db
    .insert(redirects)
    .values({
      sourcePath: "/go-premium",
      destinationPath: "/pricing",
      statusCode: 302,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: redirects.sourcePath,
      set: {
        destinationPath: "/pricing",
        statusCode: 302,
        updatedAt: new Date(),
      },
    });

  await db
    .insert(webhooks)
    .values({
      name: "Fixture Publish Hook",
      url: "https://example.test/hooks/publish",
      event: "post.published",
      secret: "fixture-secret",
      isActive: true,
      createdAt: new Date(),
    })
    .onConflictDoNothing();
}

async function ensureMediaFixture() {
  const uploadDir = path.resolve(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const sourceFile = path.resolve(process.cwd(), "public", "logo192.png");
  const targetFile = path.join(uploadDir, FIXTURE_UPLOAD_FILENAME);
  if (!fs.existsSync(targetFile)) {
    fs.copyFileSync(sourceFile, targetFile);
  }

  await db
    .insert(media)
    .values({
      url: `/uploads/${FIXTURE_UPLOAD_FILENAME}`,
      altText: "Fixture library cover",
      filename: FIXTURE_UPLOAD_FILENAME,
      mimeType: "image/png",
      size: fs.statSync(targetFile).size,
      ownerId: "fixture-admin",
      createdAt: new Date(),
    })
    .onConflictDoNothing();
}

async function ensureMembershipFixture() {
  await db
    .insert(membershipPlans)
    .values({
      slug: "monthly",
      name: "Monthly",
      description: "Fixture monthly plan",
      interval: "month",
      stripePriceId: "price_fixture_monthly",
      priceCents: 1900,
      currency: "usd",
      isActive: true,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: membershipPlans.slug,
      set: {
        name: "Monthly",
        description: "Fixture monthly plan",
        interval: "month",
        stripePriceId: "price_fixture_monthly",
        priceCents: 1900,
        currency: "usd",
        isActive: true,
        isDefault: true,
        updatedAt: new Date(),
      },
    });

  const plan = await db.query.membershipPlans.findFirst({
    where: eq(membershipPlans.slug, "monthly"),
  });

  if (!plan) {
    throw new Error("Fixture membership plan was not created.");
  }

  await db
    .insert(subscriptions)
    .values({
      userId: "fixture-member",
      membershipPlanId: plan.id,
      stripeCustomerId: "cus_fixture_member",
      stripeSubscriptionId: "sub_fixture_member",
      stripePriceId: "price_fixture_monthly",
      status: "active",
      currentPeriodStart: new Date("2026-03-01T00:00:00.000Z"),
      currentPeriodEnd: new Date("2026-04-01T00:00:00.000Z"),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: subscriptions.stripeSubscriptionId,
      set: {
        userId: "fixture-member",
        membershipPlanId: plan.id,
        stripeCustomerId: "cus_fixture_member",
        stripePriceId: "price_fixture_monthly",
        status: "active",
        currentPeriodStart: new Date("2026-03-01T00:00:00.000Z"),
        currentPeriodEnd: new Date("2026-04-01T00:00:00.000Z"),
        updatedAt: new Date(),
      },
    });

  await db
    .insert(subscriptions)
    .values({
      userId: "fixture-past-due",
      membershipPlanId: plan.id,
      stripeCustomerId: "cus_fixture_past_due",
      stripeSubscriptionId: "sub_fixture_past_due",
      stripePriceId: "price_fixture_monthly",
      status: "past_due",
      currentPeriodStart: new Date("2026-03-01T00:00:00.000Z"),
      currentPeriodEnd: new Date("2026-04-01T00:00:00.000Z"),
      gracePeriodEndsAt: new Date("2026-04-04T00:00:00.000Z"),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: subscriptions.stripeSubscriptionId,
      set: {
        userId: "fixture-past-due",
        membershipPlanId: plan.id,
        stripeCustomerId: "cus_fixture_past_due",
        stripePriceId: "price_fixture_monthly",
        status: "past_due",
        currentPeriodStart: new Date("2026-03-01T00:00:00.000Z"),
        currentPeriodEnd: new Date("2026-04-01T00:00:00.000Z"),
        gracePeriodEndsAt: new Date("2026-04-04T00:00:00.000Z"),
        updatedAt: new Date(),
      },
    });
}

async function ensureNewsletterFixture() {
  await db
    .insert(subscribers)
    .values({
      email: "newsletter-fixture@lumina.test",
      status: "active",
      source: "fixtures",
      confirmedAt: new Date(),
      createdAt: new Date(),
    })
    .onConflictDoUpdate({
      target: subscribers.email,
      set: {
        status: "active",
        source: "fixtures",
        confirmedAt: new Date(),
      },
    });

  const subscriber = await db.query.subscribers.findFirst({
    where: eq(subscribers.email, "newsletter-fixture@lumina.test"),
  });

  if (!subscriber) {
    throw new Error("Fixture subscriber was not created.");
  }

  const existingConsent = await db.query.newsletterConsents.findFirst({
    where: eq(newsletterConsents.email, subscriber.email),
  });

  if (!existingConsent) {
    await db.insert(newsletterConsents).values({
      subscriberId: subscriber.id,
      email: subscriber.email,
      source: "fixtures",
      status: "active",
      lawfulBasis: "consent",
      createdAt: new Date(),
    });
  }

  const existingNewsletter = await db.query.newsletters.findFirst({
    where: eq(newsletters.subject, "Fixture newsletter campaign"),
  });

  if (!existingNewsletter) {
    await db.insert(newsletters).values({
      subject: "Fixture newsletter campaign",
      preheader: "Fixture preheader",
      content: "<p>Fixture newsletter body.</p>",
      status: "draft",
      segment: "all_active",
      totalRecipients: 1,
      createdAt: new Date(),
    });
  }

  const scheduledNewsletter = await db.query.newsletters.findFirst({
    where: eq(newsletters.subject, "Fixture scheduled campaign"),
  });

  if (!scheduledNewsletter) {
    await db.insert(newsletters).values({
      subject: "Fixture scheduled campaign",
      preheader: "Scheduled fixture preheader",
      content: "<p>Scheduled fixture newsletter body.</p>",
      status: "scheduled",
      segment: "all_active",
      scheduledAt: new Date("2026-03-22T09:00:00.000Z"),
      totalRecipients: 1,
      createdAt: new Date(),
    });
  }
}

async function ensureLaunchOpsFixture() {
  const [betaRequest] = await db
    .insert(contactMessages)
    .values({
      name: "Beta Founder",
      email: "beta-founder@example.com",
      subject: "[Lumina Beta] creator · independent_newsletter",
      message:
        "Lumina beta request\n\nRole: creator\nPublication type: independent_newsletter\nCurrent stack: Ghost and Mailchimp\n\nWhy now:\nWe want a calmer launch workflow and better membership setup.",
      messageType: "beta_request",
      sourcePath: "/lumina/beta",
      source: "beta_form_submit",
      metadataJson: JSON.stringify({
        role: "creator",
        publicationType: "independent_newsletter",
        currentStack: "Ghost and Mailchimp",
      }),
      status: "new",
      createdAt: new Date(),
    })
    .returning();

  await db.insert(contactMessages).values({
    name: "Untriaged Operator",
    email: "untriaged-beta@example.com",
    subject: "[Lumina Beta] publication_lead · digital_magazine",
    message:
      "Lumina beta request\n\nRole: publication_lead\nPublication type: digital_magazine\nCurrent stack: WordPress and Beehiiv\n\nWhy now:\nWe need a more coherent launch system before inviting members.",
    messageType: "beta_request",
    sourcePath: "/lumina/beta",
    source: "beta_form_submit",
    metadataJson: JSON.stringify({
      role: "publication_lead",
      publicationType: "digital_magazine",
      currentStack: "WordPress and Beehiiv",
    }),
    status: "new",
    createdAt: new Date(),
  });

  await db.insert(contactMessages).values({
    name: "Reader Support",
    email: "reader-support@example.com",
    subject: "Question about premium access",
    message: "Can I switch from monthly to annual later?",
    messageType: "general",
    sourcePath: "/contact",
    source: "public_contact_form",
    status: "new",
    createdAt: new Date(),
  });

  const [account] = await db
    .insert(betaOpsAccounts)
    .values({
      contactMessageId: betaRequest.id,
      name: "Beta Founder",
      email: "beta-founder@example.com",
      publicationName: "Calm Dispatch",
      role: "creator",
      publicationType: "independent_newsletter",
      currentStack: "Ghost and Mailchimp",
      accountStage: "qualified",
      onboardingStatus: "in_progress",
      priority: "high",
      ownerUserId: "fixture-admin",
      notes: "Qualified fit. Waiting on kickoff call and pricing review.",
      sourcePath: "/lumina/beta",
      source: "beta_form_submit",
      nextFollowUpAt: new Date("2026-03-20T12:00:00.000Z"),
      lastContactedAt: new Date("2026-03-16T12:00:00.000Z"),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  await db.insert(betaOpsFeedback).values({
    betaAccountId: account.id,
    contactMessageId: betaRequest.id,
    title: "Needs clearer pricing guidance",
    summary: "The founder wants more clarity on what changes between beta onboarding and paid rollout.",
    status: "new",
    priority: "high",
    source: "ops_manual",
    ownerUserId: "fixture-admin",
    notes: "Could become FAQ or sales enablement copy.",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function seedOperationalFixtures() {
  await db.delete(appSettings).where(inArray(appSettings.key, [...SETUP_RESET_KEYS]));
  await db.delete(betaOpsFeedback);
  await db.delete(betaOpsAccounts);
  await db.delete(contactMessages);
  await db.delete(menuItems);
  await db.delete(menus);
  await db.delete(redirects).where(eq(redirects.sourcePath, "/go-premium"));
  await db.delete(webhooks).where(eq(webhooks.name, "Fixture Publish Hook"));
  await db.delete(media).where(eq(media.filename, FIXTURE_UPLOAD_FILENAME));
  await db.delete(pages).where(
    inArray(pages.slug, ["fixture-home", ...SETUP_STARTER_PAGE_SLUGS, ...FIXTURE_PAGE_SLUGS]),
  );
  await db.delete(posts).where(
    inArray(posts.slug, [
      "welcome-to-your-publication",
      "fixture-published-post",
      "fixture-premium-post",
      "fixture-draft-post",
      "fixture-review-post",
      "fixture-scheduled-post",
    ]),
  );
  await db.delete(categories).where(inArray(categories.slug, ["operations", "editorial-strategy"]));
  await db.delete(tags).where(inArray(tags.slug, ["readiness", "launch"]));
  await db.delete(newsletters).where(
    inArray(newsletters.subject, ["Fixture newsletter campaign", "Fixture scheduled campaign"]),
  );
  await db.delete(subscribers).where(eq(subscribers.email, "newsletter-fixture@lumina.test"));
  await db.delete(rateLimitEvents);
  await db.delete(securityEvents);
  await db
    .update(membershipPlans)
    .set({
      stripePriceId: null,
      isActive: false,
      isDefault: false,
      updatedAt: new Date(),
    })
    .where(inArray(membershipPlans.slug, ["monthly", "annual"]));

  for (const setting of FIXTURE_SETTINGS) {
    await db
      .insert(appSettings)
      .values({
        ...setting,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: {
          value: setting.value,
          updatedAt: new Date(),
        },
      });
  }

  const passwordHash = await hashPassword(FIXTURE_PASSWORD);
  for (const fixtureUser of FIXTURE_USERS) {
    await ensureFixtureUser(fixtureUser, passwordHash);
  }

  await ensureTaxonomyFixtures();
  await ensureFixturePosts("fixture-author");
  await ensureFixturePages();
  await ensureNavigationFixtures();
  await ensureRedirectAndWebhookFixtures();
  await ensureMediaFixture();
  await ensureMembershipFixture();
  await ensureNewsletterFixture();
  await ensureLaunchOpsFixture();

  return {
    password: FIXTURE_PASSWORD,
    users: FIXTURE_USERS.map((fixtureUser) => ({
      role: fixtureUser.role,
      email: fixtureUser.email,
    })),
  };
}
