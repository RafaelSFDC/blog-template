import { buildCanonicalUrl, buildJsonLdScript } from "#/lib/seo";

export type LuminaAudienceKey = "creators" | "journalists" | "publications";

export type LuminaPrimaryCtaTarget = "beta" | "pricing" | "how-it-works";

export interface LuminaNavItem {
  label: string;
  href: string;
}

export interface LuminaAudiencePage {
  key: LuminaAudienceKey;
  href: string;
  label: string;
  badge: string;
  headline: string;
  subheadline: string;
  painPoints: string[];
  wins: string[];
}

export interface LuminaPricingTier {
  name: string;
  priceLabel: string;
  badge?: string;
  description: string;
  highlights: string[];
}

export interface LuminaFaqItem {
  question: string;
  answer: string;
}

export interface LuminaProductSeoInput {
  path: string;
  title: string;
  description: string;
}

export interface LuminaBetaRequestValues {
  name: string;
  email: string;
  role: "creator" | "journalist" | "publication_lead";
  publicationType: "independent_newsletter" | "digital_magazine" | "premium_blog" | "other";
  currentStack: string;
  message: string;
}

export const LUMINA_PRODUCT_NAME = "Lumina";
export const LUMINA_PRODUCT_SITE_URL = "";
export const LUMINA_PRIMARY_CTA_HREF = "/lumina/beta";
export const LUMINA_SECONDARY_CTA_HREF = "/lumina/pricing";

export const luminaMarketingNav: LuminaNavItem[] = [
  { label: "How it works", href: "/lumina/how-it-works" },
  { label: "Pricing", href: "/lumina/pricing" },
  { label: "FAQ", href: "/lumina/faq" },
  { label: "Creators", href: "/lumina/for-creators" },
  { label: "Journalists", href: "/lumina/for-journalists" },
  { label: "Publications", href: "/lumina/for-publications" },
];

export const luminaSocialProof = [
  "Launch a publication with CMS, newsletter, memberships, and SEO in one product.",
  "Give editors and collaborators a real workspace instead of a patchwork of tools.",
  "Move from setup to first subscriber faster, with defaults built for launch readiness.",
];

export const luminaCoreFeatures = [
  {
    title: "CMS that starts beautiful",
    description:
      "Preset-driven launch pages, strong defaults, and a visual builder make the first version of your site feel intentional fast.",
  },
  {
    title: "Newsletter-native publishing",
    description:
      "Publish on the web, grow your list, and manage campaigns from the same operational surface.",
  },
  {
    title: "Memberships without duct tape",
    description:
      "Paid plans, premium access, pricing pages, and subscriber flows live together instead of across disconnected tools.",
  },
  {
    title: "Editorial workflows that scale",
    description:
      "Drafts, reviews, comments, approvals, scheduling, and team roles help small teams ship like a real publication.",
  },
];

export const luminaHowItWorksSteps = [
  {
    title: "Set the voice and structure",
    description:
      "Configure branding, choose a launch preset, and generate home, pricing, newsletter, and member pages from guided setup.",
  },
  {
    title: "Publish and capture demand",
    description:
      "Create posts, launch your newsletter, and turn the site into a real acquisition surface instead of a placeholder.",
  },
  {
    title: "Monetize with one operating layer",
    description:
      "Offer paid access, manage members, and shape the visitor-to-paid path with fewer integration seams.",
  },
];

export const luminaAudiencePages: LuminaAudiencePage[] = [
  {
    key: "creators",
    href: "/lumina/for-creators",
    label: "For creators",
    badge: "Independent creators",
    headline: "Run your newsletter, site, and membership business from one publishing home.",
    subheadline:
      "Lumina helps solo operators and small creator teams launch a publication that feels premium from day one.",
    painPoints: [
      "You are piecing together website builder, email tool, and checkout flows.",
      "Your publication looks unfinished until you spend days customizing it.",
      "Growth and paid conversion live in separate tools and disconnected reports.",
    ],
    wins: [
      "Launch-ready homepage, pricing, about, and newsletter pages.",
      "A cleaner path from visitor to subscriber to paid member.",
      "A product that looks intentional before you hire design help.",
    ],
  },
  {
    key: "journalists",
    href: "/lumina/for-journalists",
    label: "For journalists",
    badge: "Independent journalism",
    headline: "Publish analysis and reporting with the control of a publication stack, not a generic blog.",
    subheadline:
      "Lumina gives journalists a focused surface for editorial publishing, paid archives, and reader relationships.",
    painPoints: [
      "Generic blogging tools do not fit premium reporting and membership models well.",
      "Editorial workflow and audience growth feel disconnected.",
      "You need a professional presence without enterprise newsroom complexity.",
    ],
    wins: [
      "Structured publishing, review, and scheduling workflows.",
      "Members-only archive and premium content paths built into the model.",
      "Newsletter and site aligned for recurring audience engagement.",
    ],
  },
  {
    key: "publications",
    href: "/lumina/for-publications",
    label: "For publications",
    badge: "Niche publications",
    headline: "Give a small digital publication a real operating system for publishing, distribution, and revenue.",
    subheadline:
      "Lumina is built for small editorial businesses that need professionalism, clarity, and repeatable launch operations.",
    painPoints: [
      "Your team needs roles and workflow, but not an enterprise CMS rollout.",
      "Publishing, newsletters, and subscriptions are managed in too many places.",
      "New launches take too much manual setup before they look credible.",
    ],
    wins: [
      "Multi-user editorial flow without enterprise overhead.",
      "Cohesive site, newsletter, and pricing surfaces.",
      "Faster setup for new brands, launches, and experiments.",
    ],
  },
];

export const luminaPricingTiers: LuminaPricingTier[] = [
  {
    name: "Starter",
    priceLabel: "Early beta",
    description: "For solo operators validating the first version of a premium publication.",
    highlights: [
      "Launch presets and CMS-driven pages",
      "Newsletter capture and campaigns",
      "Membership-ready pricing and access controls",
    ],
  },
  {
    name: "Growth",
    priceLabel: "Recommended",
    badge: "Recommended",
    description: "For creators and editorial teams turning an audience into recurring revenue.",
    highlights: [
      "Team workflows and editorial collaboration",
      "Paid membership flows and subscriber lifecycle",
      "Better defaults for launch, conversion, and retention",
    ],
  },
  {
    name: "Publication",
    priceLabel: "Custom rollout",
    description: "For niche publications that want onboarding support and tighter launch operations.",
    highlights: [
      "Guided launch and migration planning",
      "Operational support for beta rollout",
      "Priority feedback loop as the product matures",
    ],
  },
];

export const luminaFaqItems: LuminaFaqItem[] = [
  {
    question: "Who is Lumina for right now?",
    answer:
      "Lumina is designed for independent creators, journalists, and small digital publications that want one place to publish, grow a newsletter, and monetize premium content.",
  },
  {
    question: "Is Lumina a generic website builder?",
    answer:
      "No. Lumina is opinionated around publication workflows, newsletter growth, memberships, and launch-ready editorial surfaces.",
  },
  {
    question: "Can I use Lumina without a developer?",
    answer:
      "That is the direction of the product. The setup wizard, presets, and template-driven pages are built to reduce engineering dependency for admins.",
  },
  {
    question: "Is the beta focused on self-serve checkout?",
    answer:
      "Not in this phase. The current commercial path is a beta request so onboarding and feedback can stay deliberate while the go-to-market surface matures.",
  },
  {
    question: "What makes Lumina different from stitching tools together?",
    answer:
      "Lumina keeps CMS, newsletter, pricing, memberships, and editorial workflows in one product, which reduces setup friction and makes the launch path more coherent.",
  },
];

export function getLuminaAudiencePage(key: LuminaAudienceKey) {
  return luminaAudiencePages.find((page) => page.key === key) ?? luminaAudiencePages[0];
}

export function resolveLuminaPrimaryCta(target: LuminaPrimaryCtaTarget) {
  switch (target) {
    case "pricing":
      return { label: "See pricing", href: "/lumina/pricing" };
    case "how-it-works":
      return { label: "See how it works", href: "/lumina/how-it-works" };
    default:
      return { label: "Request beta access", href: LUMINA_PRIMARY_CTA_HREF };
  }
}

export function buildLuminaProductSeo(input: LuminaProductSeoInput) {
  const canonical = buildCanonicalUrl(LUMINA_PRODUCT_SITE_URL, input.path);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: LUMINA_PRODUCT_NAME,
    applicationCategory: "BusinessApplication",
    description: input.description,
    url: canonical || input.path,
  };

  return {
    meta: [
      { title: input.title },
      { name: "description", content: input.description },
      { name: "robots", content: "index, follow" },
      { property: "og:site_name", content: LUMINA_PRODUCT_NAME },
      { property: "og:title", content: input.title },
      { property: "og:description", content: input.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: canonical || input.path },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: input.title },
      { name: "twitter:description", content: input.description },
    ],
    links: canonical ? [{ rel: "canonical", href: canonical }] : [],
    scripts: [buildJsonLdScript(jsonLd)],
  };
}

export function formatLuminaBetaRequestMessage(values: LuminaBetaRequestValues) {
  return [
    "Lumina beta request",
    "",
    `Role: ${values.role}`,
    `Publication type: ${values.publicationType}`,
    `Current stack: ${values.currentStack}`,
    "",
    "Why now:",
    values.message.trim(),
  ].join("\n");
}
