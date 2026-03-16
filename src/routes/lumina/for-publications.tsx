import { createFileRoute } from "@tanstack/react-router";
import {
  LuminaBulletList,
  LuminaCtaBand,
  LuminaHero,
  LuminaSection,
  LuminaSectionHeader,
} from "#/components/lumina/marketing-shell";
import { buildLuminaProductSeo, getLuminaAudiencePage } from "#/lib/lumina-marketing";

export const Route = createFileRoute("/lumina/for-publications")({
  head: () =>
    buildLuminaProductSeo({
      path: "/lumina/for-publications",
      title: "Lumina for publications | A calmer publishing stack for small editorial teams",
      description:
        "See how Lumina helps small digital publications run launch-ready pages, newsletters, memberships, and editorial workflow from one product surface.",
    }),
  component: PublicationsPage,
});

function PublicationsPage() {
  const page = getLuminaAudiencePage("publications");

  return (
    <>
      <LuminaHero badge={page.badge} title={page.headline} description={page.subheadline} />

      <LuminaSection>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-md border bg-card p-8 shadow-sm">
            <LuminaSectionHeader
              eyebrow="Pain today"
              title="Why small editorial teams outgrow generic stacks quickly."
              description="You need more structure than a solo creator tool, but less overhead than an enterprise rollout."
            />
            <LuminaBulletList items={page.painPoints} />
          </div>

          <div className="rounded-md border bg-card p-8 shadow-sm">
            <LuminaSectionHeader
              eyebrow="What Lumina improves"
              title="A real operating layer for a modern niche publication."
              description="Lumina is designed to make launch, workflow, distribution, and premium conversion feel like parts of one system."
            />
            <LuminaBulletList items={page.wins} />
          </div>
        </div>
      </LuminaSection>

      <LuminaCtaBand
        title="If your team needs publication-grade structure without enterprise complexity, Lumina is the right conversation."
        description="Request beta access and share how your current workflow is split across too many tools or manual processes."
      />
    </>
  );
}
