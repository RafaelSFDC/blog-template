import type { Config } from "@puckeditor/core";
import { Button } from "#/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "#/components/ui/card";

type Props = {
  Hero: {
    title: string;
    description: string;
    buttonText: string;
    buttonHref: string;
  };
  Section: {
    title: string;
    content: string;
  };
  FeatureList: {
    features: { title: string; description: string }[];
  };
};

export const config: Config<Props> = {
  components: {
    Hero: {
      fields: {
        title: { type: "text" },
        description: { type: "textarea" },
        buttonText: { type: "text" },
        buttonHref: { type: "text" },
      },
      render: ({ title, description, buttonText, buttonHref }) => (
        <section className="bg-primary/5 rounded-3xl p-12 text-center flex flex-col items-center gap-6 my-8 border border-primary/10">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-3xl">
            {title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            {description}
          </p>
          {buttonText && (
            <Button size="lg" asChild>
              <a href={buttonHref}>{buttonText}</a>
            </Button>
          )}
        </section>
      ),
    },
    Section: {
      fields: {
        title: { type: "text" },
        content: { type: "textarea" },
      },
      render: ({ title, content }) => (
        <div className="py-12 flex flex-col gap-4">
          <h2 className="text-3xl font-bold">{title}</h2>
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {content}
          </div>
        </div>
      ),
    },
    FeatureList: {
      fields: {
        features: {
          type: "array",
          arrayFields: {
            title: { type: "text" },
            description: { type: "text" },
          },
        },
      },
      render: ({ features }) => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
          {features.map((feature, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      ),
    },
  },
};
