import type { Config } from "@puckeditor/core";
import { Check, ChevronRight, Quote } from "lucide-react";
import { Newsletter } from "#/components/blog/newsletter";
import { Button } from "#/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";

type TextItem = { text: string };
type FeatureItem = { title: string; description: string };
type PlanItem = {
  name: string;
  priceLabel: string;
  summary: string;
  highlight?: boolean;
};
type FaqItem = { question: string; answer: string };

type Props = {
  LaunchHero: {
    badge: string;
    title: string;
    description: string;
    primaryCtaText: string;
    primaryCtaHref: string;
    secondaryCtaText: string;
    secondaryCtaHref: string;
  };
  ProofStrip: {
    items: TextItem[];
  };
  FeatureGrid: {
    title: string;
    description: string;
    items: FeatureItem[];
  };
  RichTextSection: {
    title: string;
    body: string;
  };
  NewsletterSignupSection: {
    title: string;
    description: string;
    buttonText: string;
    placeholder: string;
  };
  PricingHighlights: {
    title: string;
    description: string;
    plans: PlanItem[];
  };
  FaqSection: {
    title: string;
    items: FaqItem[];
  };
  ArchiveTeaser: {
    title: string;
    description: string;
    buttonText: string;
    buttonHref: string;
  };
};

export const config: Config<Props> = {
  components: {
    LaunchHero: {
      fields: {
        badge: { type: "text" },
        title: { type: "text" },
        description: { type: "textarea" },
        primaryCtaText: { type: "text" },
        primaryCtaHref: { type: "text" },
        secondaryCtaText: { type: "text" },
        secondaryCtaHref: { type: "text" },
      },
      render: ({
        badge,
        title,
        description,
        primaryCtaText,
        primaryCtaHref,
        secondaryCtaText,
        secondaryCtaHref,
      }) => (
        <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-background px-8 py-14 shadow-sm sm:px-12 sm:py-18">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_55%)] lg:block" />
          <div className="relative mx-auto max-w-5xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
              {badge}
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight tracking-tight text-foreground sm:text-6xl">
              {title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {primaryCtaText ? (
                <Button size="lg" asChild>
                  <a href={primaryCtaHref}>{primaryCtaText}</a>
                </Button>
              ) : null}
              {secondaryCtaText ? (
                <Button size="lg" variant="outline" asChild>
                  <a href={secondaryCtaHref}>{secondaryCtaText}</a>
                </Button>
              ) : null}
            </div>
          </div>
        </section>
      ),
    },
    ProofStrip: {
      fields: {
        items: {
          type: "array",
          arrayFields: {
            text: { type: "text" },
          },
        },
      },
      render: ({ items }) => (
        <section className="grid gap-3 rounded-2xl border border-border/60 bg-card/70 p-4 sm:grid-cols-3">
          {items.map((item, index) => (
            <div key={`${item.text}-${index}`} className="flex items-center gap-3 rounded-xl bg-background px-4 py-3">
              <Check className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">{item.text}</span>
            </div>
          ))}
        </section>
      ),
    },
    FeatureGrid: {
      fields: {
        title: { type: "text" },
        description: { type: "textarea" },
        items: {
          type: "array",
          arrayFields: {
            title: { type: "text" },
            description: { type: "textarea" },
          },
        },
      },
      render: ({ title, description, items }) => (
        <section className="space-y-6 py-4">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              {title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {items.map((item, index) => (
              <Card key={`${item.title}-${index}`} className="border-border/60 bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-black tracking-tight">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {item.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      ),
    },
    RichTextSection: {
      fields: {
        title: { type: "text" },
        body: { type: "textarea" },
      },
      render: ({ title, body }) => (
        <section className="rounded-2xl border border-border/60 bg-card p-8 shadow-sm">
          <h2 className="text-3xl font-black tracking-tight text-foreground">{title}</h2>
          <p className="mt-4 max-w-3xl whitespace-pre-wrap text-base leading-relaxed text-muted-foreground">
            {body}
          </p>
        </section>
      ),
    },
    NewsletterSignupSection: {
      fields: {
        title: { type: "text" },
        description: { type: "textarea" },
        buttonText: { type: "text" },
        placeholder: { type: "text" },
      },
      render: ({ title, description, buttonText, placeholder }) => (
        <section id="newsletter-signup" className="rounded-3xl border border-primary/20 bg-primary/5 p-8 shadow-sm sm:p-10">
          <Newsletter
            title={title}
            description={description}
            buttonText={buttonText}
            placeholder={placeholder}
            className="mx-auto"
          />
        </section>
      ),
    },
    PricingHighlights: {
      fields: {
        title: { type: "text" },
        description: { type: "textarea" },
        plans: {
          type: "array",
          arrayFields: {
            name: { type: "text" },
            priceLabel: { type: "text" },
            summary: { type: "textarea" },
            highlight: { type: "radio", options: [
              { label: "Yes", value: true },
              { label: "No", value: false },
            ] },
          },
        },
      },
      render: ({ title, description, plans }) => (
        <section className="space-y-6 py-4" id="pricing-plans">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              {title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {plans.map((plan, index) => (
              <Card
                key={`${plan.name}-${index}`}
                className={`border-border/60 shadow-sm ${plan.highlight ? "border-primary bg-primary/5" : "bg-card"}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-2xl font-black tracking-tight">
                      {plan.name}
                    </CardTitle>
                    {plan.highlight ? (
                      <span className="rounded-full bg-primary px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-primary-foreground">
                        Recommended
                      </span>
                    ) : null}
                  </div>
                  <p className="text-4xl font-black tracking-tight text-foreground">
                    {plan.priceLabel}
                  </p>
                  <CardDescription className="text-sm leading-relaxed">
                    {plan.summary}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      ),
    },
    FaqSection: {
      fields: {
        title: { type: "text" },
        items: {
          type: "array",
          arrayFields: {
            question: { type: "text" },
            answer: { type: "textarea" },
          },
        },
      },
      render: ({ title, items }) => (
        <section className="space-y-5 py-4">
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
          <div className="grid gap-4">
            {items.map((item, index) => (
              <div key={`${item.question}-${index}`} className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <Quote className="mt-1 h-4 w-4 text-primary" />
                  <div>
                    <p className="font-black text-foreground">{item.question}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ),
    },
    ArchiveTeaser: {
      fields: {
        title: { type: "text" },
        description: { type: "textarea" },
        buttonText: { type: "text" },
        buttonHref: { type: "text" },
      },
      render: ({ title, description, buttonText, buttonHref }) => (
        <section className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm sm:p-10">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              {title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {description}
            </p>
            {buttonText ? (
              <Button asChild className="mt-6" size="lg">
                <a href={buttonHref}>
                  {buttonText}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            ) : null}
          </div>
        </section>
      ),
    },
  },
};
