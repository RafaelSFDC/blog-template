import { createFileRoute } from "@tanstack/react-router";
import {
  LuminaBulletList,
  LuminaCtaBand,
  LuminaHero,
  LuminaSection,
  LuminaSectionHeader,
} from "#/components/lumina/marketing-shell";
import { buildLuminaProductSeo, luminaPricingTiers } from "#/lib/lumina-marketing";

export const Route = createFileRoute("/lumina/pricing")({
  head: () =>
    buildLuminaProductSeo({
      path: "/lumina/pricing",
      title: "Lumina pricing | Commercial packaging for launch-stage publications",
      description:
        "See how Lumina positions its launch-stage pricing for creators, journalists, and small publication teams. The current path is beta request, not self-serve checkout.",
    }),
  component: LuminaPricingPage,
});

function LuminaPricingPage() {
  return (
    <>
      <LuminaHero
        badge="Pricing"
        title="Packaging shaped for publication businesses, with beta requests as the next step."
        description="This phase is about commercial clarity, not self-serve checkout. Use pricing to understand fit and request access if Lumina matches your launch motion."
        primaryCtaLabel="Request beta access"
        secondaryCtaLabel="See how it works"
        secondaryCtaHref="/lumina/how-it-works"
      />

      <LuminaSection>
        <LuminaSectionHeader
          eyebrow="Commercial framing"
          title="A simple pricing surface that explains fit before it tries to close a transaction."
          description="Each package reflects a stage of operational maturity, from solo creator launches to publication teams that need guided rollout."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {luminaPricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-md border bg-card p-6 shadow-sm ${
                tier.badge ? "ring-2 ring-primary/30" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{tier.name}</h2>
                  <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                    {tier.priceLabel}
                  </p>
                </div>
                {tier.badge ? (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-primary">
                    {tier.badge}
                  </span>
                ) : null}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {tier.description}
              </p>
              <div className="mt-6">
                <LuminaBulletList items={tier.highlights} />
              </div>
            </div>
          ))}
        </div>
      </LuminaSection>

      <LuminaSection>
        <div className="rounded-md border bg-card p-8 shadow-sm">
          <LuminaSectionHeader
            eyebrow="What pricing is signaling"
            title="Lumina is optimized for people running content businesses, not hobby sites."
            description="The commercial story should make the product fit obvious even before checkout exists."
          />
          <LuminaBulletList
            items={[
              "Launch-ready CMS pages instead of starting from an empty install.",
              "Newsletter and memberships as first-class product surfaces.",
              "Editorial workflow and multi-user setup for serious publishing teams.",
              "A beta path that keeps onboarding deliberate while the product matures.",
            ]}
          />
        </div>
      </LuminaSection>

      <LuminaCtaBand
        title="If this packaging matches your publication stage, request beta access."
        description="We will use your request to qualify fit, understand current stack pain, and shape onboarding with early users."
      />
    </>
  );
}
