import { createFileRoute } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { createServerFn } from "@tanstack/react-start";
import { db } from "#/db/index";
import { contactMessages } from "#/db/schema";
import { Mail, Send, CheckCircle2 } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { SiteHeader } from "#/components/SiteHeader";
import { toast } from "sonner";
import { Field, FieldError, FieldLabel } from "#/components/ui/field";

const submitContactForm = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { name: string; email: string; subject: string; message: string }) =>
      data,
  )
  .handler(async ({ data }) => {
    await db.insert(contactMessages).values({
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      status: "new",
    });
    return { success: true };
  });

export const Route = createFileRoute("/_public/contact")({
  head: () => ({
    meta: [
      { title: "Contact | VibeZine" },
      {
        name: "description",
        content:
          "Get in touch with the VibeZine team for support, feedback, or collaborations.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await submitContactForm({ data: value });
        toast.success("Message sent successfully!");
        setSubmitted(true);
      } catch (err) {
        console.error(err);
        toast.error("Failed to send message. Please try again.");
      }
    },
  });

  if (submitted) {
    return (
      <main className="page-wrap px-4 py-20 text-center">
        <section className="bg-card border shadow-sm mx-auto max-w-2xl rounded-md p-12 overflow-hidden relative">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 rotate-3 transition-all hover:rotate-12">
            <CheckCircle2 size={48} strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-6  tracking-tight">
            Message Received!
          </h1>
          <p className="text-muted-foreground text-xl mb-10 font-bold leading-relaxed">
            Thank you for reaching out. Your message is in our inbox, and we'll
            get back to you sooner than you think.
          </p>
          <Button
            asChild
            variant="default"
            size="xl"
            className="px-12 rounded-md font-black"
          >
            <a href="/">BACK TO FEED</a>
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="page-wrap pb-20 pt-10">
      <div className="flex flex-col gap-12">
        <SiteHeader
          badge="Support & Feedback"
          title="Get in Touch"
          description="Have a question, feedback, or just want to say hi? Fill out the form and our team will get back to you as soon as possible."
        />

        <section className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="bg-card border shadow-sm rounded-md p-8 sm:p-10 transition-transform hover:-translate-y-1">
              <h2 className="text-3xl font-black text-foreground mb-8  tracking-tight">
                Editorial HQ
              </h2>
              <div className="space-y-8">
                <div className="flex items-center gap-6 group">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 group-hover:rotate-6 transition-transform">
                    <Mail size={32} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xs font-black  tracking-[0.2em] text-muted-foreground mb-1">
                      Email us
                    </p>
                    <p className="font-black text-2xl  tracking-tight text-foreground">
                      hello@vibezine.com
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-12 pt-8 border-t border-border">
                <p className="text-muted-foreground font-bold leading-relaxed">
                  We typically respond within 24 hours during working days. For
                  urgent editorial inquiries, please include "URGENT" in the
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
              <div className="grid gap-6 sm:grid-cols-2">
                <form.Field
                  name="name"
                  validators={{
                    onChange: ({ value }) =>
                      !value ? "Full name required" : undefined,
                  }}
                  children={(field) => {
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
                          <FieldError errors={field.state.meta.errors as any} />
                        )}
                      </Field>
                    );
                  }}
                />
                <form.Field
                  name="email"
                  validators={{
                    onChange: ({ value }) =>
                      !value
                        ? "Email required"
                        : !/^\S+@\S+$/.test(value)
                          ? "Invalid email"
                          : undefined,
                  }}
                  children={(field) => {
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
                          <FieldError errors={field.state.meta.errors as any} />
                        )}
                      </Field>
                    );
                  }}
                />
              </div>
              <form.Field
                name="subject"
                validators={{
                  onChange: ({ value }) =>
                    !value
                      ? "Subject is required"
                      : value.length < 3
                        ? "Subject too short"
                        : undefined,
                }}
                children={(field) => {
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
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors as any} />
                      )}
                    </Field>
                  );
                }}
              />
              <form.Field
                name="message"
                validators={{
                  onChange: ({ value }) =>
                    !value
                      ? "Message required"
                      : value.length < 10
                        ? "Message too short"
                        : undefined,
                }}
                children={(field) => {
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
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors as any} />
                      )}
                    </Field>
                  );
                }}
              />

              <div className="pt-4">
                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                  children={([canSubmit, isSubmitting]) => (
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
                />
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
