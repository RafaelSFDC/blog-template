import { createFileRoute } from "@tanstack/react-router";
import {
  LuminaBulletList,
  LuminaCtaBand,
  LuminaHero,
  LuminaSection,
  LuminaSectionHeader,
} from "#/components/lumina/marketing-shell";
import { buildLuminaProductSeo, luminaCoreFeatures, luminaHowItWorksSteps } from "#/lib/lumina-marketing";

export const Route = createFileRoute("/lumina/how-it-works")({
  head: () =>
    buildLuminaProductSeo({
      path: "/lumina/how-it-works",
      title: "How Lumina works | Publication setup, growth, and monetization in one flow",
      description:
        "See how Lumina connects setup, publishing, newsletters, and memberships into one cleaner operating flow for digital publications.",
    }),
  component: LuminaHowItWorksPage,
});

function LuminaHowItWorksPage() {
  return (
    <>
      <LuminaHero
        badge="How it works"
        title="One product spine for setup, publishing, distribution, and monetization."
        description="Lumina is structured to reduce the handoff friction that happens when your site, newsletter, pricing, and membership logic all live in different tools."
        secondaryCtaLabel="Request beta access"
        secondaryCtaHref="/lumina/beta"
      />

      <LuminaSection>
        <LuminaSectionHeader
          eyebrow="The flow"
          title="A launch path designed for publication teams, not generic websites."
          description="The product is opinionated where it matters most during launch: setup, page creation, publishing, newsletter capture, and paid conversion surfaces."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {luminaHowItWorksSteps.map((step, index) => (
            <div key={step.title} className="rounded-md border bg-card p-6 shadow-sm">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-primary">
                {`0${index + 1}`}
              </p>
              <h2 className="text-xl font-bold text-foreground">{step.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </LuminaSection>

      <LuminaSection>
        <LuminaSectionHeader
          eyebrow="What gets connected"
          title="The surfaces that usually create launch friction are aligned on purpose."
          description="Instead of stacking separate tools and custom glue, Lumina keeps the most important publication functions in the same operating layer."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {luminaCoreFeatures.map((feature) => (
            <div key={feature.title} className="rounded-md border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-bold text-foreground">{feature.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </LuminaSection>

      <LuminaSection>
        <div className="rounded-md border bg-card p-8 shadow-sm">
          <LuminaSectionHeader
            eyebrow="Why teams ask for a better stack"
            title="What Lumina is trying to remove from the launch equation."
            description="The product is built around the moments that usually slow early publication businesses down."
          />
          <LuminaBulletList
            items={[
              "Unclear setup order and too many manual configuration steps.",
              "Weak default pages that make a new publication look unfinished.",
              "Disconnected newsletter, membership, and pricing experiences.",
              "Noisy toolchain handoffs between editorial work and conversion surfaces.",
            ]}
          />
        </div>
      </LuminaSection>

      <LuminaCtaBand
        title="See if Lumina fits your launch motion."
        description="The beta is best for teams that want one coherent product for publishing, newsletter growth, and premium conversion."
      />
    </>
  );
}
