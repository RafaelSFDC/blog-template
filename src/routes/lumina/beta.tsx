import { createFileRoute } from "@tanstack/react-router";
import { LuminaBetaRequestForm } from "#/components/lumina/beta-request-form";
import {
  LuminaBulletList,
  LuminaHero,
  LuminaSection,
  LuminaSectionHeader,
} from "#/components/lumina/marketing-shell";
import { buildLuminaProductSeo } from "#/lib/lumina-marketing";

export const Route = createFileRoute("/lumina/beta")({
  head: () =>
    buildLuminaProductSeo({
      path: "/lumina/beta",
      title: "Request Lumina beta access | Tell us about your publication workflow",
      description:
        "Request access to the Lumina beta and share what you publish, which stack you use today, and what a better launch workflow would solve.",
    }),
  component: LuminaBetaPage,
});

function LuminaBetaPage() {
  return (
    <>
      <LuminaHero
        badge="Beta request"
        title="Tell us what you publish and what is slowing your launch down."
        description="The current commercial path is a beta request because we want to keep onboarding deliberate, qualify fit, and learn from real publication teams."
        primaryCtaLabel="Submit request below"
        primaryCtaHref="/lumina/beta"
        secondaryCtaLabel="Review pricing first"
        secondaryCtaHref="/lumina/pricing"
      />

      <LuminaSection className="pb-16">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="rounded-md border bg-card p-8 shadow-sm">
              <LuminaSectionHeader
                eyebrow="What helps us qualify fit"
                title="The best requests are specific."
                description="We are looking for publication teams with a clear need around launch speed, newsletter operations, premium content, or editorial workflow."
              />
              <LuminaBulletList
                items={[
                  "What kind of publication you run today.",
                  "Which tools make the workflow feel fragmented.",
                  "What a stronger launch surface would help you ship faster.",
                  "Whether you are a solo creator or a small editorial team.",
                ]}
              />
            </div>
          </div>

          <div className="lg:col-span-7">
            <LuminaBetaRequestForm />
          </div>
        </div>
      </LuminaSection>
    </>
  );
}
