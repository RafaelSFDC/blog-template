import { createFileRoute } from "@tanstack/react-router";
import {
  LuminaBulletList,
  LuminaCtaBand,
  LuminaHero,
  LuminaSection,
  LuminaSectionHeader,
} from "#/components/lumina/marketing-shell";
import { buildLuminaProductSeo, getLuminaAudiencePage } from "#/lib/lumina-marketing";

export const Route = createFileRoute("/lumina/for-journalists")({
  head: () =>
    buildLuminaProductSeo({
      path: "/lumina/for-journalists",
      title: "Lumina for journalists | Premium publishing and reader revenue without enterprise bloat",
      description:
        "See how Lumina supports independent journalism with structured publishing, members-only content, newsletter distribution, and premium conversion surfaces.",
    }),
  component: JournalistsPage,
});

function JournalistsPage() {
  const page = getLuminaAudiencePage("journalists");

  return (
    <>
      <LuminaHero badge={page.badge} title={page.headline} description={page.subheadline} />

      <LuminaSection>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-md border bg-card p-8 shadow-sm">
            <LuminaSectionHeader
              eyebrow="Pain today"
              title="Where journalism workflows break in generic publishing tools."
              description="Premium reporting and reader revenue need more than a simple blog plus a separate payment layer."
            />
            <LuminaBulletList items={page.painPoints} />
          </div>

          <div className="rounded-md border bg-card p-8 shadow-sm">
            <LuminaSectionHeader
              eyebrow="What Lumina improves"
              title="A publication stack made for serious editorial work."
              description="Lumina keeps site, newsletter, premium archive, and workflow closer together so the operation feels coherent."
            />
            <LuminaBulletList items={page.wins} />
          </div>
        </div>
      </LuminaSection>

      <LuminaCtaBand
        title="If your publication model depends on trust, clarity, and premium access, Lumina is built around that shape."
        description="Request beta access and tell us what kind of reporting operation you are building."
      />
    </>
  );
}
