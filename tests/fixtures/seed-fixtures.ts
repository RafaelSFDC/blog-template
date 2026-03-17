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
  membershipPlans,
  newsletterConsents,
  newsletters,
  pages,
  posts,
  rateLimitEvents,
  securityEvents,
  subscriptions,
  subscribers,
  tags,
  user,
} from "#/db/schema";

const FIXTURE_PASSWORD = "Password123!";

const FIXTURE_USERS = [
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
] as const;

const FIXTURE_SETTINGS = [
  { key: "blogName", value: "Lumina" },
  { key: "blogDescription", value: "Fixture publication for staging and tests." },
  { key: "siteUrl", value: "http://127.0.0.1:3000" },
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

async function ensureFixturePost(authorId: string) {
  await db
    .insert(categories)
    .values({
      name: "Operations",
      slug: "operations",
      description: "Operational publishing coverage",
    })
    .onConflictDoUpdate({
      target: categories.slug,
      set: {
        name: "Operations",
        description: "Operational publishing coverage",
      },
    });

  await db
    .insert(tags)
    .values({
      name: "Readiness",
      slug: "readiness",
    })
    .onConflictDoUpdate({
      target: tags.slug,
      set: {
        name: "Readiness",
      },
    });

  await db
    .insert(posts)
    .values({
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
    })
    .onConflictDoUpdate({
      target: posts.slug,
      set: {
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
    });

  await db
    .insert(posts)
    .values({
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
    })
    .onConflictDoUpdate({
      target: posts.slug,
      set: {
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
    });

  const publishedPost = await db.query.posts.findFirst({
    where: eq(posts.slug, "fixture-published-post"),
  });

  if (!publishedPost) {
    throw new Error("Fixture published post was not created.");
  }

  const existingComment = await db.query.comments.findFirst({
    where: eq(comments.postId, publishedPost.id),
  });

  if (!existingComment) {
    await db.insert(comments).values({
      postId: publishedPost.id,
      authorName: "Fixture Reader",
      authorEmail: "reader@lumina.test",
      content: "Fixture pending comment for moderation flows.",
      status: "pending",
      createdAt: new Date(),
    });
  }
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
  await db.delete(pages).where(inArray(pages.slug, [...SETUP_STARTER_PAGE_SLUGS]));
  await db.delete(posts).where(eq(posts.slug, "welcome-to-your-publication"));
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

  await ensureFixturePost("fixture-author");
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
