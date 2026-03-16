import { createFileRoute } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "#/components/ui/accordion";
import {
  LuminaCtaBand,
  LuminaHero,
  LuminaSection,
  LuminaSectionHeader,
} from "#/components/lumina/marketing-shell";
import { buildLuminaProductSeo, luminaFaqItems } from "#/lib/lumina-marketing";

export const Route = createFileRoute("/lumina/faq")({
  head: () =>
    buildLuminaProductSeo({
      path: "/lumina/faq",
      title: "Lumina FAQ | What the product is, who it serves, and how beta works",
      description:
        "Read the commercial FAQ for Lumina, including fit, launch direction, newsletter and membership support, and how the beta path works.",
    }),
  component: LuminaFaqPage,
});

function LuminaFaqPage() {
  return (
    <>
      <LuminaHero
        badge="FAQ"
        title="Commercial answers without the hand-wavy product talk."
        description="These are the questions that matter when someone is deciding whether Lumina is worth a conversation."
        secondaryCtaLabel="Request beta access"
        secondaryCtaHref="/lumina/beta"
      />

      <LuminaSection>
        <LuminaSectionHeader
          eyebrow="Questions people ask first"
          title="Clear answers about fit, product direction, and the current beta motion."
          description="The goal here is to reduce ambiguity, not create another marketing page full of vague language."
        />
        <div className="rounded-md border bg-card p-6 shadow-sm sm:p-8">
          <Accordion type="single" collapsible className="w-full">
            {luminaFaqItems.map((item) => (
              <AccordionItem key={item.question} value={item.question}>
                <AccordionTrigger className="text-base font-semibold text-foreground">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </LuminaSection>

      <LuminaCtaBand
        title="Still evaluating fit?"
        description="Request beta access and tell us what you publish today. That gives us the context to answer with substance instead of generic follow-up."
      />
    </>
  );
}
