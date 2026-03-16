import { createFileRoute, Link } from "@tanstack/react-router";
import { LayoutTemplate, Mail, ShieldCheck } from "lucide-react";
import { Button } from "#/components/ui/button";
import {
  LuminaBulletList,
  LuminaCtaBand,
  LuminaHero,
  LuminaSection,
  LuminaSectionHeader,
} from "#/components/lumina/marketing-shell";
import {
  buildLuminaProductSeo,
  luminaAudiencePages,
  luminaCoreFeatures,
  luminaHowItWorksSteps,
  luminaSocialProof,
} from "#/lib/lumina-marketing";

export const Route = createFileRoute("/lumina/")({
  head: () =>
    buildLuminaProductSeo({
      path: "/lumina",
      title: "Lumina | Launch and monetize a publication with one operating system",
      description:
        "Lumina helps creators, journalists, and small publications publish, grow a newsletter, and run memberships from one launch-ready product.",
    }),
  component: LuminaLandingPage,
});

function LuminaLandingPage() {
  return (
    <>
      <LuminaHero
        badge="Commercial preview"
        title="A publication operating system for teams who want clarity, speed, and real launch readiness."
        description="Lumina brings CMS, newsletter growth, memberships, pricing surfaces, and editorial workflow into one calmer layer so a new publication can look credible and convert sooner."
        primaryCtaLabel="Request beta access"
        secondaryCtaLabel="See product pricing"
        secondaryCtaHref="/lumina/pricing"
        aside={
          <div className="grid gap-4">
            {[
              {
                icon: LayoutTemplate,
                title: "Launch-ready pages",
                copy: "Preset-driven home, pricing, about, newsletter, and archive surfaces.",
              },
              {
                icon: Mail,
                title: "Newsletter-native",
                copy: "Grow your list and operate campaigns from the same publication layer.",
              },
              {
                icon: ShieldCheck,
                title: "Membership-ready",
                copy: "Pricing, premium access, and member flows are part of the operating model.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-md border bg-card p-6 shadow-sm">
                <item.icon className="mb-4 size-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.copy}</p>
              </div>
            ))}
          </div>
        }
      />

      <LuminaSection>
        <div className="grid gap-4 lg:grid-cols-3">
          {luminaSocialProof.map((item) => (
            <div key={item} className="rounded-md border bg-card p-6 shadow-sm">
              <p className="text-base font-medium leading-relaxed text-foreground">{item}</p>
            </div>
          ))}
        </div>
      </LuminaSection>

      <LuminaSection>
        <LuminaSectionHeader
          eyebrow="How Lumina works"
          title="From first setup to first subscriber, the product is built to shorten time-to-value."
          description="Lumina is not trying to be a generic site builder. It is focused on helping publication businesses launch, publish, distribute, and monetize from one product."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {luminaHowItWorksSteps.map((step, index) => (
            <div key={step.title} className="rounded-md border bg-card p-6 shadow-sm">
              <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-primary">
                Step {index + 1}
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
          eyebrow="Core surfaces"
          title="The parts that make Lumina commercially useful from day one."
          description="The product combines the surfaces that usually get spread across too many tools, defaults, and manual glue."
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
        <LuminaSectionHeader
          eyebrow="Use cases"
          title="Different audiences, same product spine."
          description="Lumina adapts its launch story to the people actually shipping premium content businesses."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {luminaAudiencePages.map((page) => (
            <div key={page.key} className="rounded-md border bg-card p-6 shadow-sm">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-primary">
                {page.badge}
              </p>
              <h2 className="text-2xl font-bold text-foreground">{page.label}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {page.subheadline}
              </p>
              <div className="mt-5">
                <LuminaBulletList items={page.wins} />
              </div>
              <Button asChild variant="ghost" size="sm" className="mt-5 px-0">
                <Link to={page.href}>Explore {page.label}</Link>
              </Button>
            </div>
          ))}
        </div>
      </LuminaSection>

      <LuminaCtaBand
        title="If your publication stack still feels stitched together, Lumina is the conversation to start."
        description="Request beta access and tell us what you publish, what breaks today, and what a more coherent launch surface would unlock."
      />
    </>
  );
}
