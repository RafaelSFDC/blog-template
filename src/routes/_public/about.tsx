import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "#/components/SiteHeader";
import { Badge } from "#/components/ui/badge";
import { Lightbulb, Zap, Target } from "lucide-react";
import { Button } from "#/components/ui/button";
import { IconBox } from "#/components/IconBox";
import { getSeoSiteData } from "#/server/seo-actions";
import { buildPublicSeo } from "#/lib/seo";

export const Route = createFileRoute("/_public/about")({
  loader: () => getSeoSiteData(),
  head: ({ loaderData }) =>
    buildPublicSeo({
      site: loaderData,
      path: "/about",
      title: `About | ${loaderData.blogName}`,
      description:
        "Learn about the editorial vision, cadence, and values behind Lumina.",
      image: loaderData.defaultOgImage,
    }),
  component: About,
});

function About() {
  const values = [
    {
      icon: Zap,
      title: "High Energy",
      description: "We focus on content that moves fast and hits hard.",
    },
    {
      icon: Lightbulb,
      title: "Bold Design",
      description: "Visuals aren't an afterthought; they're the core story.",
    },
    {
      icon: Target,
      title: "Sharp Focus",
      description: "No fluff. Just deep dives into what actually matters.",
    },
  ];

  return (
    <main className="page-wrap pb-20 pt-10">
      <div className="flex flex-col gap-12">
        <SiteHeader
          badge="Inside The Studio"
          title="About This Publication"
          description="Lumina is an editorial experiment in digital storytelling, focusing on the intersection of design, culture, and high-quality code."
        />

        <section className="grid gap-8 lg:grid-cols-2">
          <div className="bg-card border shadow-sm rounded-md p-8 sm:p-12">
            <h2 className="text-3xl font-black text-foreground mb-6">
              Our Vision
            </h2>
            <div className="space-y-4 text-muted-foreground font-bold leading-relaxed">
              <p>
                In a world of generic templates and AI-generated noise, Lumina
                stands for something different. We believe that every article
                should have a visual signature—a soul that reflects the energy
                of the ideas within.
              </p>
              <p>
                Our editorial cadence is deliberate. We don&apos;t chase the news
                cycle; we chase the concepts that define the next era of digital
                experience.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {values.map((value, i) => (
              <div
                key={i}
                className="bg-card border shadow-sm rounded-md p-6 flex items-start gap-4 transition-transform hover:-translate-y-1"
              >
                <IconBox
                  icon={value.icon}
                  variant="primary"
                  size="sm"
                  rounded="lg"
                />
                <div>
                  <h3 className="font-black text-foreground text-lg mb-1">
                    {value.title}
                  </h3>
                  <p className="text-sm text-muted-foreground font-bold">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-primary text-primary-foreground rounded-md p-8 sm:p-16 text-center shadow-xl">
          <Badge
            variant="outline"
            className="mb-6 border-primary-foreground/30 text-primary-foreground"
          >
            Get Involved
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-black mb-8 leading-tight">
            Ready to share <br />
            your own story?
          </h2>
          <p className="max-w-2xl mx-auto text-lg opacity-90 font-bold mb-10">
            We are always looking for contributors who think outside the box. If
            you have an aesthetic experiment or a bold cultural takes, we want
            to hear from you.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="xl"
              variant="secondary"
              className="w-full sm:w-auto bg-background text-primary text-lg font-bold"
            >
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
