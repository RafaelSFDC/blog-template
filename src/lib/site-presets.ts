import type { Data } from "@puckeditor/core";
import { serializePuckData } from "#/lib/puck";
import type {
  LaunchTemplateKey,
  SitePresetKey,
} from "#/types/system";
import type { MenuItemView } from "#/types/system";
import type { PageEditorFormValues } from "#/types/editorial";

const SITE_PRESET_KEYS = [
  "creator-journal",
  "magazine-newsletter",
  "premium-publication",
] as const satisfies readonly SitePresetKey[];

type PresetMenuItem = Omit<MenuItemView, "id">;

interface SitePresetDefinition {
  key: SitePresetKey;
  label: string;
  description: string;
  themeVariant: string;
  badge: string;
  voice: string;
  newsletterTitle: string;
  newsletterDescription: string;
  primaryMenu: PresetMenuItem[];
  footerMenu: PresetMenuItem[];
}

interface LaunchTemplateDefinition {
  key: LaunchTemplateKey;
  label: string;
  slug: string;
  description: string;
  isHome: boolean;
}

const TEMPLATE_DEFINITIONS: LaunchTemplateDefinition[] = [
  {
    key: "home",
    label: "Homepage",
    slug: "home",
    description: "Landing principal da publicacao.",
    isHome: true,
  },
  {
    key: "about",
    label: "About",
    slug: "about",
    description: "Apresenta a voz e a proposta editorial.",
    isHome: false,
  },
  {
    key: "pricing",
    label: "Pricing",
    slug: "pricing",
    description: "Explica o valor da assinatura e guia a conversao.",
    isHome: false,
  },
  {
    key: "contact",
    label: "Contact",
    slug: "contact",
    description: "Canal claro para leitores, parceiros e suporte.",
    isHome: false,
  },
  {
    key: "newsletterLanding",
    label: "Newsletter landing",
    slug: "newsletter",
    description: "Landing focada em captação de email.",
    isHome: false,
  },
  {
    key: "membersOnlyArchive",
    label: "Members-only archive",
    slug: "members-only-archive",
    description: "Landing de valor para o arquivo premium.",
    isHome: false,
  },
];

const SITE_PRESETS: Record<SitePresetKey, SitePresetDefinition> = {
  "creator-journal": {
    key: "creator-journal",
    label: "Creator / Journal",
    description: "Minimalista, autoral e focado em voz individual.",
    themeVariant: "theme-linear",
    badge: "Creator journal",
    voice: "Direct essays, field notes, and reader-supported writing.",
    newsletterTitle: "Get the next issue first",
    newsletterDescription:
      "A concise editorial note whenever a new essay, analysis, or edition goes live.",
    primaryMenu: [
      { label: "Home", href: "/", kind: "internal", sortOrder: 0 },
      { label: "About", href: "/about", kind: "internal", sortOrder: 1 },
      { label: "Newsletter", href: "/newsletter", kind: "internal", sortOrder: 2 },
      { label: "Pricing", href: "/pricing", kind: "internal", sortOrder: 3 },
      { label: "Contact", href: "/contact", kind: "internal", sortOrder: 4 },
    ],
    footerMenu: [
      { label: "About", href: "/about", kind: "internal", sortOrder: 0 },
      { label: "Pricing", href: "/pricing", kind: "internal", sortOrder: 1 },
      { label: "Contact", href: "/contact", kind: "internal", sortOrder: 2 },
    ],
  },
  "magazine-newsletter": {
    key: "magazine-newsletter",
    label: "Magazine / Newsletter",
    description: "Mais editorial, com cara de publicação recorrente e cobertura curada.",
    themeVariant: "theme-vitrine-pro",
    badge: "Magazine issue",
    voice: "Curated stories, recurring issues, and a stronger newsletter habit.",
    newsletterTitle: "Join the editorial list",
    newsletterDescription:
      "Get every issue, member note, and featured story straight in your inbox.",
    primaryMenu: [
      { label: "Home", href: "/", kind: "internal", sortOrder: 0 },
      { label: "Archive", href: "/blog", kind: "internal", sortOrder: 1 },
      { label: "Newsletter", href: "/newsletter", kind: "internal", sortOrder: 2 },
      { label: "Pricing", href: "/pricing", kind: "internal", sortOrder: 3 },
      { label: "Contact", href: "/contact", kind: "internal", sortOrder: 4 },
    ],
    footerMenu: [
      { label: "About", href: "/about", kind: "internal", sortOrder: 0 },
      { label: "Archive", href: "/blog", kind: "internal", sortOrder: 1 },
      { label: "Pricing", href: "/pricing", kind: "internal", sortOrder: 2 },
    ],
  },
  "premium-publication": {
    key: "premium-publication",
    label: "Premium Publication",
    description: "Mais sofisticado, com ênfase em assinatura, arquivo e valor recorrente.",
    themeVariant: "theme-elegantluxury",
    badge: "Premium publication",
    voice: "Subscriber-first reporting, premium archive access, and a sharper membership pitch.",
    newsletterTitle: "Start with the free briefing",
    newsletterDescription:
      "Sample the editorial voice before upgrading to the full members archive.",
    primaryMenu: [
      { label: "Home", href: "/", kind: "internal", sortOrder: 0 },
      { label: "Archive", href: "/members-only-archive", kind: "internal", sortOrder: 1 },
      { label: "Newsletter", href: "/newsletter", kind: "internal", sortOrder: 2 },
      { label: "Pricing", href: "/pricing", kind: "internal", sortOrder: 3 },
      { label: "About", href: "/about", kind: "internal", sortOrder: 4 },
    ],
    footerMenu: [
      { label: "Archive", href: "/members-only-archive", kind: "internal", sortOrder: 0 },
      { label: "Pricing", href: "/pricing", kind: "internal", sortOrder: 1 },
      { label: "Contact", href: "/contact", kind: "internal", sortOrder: 2 },
    ],
  },
};

function buildProofStrip(items: string[]): Data["content"] {
  return [
    {
      type: "ProofStrip",
      props: {
        items: items.map((item) => ({ text: item })),
      },
    },
  ];
}

function buildHeroBlock(input: {
  badge: string;
  title: string;
  description: string;
  primaryCtaText: string;
  primaryCtaHref: string;
  secondaryCtaText: string;
  secondaryCtaHref: string;
}) {
  return {
    type: "LaunchHero",
    props: input,
  };
}

function buildRichTextBlock(title: string, body: string) {
  return {
    type: "RichTextSection",
    props: {
      title,
      body,
    },
  };
}

function buildFeatureGrid(input: {
  title: string;
  description: string;
  items: Array<{ title: string; description: string }>;
}) {
  return {
    type: "FeatureGrid",
    props: input,
  };
}

function buildSubscribeBlock(preset: SitePresetDefinition) {
  return {
    type: "NewsletterSignupSection",
    props: {
      title: preset.newsletterTitle,
      description: preset.newsletterDescription,
      buttonText: "Subscribe",
      placeholder: "name@example.com",
    },
  };
}

function buildPricingBlock(input: {
  title: string;
  description: string;
  plans: Array<{ name: string; priceLabel: string; summary: string; highlight?: boolean }>;
}) {
  return {
    type: "PricingHighlights",
    props: input,
  };
}

function buildFaqBlock(items: Array<{ question: string; answer: string }>) {
  return {
    type: "FaqSection",
    props: {
      title: "Frequently asked questions",
      items,
    },
  };
}

function buildArchiveTeaser(input: {
  title: string;
  description: string;
  buttonText: string;
  buttonHref: string;
}) {
  return {
    type: "ArchiveTeaser",
    props: input,
  };
}

function createPageData(blocks: Data["content"]): string {
  return serializePuckData({
    root: {},
    content: blocks,
  });
}

function templateTitle(template: LaunchTemplateDefinition, blogName: string) {
  if (template.key === "home") {
    return blogName;
  }

  return template.label;
}

export function getSitePresets() {
  return SITE_PRESET_KEYS.map((key) => SITE_PRESETS[key]);
}

export function getLaunchTemplates() {
  return TEMPLATE_DEFINITIONS;
}

export function resolveSitePresetKey(value?: string | null): SitePresetKey {
  if (value && value in SITE_PRESETS) {
    return value as SitePresetKey;
  }

  return "creator-journal";
}

export function getSitePresetDefinition(presetKey?: string | null) {
  return SITE_PRESETS[resolveSitePresetKey(presetKey)];
}

export function getPresetMenus(presetKey?: string | null) {
  const preset = getSitePresetDefinition(presetKey);
  return {
    primaryMenu: preset.primaryMenu,
    footerMenu: preset.footerMenu,
  };
}

export function getPresetThemeVariant(presetKey?: string | null) {
  return getSitePresetDefinition(presetKey).themeVariant;
}

export function buildHomepageFallbackContent(input: {
  presetKey?: string | null;
  blogName: string;
  blogDescription: string;
}) {
  const preset = getSitePresetDefinition(input.presetKey);

  return {
    badge: preset.badge,
    title: input.blogName,
    description: input.blogDescription || preset.voice,
    primaryCtaText: "Explore the archive",
    primaryCtaHref: "/blog",
    secondaryCtaText: "See membership",
    secondaryCtaHref: "/pricing",
    newsletterTitle: preset.newsletterTitle,
    newsletterDescription: preset.newsletterDescription,
  };
}

export function buildTemplatePageValues(input: {
  presetKey?: string | null;
  templateKey: LaunchTemplateKey;
  blogName: string;
  blogDescription: string;
}): PageEditorFormValues {
  const preset = getSitePresetDefinition(input.presetKey);
  const template = TEMPLATE_DEFINITIONS.find((entry) => entry.key === input.templateKey);

  if (!template) {
    throw new Error(`Unknown launch template: ${input.templateKey}`);
  }

  const commonTitle = templateTitle(template, input.blogName);
  let excerpt = "";
  const metaTitle = commonTitle;
  let metaDescription = input.blogDescription || preset.voice;
  let contentBlocks: Data["content"] = [];

  if (template.key === "home") {
    excerpt = input.blogDescription || preset.voice;
    contentBlocks = [
      buildHeroBlock({
        badge: preset.badge,
        title: input.blogName,
        description:
          input.blogDescription || `A launch-ready publication with the tone of ${preset.label}.`,
        primaryCtaText: "Read the latest stories",
        primaryCtaHref: "/blog",
        secondaryCtaText: "See membership",
        secondaryCtaHref: "/pricing",
      }),
      ...buildProofStrip([
        "Weekly editorial rhythm",
        "Newsletter-first distribution",
        "Membership-ready publishing",
      ]),
      buildFeatureGrid({
        title: "What readers can expect",
        description: "Use this section to clarify your cadence and the kind of value you publish.",
        items: [
          {
            title: "Sharp editorial voice",
            description: "Turn your point of view into a repeatable publishing rhythm.",
          },
          {
            title: "Stronger launch surface",
            description: "Start with a homepage that already feels intentional and public-ready.",
          },
          {
            title: "Revenue-ready setup",
            description: "Guide readers toward newsletter signup and membership without friction.",
          },
        ],
      }),
      buildSubscribeBlock(preset),
    ];
  }

  if (template.key === "about") {
    excerpt = "Tell readers what this publication stands for.";
    metaDescription = `Learn the editorial vision behind ${input.blogName}.`;
    contentBlocks = [
      buildHeroBlock({
        badge: "About the publication",
        title: `Why ${input.blogName} exists`,
        description: "Explain the lens, rhythm, and promise behind the publication.",
        primaryCtaText: "Read the archive",
        primaryCtaHref: "/blog",
        secondaryCtaText: "Get in touch",
        secondaryCtaHref: "/contact",
      }),
      buildRichTextBlock(
        "Editorial mission",
        "Use this section to explain what this publication covers, who it serves, and why your perspective matters.",
      ),
      buildFeatureGrid({
        title: "What shapes the publication",
        description: "Turn your differentiators into crisp reasons to follow and subscribe.",
        items: [
          { title: "Point of view", description: "What do you see differently from everyone else?" },
          { title: "Cadence", description: "How often do you publish and what can readers expect?" },
          { title: "Reader promise", description: "What makes coming back worth it?" },
        ],
      }),
    ];
  }

  if (template.key === "pricing") {
    excerpt = "Show why membership is worth paying for.";
    metaDescription = `Compare plans and explain the membership value of ${input.blogName}.`;
    contentBlocks = [
      buildHeroBlock({
        badge: "Membership",
        title: "Choose how readers support the publication",
        description: "Use this page to turn editorial value into a clear subscription offer.",
        primaryCtaText: "View plans below",
        primaryCtaHref: "#pricing-plans",
        secondaryCtaText: "See archive",
        secondaryCtaHref: "/members-only-archive",
      }),
      buildPricingBlock({
        title: "What membership unlocks",
        description: "These cards are launch copy defaults. The live checkout grid remains below on the pricing route.",
        plans: [
          {
            name: "Monthly",
            priceLabel: "Flexible",
            summary: "Ideal for readers who want to start now with less commitment.",
          },
          {
            name: "Annual",
            priceLabel: "Best value",
            summary: "The strongest offer for loyal readers and long-term supporters.",
            highlight: true,
          },
        ],
      }),
      buildFaqBlock([
        {
          question: "Why pay for membership?",
          answer: "Use this answer to explain the editorial and community value behind the paid tier.",
        },
        {
          question: "What stays free?",
          answer: "Clarify what new readers can sample before upgrading.",
        },
      ]),
    ];
  }

  if (template.key === "contact") {
    excerpt = "Give readers and partners a clear way to reach you.";
    metaDescription = `Contact ${input.blogName} for support, feedback, or collaboration.`;
    contentBlocks = [
      buildHeroBlock({
        badge: "Contact",
        title: "Open a direct line to the publication",
        description: "Set response expectations and invite the right conversations.",
        primaryCtaText: "Send a message",
        primaryCtaHref: "#contact-form",
        secondaryCtaText: "Read about us",
        secondaryCtaHref: "/about",
      }),
      buildRichTextBlock(
        "What to contact us about",
        "Use this section for partnerships, media requests, reader feedback, corrections, or commercial opportunities.",
      ),
    ];
  }

  if (template.key === "newsletterLanding") {
    excerpt = "A landing page dedicated to newsletter conversion.";
    metaDescription = `Join the newsletter from ${input.blogName}.`;
    contentBlocks = [
      buildHeroBlock({
        badge: "Newsletter",
        title: "Subscribe before you miss the next edition",
        description: preset.newsletterDescription,
        primaryCtaText: "Join the list",
        primaryCtaHref: "#newsletter-signup",
        secondaryCtaText: "Preview the archive",
        secondaryCtaHref: "/blog",
      }),
      buildSubscribeBlock(preset),
      buildFaqBlock([
        {
          question: "What lands in the inbox?",
          answer: "Explain the frequency, format, and tone of your newsletter.",
        },
        {
          question: "Is there a paid tier later?",
          answer: "Use this answer to position the newsletter inside your broader funnel.",
        },
      ]),
    ];
  }

  if (template.key === "membersOnlyArchive") {
    excerpt = "Position the premium archive as a compelling upgrade path.";
    metaDescription = `Show the value of the premium archive from ${input.blogName}.`;
    contentBlocks = [
      buildHeroBlock({
        badge: "Members archive",
        title: "Make the premium archive feel worth unlocking",
        description: "Use this page to explain what readers get after the first free taste.",
        primaryCtaText: "See membership",
        primaryCtaHref: "/pricing",
        secondaryCtaText: "Join the newsletter",
        secondaryCtaHref: "/newsletter",
      }),
      buildArchiveTeaser({
        title: "What lives behind membership",
        description:
          "Position the archive as a growing library of your strongest reporting, analysis, essays, or premium guides.",
        buttonText: "Compare plans",
        buttonHref: "/pricing",
      }),
      buildFeatureGrid({
        title: "Why the archive matters",
        description: "Make the upgrade path feel concrete, not abstract.",
        items: [
          { title: "Depth", description: "Longer, richer work that rewards returning readers." },
          { title: "Continuity", description: "An archive that compounds editorial value over time." },
          { title: "Membership signal", description: "A clear reason to move from free to paid." },
        ],
      }),
    ];
  }

  return {
    title: commonTitle,
    slug: template.slug,
    excerpt,
    content: createPageData(contentBlocks),
    metaTitle,
    metaDescription,
    ogImage: "",
    seoNoIndex: false,
    isPremium: false,
    teaserMode: "excerpt",
    status: "draft",
    isHome: template.isHome,
    useVisualBuilder: true,
  };
}

export function getLaunchTemplateOptions() {
  return TEMPLATE_DEFINITIONS.map((template) => ({
    key: template.key,
    label: template.label,
    description: template.description,
    slug: template.slug,
  }));
}
