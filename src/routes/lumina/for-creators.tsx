import { createFileRoute } from "@tanstack/react-router";
import {
  LuminaBulletList,
  LuminaCtaBand,
  LuminaHero,
  LuminaSection,
  LuminaSectionHeader,
} from "#/components/lumina/marketing-shell";
import { buildLuminaProductSeo, getLuminaAudiencePage } from "#/lib/lumina-marketing";

export const Route = createFileRoute("/lumina/for-creators")({
  head: () =>
    buildLuminaProductSeo({
      path: "/lumina/for-creators",
      title: "Lumina for creators | Newsletter, site, and memberships in one product",
      description:
        "See how Lumina helps creators launch a publication that looks intentional, captures subscribers, and supports paid memberships without a stitched-together stack.",
    }),
  component: CreatorsPage,
});

function CreatorsPage() {
  const page = getLuminaAudiencePage("creators");

  return (
    <>
      <LuminaHero badge={page.badge} title={page.headline} description={page.subheadline} />

      <LuminaSection>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-md border bg-card p-8 shadow-sm">
            <LuminaSectionHeader
              eyebrow="Pain today"
              title="What slows creators down before they can even test the offer."
              description="The stack usually fragments right where launch speed and paid conversion should feel easiest."
            />
            <LuminaBulletList items={page.painPoints} />
          </div>

          <div className="rounded-md border bg-card p-8 shadow-sm">
            <LuminaSectionHeader
              eyebrow="What Lumina improves"
              title="A cleaner route from first setup to first paid member."
              description="The product is shaped around early publication businesses that need credibility and coherence fast."
            />
            <LuminaBulletList items={page.wins} />
          </div>
        </div>
      </LuminaSection>

      <LuminaCtaBand
        title="If you are building an audience business, Lumina is built for this exact transition."
        description="Request beta access and share how your current stack is limiting the publication you want to launch."
      />
    </>
  );
}
