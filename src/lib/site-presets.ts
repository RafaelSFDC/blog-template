import type { Data } from "@puckeditor/core";
import { serializePuckData } from "#/lib/puck";
import type {
  LaunchTemplateKey,
  LegacySitePresetKey,
  MenuItemView,
  SitePresetKey,
} from "#/types/system";
import type { PageEditorFormValues } from "#/types/editorial";

export const SITE_PRESET_KEYS = [
  "creator",
  "magazine",
  "premium_publication",
] as const satisfies readonly SitePresetKey[];

export const LEGACY_SITE_PRESET_KEYS = [
  "creator-journal",
  "magazine-newsletter",
  "premium-publication",
] as const satisfies readonly LegacySitePresetKey[];

export const SITE_PRESET_INPUT_KEYS = [
  ...SITE_PRESET_KEYS,
  ...LEGACY_SITE_PRESET_KEYS,
] as const;

type PresetMenuItem = Omit<MenuItemView, "id">;

type SitePresetInputKey = SitePresetKey | LegacySitePresetKey;

interface SitePresetDefinition {
  key: SitePresetKey;
  label: string;
  description: string;
  themeVariant: string;
  badge: string;
  voice: string;
  proofPoints: string[];
  newsletterTitle: string;
  newsletterDescription: string;
  primaryCtaText: string;
  primaryCtaHref: string;
  secondaryCtaText: string;
  secondaryCtaHref: string;
  featuredHeading: string;
  featuredDescription: string;
  emptyPostMessage: string;
  pricingTitle: string;
  pricingDescription: string;
  pricingPrimaryHref: string;
  primaryMenu: PresetMenuItem[];
  footerMenu: PresetMenuItem[];
}

interface LaunchTemplateDefinition {
  key: LaunchTemplateKey;
  label: string;
  slug: string;
  description: string;
  isHome: boolean;
  minimumLaunchTemplate: boolean;
  supportedPresets?: SitePresetKey[];
}

const SITE_PRESET_ALIASES: Record<SitePresetInputKey, SitePresetKey> = {
  creator: "creator",
  magazine: "magazine",
  premium_publication: "premium_publication",
  "creator-journal": "creator",
  "magazine-newsletter": "magazine",
  "premium-publication": "premium_publication",
};

const TEMPLATE_DEFINITIONS: LaunchTemplateDefinition[] = [
  {
    key: "home",
    label: "Homepage",
    slug: "home",
    description: "Landing principal da publicação com direção editorial clara.",
    isHome: true,
    minimumLaunchTemplate: true,
  },
  {
    key: "about",
    label: "About",
    slug: "about",
    description: "Apresenta a voz, promessa e missão editorial.",
    isHome: false,
    minimumLaunchTemplate: true,
  },
  {
    key: "pricing",
    label: "Pricing",
    slug: "pricing",
    description: "Explica o valor da assinatura e direciona para conversão.",
    isHome: false,
    minimumLaunchTemplate: true,
  },
  {
    key: "contact",
    label: "Contact",
    slug: "contact",
    description: "Cria um canal claro para leitores, parceiros e suporte.",
    isHome: false,
    minimumLaunchTemplate: true,
  },
  {
    key: "newsletterLanding",
    label: "Newsletter landing",
    slug: "newsletter",
    description: "Landing dedicada à captação de email no tom do preset.",
    isHome: false,
    minimumLaunchTemplate: true,
  },
  {
    key: "membersOnlyArchive",
    label: "Members-only archive",
    slug: "members-only-archive",
    description: "Página extra de valor para o arquivo premium.",
    isHome: false,
    minimumLaunchTemplate: false,
    supportedPresets: ["premium_publication"],
  },
];

const SITE_PRESETS: Record<SitePresetKey, SitePresetDefinition> = {
  creator: {
    key: "creator",
    label: "Creator",
    description: "Autoral, direto e orientado por uma voz individual forte.",
    themeVariant: "theme-linear",
    badge: "Creator publication",
    voice: "Field notes, essays, sharp observations, and reader-supported publishing.",
    proofPoints: [
      "Personal editorial rhythm",
      "Newsletter-led audience building",
      "A direct path from free readers to supporters",
    ],
    newsletterTitle: "Get the next note first",
    newsletterDescription:
      "A concise editorial note whenever a new essay, observation, or edition goes live.",
    primaryCtaText: "Read the latest notes",
    primaryCtaHref: "/blog",
    secondaryCtaText: "See membership",
    secondaryCtaHref: "/pricing",
    featuredHeading: "Latest Notes",
    featuredDescription: "Essays, field notes, and ideas published in the creator's voice.",
    emptyPostMessage:
      "Your publication is ready. Publish the first note to turn this space into a living creator journal.",
    pricingTitle: "Support the creator's work",
    pricingDescription:
      "Frame membership as the simplest way to keep independent work sustainable and consistent.",
    pricingPrimaryHref: "/pricing",
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
  magazine: {
    key: "magazine",
    label: "Magazine",
    description: "Mais editorial, recorrente e com senso de edição curada.",
    themeVariant: "theme-vitrine-pro",
    badge: "Magazine issue",
    voice: "Curated coverage, recurring issues, stronger packaging, and a clearer newsroom rhythm.",
    proofPoints: [
      "Recurring editorial issues",
      "A stronger archive for returning readers",
      "Newsletter distribution tied to every edition",
    ],
    newsletterTitle: "Join the editorial list",
    newsletterDescription:
      "Get every issue, editor's note, and featured story straight in your inbox.",
    primaryCtaText: "Browse the latest issue",
    primaryCtaHref: "/blog",
    secondaryCtaText: "Join the list",
    secondaryCtaHref: "/newsletter",
    featuredHeading: "Featured Stories",
    featuredDescription: "Curated reporting and recurring issues from the publication.",
    emptyPostMessage:
      "This magazine shell is ready. Publish the first issue or feature story to complete the launch impression.",
    pricingTitle: "Turn recurring readers into members",
    pricingDescription:
      "Position membership as the way readers stay close to every issue and deeper archive.",
    pricingPrimaryHref: "/pricing",
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
  premium_publication: {
    key: "premium_publication",
    label: "Premium Publication",
    description: "Mais sofisticado, com ênfase em assinatura, valor recorrente e arquivo premium.",
    themeVariant: "theme-elegantluxury",
    badge: "Premium publication",
    voice: "Subscriber-first reporting, premium archive access, and a sharper membership pitch.",
    proofPoints: [
      "Subscriber-first editorial value",
      "Premium archive as the upgrade path",
      "A free briefing that leads naturally to paid membership",
    ],
    newsletterTitle: "Start with the free briefing",
    newsletterDescription:
      "Sample the editorial voice before upgrading to the full members archive.",
    primaryCtaText: "Explore the members thesis",
    primaryCtaHref: "/pricing",
    secondaryCtaText: "Join the briefing",
    secondaryCtaHref: "/newsletter",
    featuredHeading: "Editor's Selection",
    featuredDescription: "Public stories that preview the value behind the premium archive.",
    emptyPostMessage:
      "The premium shell is in place. Publish the first public story to signal quality before readers upgrade.",
    pricingTitle: "Make premium value explicit",
    pricingDescription:
      "Use pricing to connect the free briefing, paid archive, and ongoing membership promise.",
    pricingPrimaryHref: "/members-only-archive",
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

function getTemplateDefinition(templateKey: LaunchTemplateKey) {
  const template = TEMPLATE_DEFINITIONS.find((entry) => entry.key === templateKey);

  if (!template) {
    throw new Error(`Unknown launch template: ${templateKey}`);
  }

  return template;
}

export function resolveSitePresetKey(value?: string | null): SitePresetKey {
  if (value && value in SITE_PRESET_ALIASES) {
    return SITE_PRESET_ALIASES[value as SitePresetInputKey];
  }

  return "creator";
}

export function getSitePresetDefinition(presetKey?: string | null) {
  return SITE_PRESETS[resolveSitePresetKey(presetKey)];
}

export function getSitePresets() {
  return SITE_PRESET_KEYS.map((key) => SITE_PRESETS[key]);
}

export function getLaunchTemplates(input?: { presetKey?: string | null; includeOptional?: boolean }) {
  const presetKey = resolveSitePresetKey(input?.presetKey);
  const includeOptional = input?.includeOptional ?? true;

  return TEMPLATE_DEFINITIONS.filter((template) => {
    if (!includeOptional && !template.minimumLaunchTemplate) {
      return false;
    }

    if (template.supportedPresets && !template.supportedPresets.includes(presetKey)) {
      return false;
    }

    return true;
  });
}

export function getLaunchTemplateOptions(input?: {
  presetKey?: string | null;
  includeOptional?: boolean;
}) {
  return getLaunchTemplates(input).map((template) => ({
    key: template.key,
    label: template.label,
    description: template.description,
    slug: template.slug,
    minimumLaunchTemplate: template.minimumLaunchTemplate,
  }));
}

export function getMinimumLaunchTemplateSlugs(presetKey?: string | null) {
  return getLaunchTemplates({ presetKey, includeOptional: false }).map((template) => template.slug);
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
  const description = input.blogDescription || preset.voice;

  return {
    badge: preset.badge,
    title: input.blogName,
    description,
    primaryCtaText: preset.primaryCtaText,
    primaryCtaHref: preset.primaryCtaHref,
    secondaryCtaText: preset.secondaryCtaText,
    secondaryCtaHref: preset.secondaryCtaHref,
    newsletterTitle: preset.newsletterTitle,
    newsletterDescription: preset.newsletterDescription,
    featuredHeading: preset.featuredHeading,
    featuredDescription: preset.featuredDescription,
    emptyPostMessage: preset.emptyPostMessage,
    metaTitle: `${input.blogName} | ${preset.label}`,
    metaDescription: description,
  };
}

export function buildTemplatePageValues(input: {
  presetKey?: string | null;
  templateKey: LaunchTemplateKey;
  blogName: string;
  blogDescription: string;
}): PageEditorFormValues {
  const preset = getSitePresetDefinition(input.presetKey);
  const template = getTemplateDefinition(input.templateKey);

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
        primaryCtaText: preset.primaryCtaText,
        primaryCtaHref: preset.primaryCtaHref,
        secondaryCtaText: preset.secondaryCtaText,
        secondaryCtaHref: preset.secondaryCtaHref,
      }),
      ...buildProofStrip(preset.proofPoints),
      buildFeatureGrid({
        title: "What readers can expect",
        description: "Use this section to clarify the cadence, lens, and membership promise.",
        items: [
          {
            title: "Editorial direction",
            description: preset.voice,
          },
          {
            title: "Launch-ready structure",
            description: "Start with a homepage, newsletter funnel, and pages that already feel intentional.",
          },
          {
            title: "Next reader step",
            description: preset.pricingDescription,
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
        description: `Explain the lens, rhythm, and promise behind this ${preset.label.toLowerCase()} publication.`,
        primaryCtaText: "Read the archive",
        primaryCtaHref: "/blog",
        secondaryCtaText: "Get in touch",
        secondaryCtaHref: "/contact",
      }),
      buildRichTextBlock(
        "Editorial mission",
        "Use this section to explain what the publication covers, who it serves, and why your perspective matters right now.",
      ),
      buildFeatureGrid({
        title: "What shapes the publication",
        description: "Turn your differentiators into crisp reasons to follow, subscribe, and return.",
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
        title: preset.pricingTitle,
        description: preset.pricingDescription,
        primaryCtaText: "View plans below",
        primaryCtaHref: "#pricing-plans",
        secondaryCtaText: "See archive value",
        secondaryCtaHref: preset.pricingPrimaryHref,
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
