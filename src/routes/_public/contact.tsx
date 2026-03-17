import { createFileRoute } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { TurnstileField } from "#/components/security/turnstile-field";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { Mail, Send, CheckCircle2 } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { SiteHeader } from "#/components/SiteHeader";
import { toast } from "sonner";
import { Field, FieldError, FieldLabel } from "#/components/ui/field";
import { IconBox } from "#/components/IconBox";
import { contactFormSchema } from "#/schemas";
import { getSeoSiteData } from "#/server/actions/seo-actions";
import { buildPublicSeo } from "#/lib/seo";
import { usePostHog } from "@posthog/react";
import { captureClientException } from "#/lib/sentry-client";
import { submitPublicContactForm } from "#/server/actions/public/contact";
import { getOptionalPublicPageBySlug } from "#/server/actions/public/content";
import { PageContent } from "#/components/cms/PageContent";

type ContactFormValues = {
  name: string;
  email: string;
  subject: string;
  message: string;
  turnstileToken: string;
};

export const Route = createFileRoute("/_public/contact")({
  loader: async () => {
    const [site, cmsPage] = await Promise.all([
      getSeoSiteData(),
      getOptionalPublicPageBySlug({ data: "contact" }),
    ]);

    return {
      site,
      cmsPage,
    };
  },
  head: ({ loaderData }) => {
    const site = loaderData?.site;
    if (!site) {
      return {};
    }

    return buildPublicSeo({
      site,
      path: "/contact",
      title: `Contact | ${site.blogName}`,
      description:
        "Get in touch with the Lumina team for support, feedback, or collaborations.",
      image: site.defaultOgImage,
    });
  },
  component: ContactPage,
});

function ContactPage() {
  const { cmsPage } = Route.useLoaderData();
  const [submitted, setSubmitted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const posthog = usePostHog();

  const defaultValues: ContactFormValues = {
      name: "",
      email: "",
      subject: "",
      message: "",
      turnstileToken: "",
    };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        await submitPublicContactForm({ data: value });
        posthog.capture("contact_message_sent", {
          subject: value.subject,
        });
        toast.success("Message sent successfully!");
        setSubmitted(true);
        setTurnstileToken("");
      } catch (err) {
        captureClientException(err, {
          tags: {
            area: "public",
            flow: "contact-form",
          },
        });
        console.error(err);
        toast.error("Failed to send message. Please try again.");
      }
    },
  });

  if (submitted) {
    return (
      <main className="page-wrap px-4 py-20 text-center">
        <section className="bg-card border shadow-sm mx-auto max-w-2xl rounded-md p-12 overflow-hidden relative">
          <IconBox
            icon={CheckCircle2}
            variant="primary"
            size="lg"
            rounded="2xl"
            animation="rotate"
            className="mx-auto mb-8"
          />
          <h1 className="text-4xl sm:text-5xl font-black mb-6  tracking-tight">
            Message Received!
          </h1>
          <p className="text-muted-foreground text-xl mb-10 font-bold leading-relaxed">
            Thank you for reaching out. Your message is in our inbox, and we&apos;ll
            get back to you sooner than you think.
          </p>
          <Button
            asChild
            variant="default"
            size="xl"
            className="px-12 rounded-md font-black"
          >
            <a href="/">Back to Home</a>
          </Button>
        </section>
      </main>
    );
  }

  return (
    <>
      {cmsPage?.page ? (
        <PageContent
          title={cmsPage.page.title}
          description={cmsPage.page.excerpt}
          content={cmsPage.page.content}
        />
      ) : (
        <main className="page-wrap pb-8 pt-10">
          <SiteHeader
            badge="Support & Feedback"
            title="Get in Touch"
            description="Have a question, feedback, or just want to say hi? Fill out the form and our team will get back to you as soon as possible."
          />
        </main>
      )}

      <main className="page-wrap pb-20 pt-2">
        <section className="grid gap-12 lg:grid-cols-12" id="contact-form">
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="bg-card border shadow-sm rounded-md p-8 sm:p-10 transition-transform hover:-translate-y-1">
              <h2 className="text-3xl font-black text-foreground mb-8  tracking-tight">
                Editorial HQ
              </h2>
              <div className="space-y-8">
                <div className="flex items-center gap-6 group">
                  <IconBox
                    icon={Mail}
                    variant="primary"
                    size="md"
                    rounded="2xl"
                    animation="rotate-soft"
                  />
                  <div>
                    <p className="text-xs font-black  tracking-[0.2em] text-muted-foreground mb-1">
                      Email us
                    </p>
                    <p className="font-black text-2xl  tracking-tight text-foreground">
                      hello@lumina.com
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-12 pt-8 border-t border-border">
                <p className="text-muted-foreground font-bold leading-relaxed">
                  We typically respond within 24 hours during working days. For
                  urgent editorial inquiries, please include &quot;URGENT&quot; in the
                  subject line.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="bg-card border shadow-md space-y-6 rounded-md p-6 sm:p-10"
            >
              <form.Subscribe selector={(state) => state.values}>
                {(values) => {
                  const result = contactFormSchema.safeParse(values);
                  return result.success ? null : (
                    <div className="hidden" aria-hidden="true">
                      Validation errors: {result.error.issues.length}
                    </div>
                  );
                }}
              </form.Subscribe>
              <div className="grid gap-6 sm:grid-cols-2">
                <form.Field name="name">
                  {(field) => {
                    const isInvalid = !!field.state.meta.errors.length;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel
                          htmlFor={field.name}
                          className="text-xs text-foreground"
                        >
                          Name
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="John Doe"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                </form.Field>
                <form.Field name="email">
                  {(field) => {
                    const isInvalid = !!field.state.meta.errors.length;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel
                          htmlFor={field.name}
                          className="text-xs text-foreground"
                        >
                          Email
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="email"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="john@example.com"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                </form.Field>
              </div>
              <form.Field name="subject">
                {(field) => {
                  const isInvalid = !!field.state.meta.errors.length;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel
                        htmlFor={field.name}
                        className="text-xs text-foreground"
                      >
                        Subject
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="How can we help?"
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>
              <form.Field name="message">
                {(field) => {
                  const isInvalid = !!field.state.meta.errors.length;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel
                        htmlFor={field.name}
                        className="text-xs text-foreground"
                      >
                        Message
                      </FieldLabel>
                      <Textarea
                        id={field.name}
                        name={field.name}
                        rows={5}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Your message here..."
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

              <TurnstileField
                action="contact_submit"
                value={turnstileToken}
                onTokenChange={(token) => {
                  setTurnstileToken(token);
                  form.setFieldValue("turnstileToken", token);
                }}
              />

              <div className="pt-4">
                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <Button
                      type="submit"
                      variant="default"
                      size="xl"
                      className="w-full text-lg font-medium  rounded-md transition-all shadow-lg"
                      disabled={!canSubmit || isSubmitting}
                    >
                      <Send size={22} className="mr-3" strokeWidth={3} />
                      {isSubmitting ? "Sending..." : "Send"}
                    </Button>
                  )}
                </form.Subscribe>
              </div>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}

