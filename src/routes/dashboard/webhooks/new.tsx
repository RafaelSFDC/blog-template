import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { useState, type FormEvent } from "react";
import {
  ChevronLeft,
  Info,
  Save,
  Webhook,
} from "lucide-react";
import { DashboardHeader } from "#/components/dashboard/Header";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { Button } from "#/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import {
  defaultWebhookFormValues,
  normalizeWebhookFormValues,
  webhookFormSchema,
} from "#/lib/webhook-form";
import { createDashboardWebhook } from "#/server/actions/dashboard/webhooks";

export const Route = createFileRoute("/dashboard/webhooks/new")({
  component: NewWebhookPage,
});

function NewWebhookPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm({
    defaultValues: defaultWebhookFormValues,
    validators: {
      onChange: webhookFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        setSaving(true);
        setErrorMessage("");
        await createDashboardWebhook({
          data: normalizeWebhookFormValues(value),
        });
        await navigate({ to: "/dashboard/webhooks" });
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to create webhook. Please check the data.",
        );
      } finally {
        setSaving(false);
      }
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    void form.handleSubmit();
  }

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title="New Webhook"
        description="Connect Lumina to automation tools and external services."
        icon={Webhook}
        iconLabel="Composer"
      >
        <Button asChild variant="ghost" size="sm">
          <a href="/dashboard/webhooks" className="flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            Back to Webhooks
          </a>
        </Button>
      </DashboardHeader>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="bg-card border shadow-sm rounded-xl p-6 sm:p-10 border-border/50 space-y-8"
          >
            <FieldGroup>
              <form.Field name="name">
                {(field) => (
                  <Field data-invalid={field.state.meta.errors.length > 0}>
                    <FieldLabel htmlFor={field.name}>Friendly Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      placeholder="e.g. My Zapier Integration"
                    />
                    <FieldDescription>
                      Use a label that helps your team identify this integration.
                    </FieldDescription>
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="url">
                {(field) => (
                  <Field data-invalid={field.state.meta.errors.length > 0}>
                    <FieldLabel htmlFor={field.name}>Destination URL</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="url"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      placeholder="https://hooks.zapier.com/..."
                      className="font-mono"
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <div className="grid gap-6 sm:grid-cols-2">
                <form.Field name="event">
                  {(field) => (
                    <Field data-invalid={field.state.meta.errors.length > 0}>
                      <FieldLabel htmlFor={field.name}>Trigger Event</FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) =>
                          field.handleChange(value as "post.published")
                        }
                      >
                        <SelectTrigger id={field.name} className="w-full h-auto">
                          <SelectValue placeholder="Select an event" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="post.published">
                            Post Published
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="secret">
                  {(field) => (
                    <Field data-invalid={field.state.meta.errors.length > 0}>
                      <FieldLabel htmlFor={field.name}>
                        Webhook Secret (Optional)
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value ?? ""}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        placeholder="shhh-secret-key"
                        className="font-mono"
                      />
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                </form.Field>
              </div>
            </FieldGroup>

            {errorMessage && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-4 text-sm font-bold text-destructive">
                {errorMessage}
              </div>
            )}

            <div className="pt-4 border-t-2 border-border/10">
              <Button
                type="submit"
                disabled={saving}
                variant="default"
                size="lg"
              >
                <Save size={20} className="mr-2" strokeWidth={3} />
                <span className="uppercase tracking-widest font-black">
                  {saving ? "Creating..." : "Create Webhook"}
                </span>
              </Button>
            </div>
          </form>
        </div>

        <aside className="space-y-6">
          <div className="border shadow-sm rounded-lg bg-muted/50 p-6 border-border/30">
            <h3 className="font-black uppercase tracking-tighter text-foreground mb-4 flex items-center gap-2">
              <Info size={18} className="text-primary" />
              Webhook Security
            </h3>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              When a secret is configured, Lumina will send it in the{" "}
              <code>X-Webhook-Secret</code> header. Use this to verify that the
              request came from your blog.
            </p>
          </div>
        </aside>
      </div>
    </DashboardPageContainer>
  );
}

