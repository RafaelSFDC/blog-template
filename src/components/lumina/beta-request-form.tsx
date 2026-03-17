import { usePostHog } from "@posthog/react";
import { useForm } from "@tanstack/react-form";
import { useLocation } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { IconBox } from "#/components/IconBox";
import { TurnstileField } from "#/components/security/turnstile-field";
import { Field, FieldError, FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select";
import { Textarea } from "#/components/ui/textarea";
import { Button } from "#/components/ui/button";
import { useTurnstileConfig } from "#/hooks/use-turnstile";
import { captureClientEvent } from "#/lib/analytics-client";
import { betaRequestSubmissionSchema } from "#/schemas";
import { captureClientException } from "#/lib/sentry-client";
import { submitLuminaBetaRequest } from "#/server/public/lumina-beta";
import { useEffect } from "react";

type BetaRequestFormValues = {
  name: string;
  email: string;
  role: "creator" | "journalist" | "publication_lead";
  publicationType: "independent_newsletter" | "digital_magazine" | "premium_blog" | "other";
  currentStack: string;
  message: string;
  path: string;
  source: string;
  turnstileToken: string;
};

export function LuminaBetaRequestForm() {
  const [submitted, setSubmitted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const posthog = usePostHog();
  const location = useLocation();
  const turnstileConfig = useTurnstileConfig();

  const defaultValues: BetaRequestFormValues = {
      name: "",
      email: "",
      role: "creator" as const,
      publicationType: "independent_newsletter" as const,
      currentStack: "",
      message: "",
      path: "/lumina/beta",
      source: "beta_form_submit",
      turnstileToken: "",
    };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        const path = location.pathname || "/lumina/beta";
        const source = value.source || "beta_form_submit";
        captureClientEvent(posthog, "lumina_cta_clicked", {
          cta_label: "Request beta access",
          cta_href: "/lumina/beta",
          path,
          source,
          surface: "lumina_marketing",
        });
        await submitLuminaBetaRequest({
          data: {
            ...value,
            path,
            source,
          },
        });
        toast.success("Beta request sent successfully.");
        setSubmitted(true);
        setTurnstileToken("");
      } catch (error) {
        captureClientException(error, {
          tags: {
            area: "marketing",
            flow: "lumina-beta-request",
          },
        });
        toast.error("We could not send your request right now. Please try again.");
      }
    },
  });

  useEffect(() => {
    if (turnstileConfig.loading) {
      return;
    }

    const nextToken = turnstileConfig.turnstileEnabled
      ? turnstileToken
      : "turnstile_bypassed";

    if (form.state.values.turnstileToken !== nextToken) {
      form.setFieldValue("turnstileToken", nextToken);
    }
  }, [
    form,
    turnstileToken,
    turnstileConfig.loading,
    turnstileConfig.turnstileEnabled,
  ]);

  const turnstileValue = useMemo(
    () => (turnstileConfig.turnstileEnabled ? turnstileToken : "turnstile_bypassed"),
    [turnstileConfig.turnstileEnabled, turnstileToken],
  );

  if (submitted) {
    return (
      <div className="rounded-md border bg-card p-8 text-center shadow-sm sm:p-10">
        <IconBox
          icon={CheckCircle2}
          variant="primary"
          size="lg"
          rounded="2xl"
          animation="rotate"
          className="mx-auto mb-6"
        />
        <h2 className="display-title text-3xl font-bold text-foreground sm:text-4xl">
          Beta request received
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Thanks for the interest. We will review your request and follow up with next steps as we shape the beta.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6 rounded-md border bg-card p-6 shadow-sm sm:p-8"
    >
      <form.Subscribe selector={(state) => state.values}>
        {(values) => {
          const result = betaRequestSubmissionSchema.safeParse(values);
          return result.success ? null : (
            <div className="hidden" aria-hidden="true">
              Validation errors: {result.error.issues.length}
            </div>
          );
        }}
      </form.Subscribe>
      <div className="grid gap-6 sm:grid-cols-2">
        <form.Field name="name">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>Name</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="Jane Founder"
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>

        <form.Field name="email">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                type="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="jane@example.com"
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <form.Field name="role">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>Role</FieldLabel>
              <NativeSelect
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) =>
                  field.handleChange(
                    event.target.value as "creator" | "journalist" | "publication_lead",
                  )
                }
                className="w-full"
              >
                <NativeSelectOption value="creator">Creator</NativeSelectOption>
                <NativeSelectOption value="journalist">Journalist</NativeSelectOption>
                <NativeSelectOption value="publication_lead">Publication lead</NativeSelectOption>
              </NativeSelect>
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>

        <form.Field name="publicationType">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>Publication type</FieldLabel>
              <NativeSelect
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) =>
                  field.handleChange(
                    event.target.value as
                      | "independent_newsletter"
                      | "digital_magazine"
                      | "premium_blog"
                      | "other",
                  )
                }
                className="w-full"
              >
                <NativeSelectOption value="independent_newsletter">
                  Independent newsletter
                </NativeSelectOption>
                <NativeSelectOption value="digital_magazine">Digital magazine</NativeSelectOption>
                <NativeSelectOption value="premium_blog">Premium blog</NativeSelectOption>
                <NativeSelectOption value="other">Other</NativeSelectOption>
              </NativeSelect>
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>
      </div>

      <form.Field name="currentStack">
        {(field) => (
          <Field data-invalid={field.state.meta.errors.length > 0}>
            <FieldLabel htmlFor={field.name}>Current stack</FieldLabel>
            <Input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="Ghost, Substack, WordPress, Beehiiv..."
            />
            <FieldError errors={field.state.meta.errors} />
          </Field>
        )}
      </form.Field>

      <form.Field name="message">
        {(field) => (
          <Field data-invalid={field.state.meta.errors.length > 0}>
            <FieldLabel htmlFor={field.name}>What do you want Lumina to solve first?</FieldLabel>
            <Textarea
              id={field.name}
              name={field.name}
              rows={5}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="Tell us what you publish, where your workflow breaks today, and what a better launch flow would change."
            />
            <FieldError errors={field.state.meta.errors} />
          </Field>
        )}
      </form.Field>

      <TurnstileField
        action="lumina_beta_request"
        value={turnstileValue}
        onTokenChange={(token) => {
          setTurnstileToken(token);
          form.setFieldValue("turnstileToken", token);
        }}
      />

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <Button type="submit" size="xl" className="w-full" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? "Sending request..." : "Request beta access"}
            {!isSubmitting && <ArrowRight size={16} />}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
