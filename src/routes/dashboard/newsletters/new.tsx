import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { desc } from "drizzle-orm";
import { ChevronLeft, Info, Send } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { DashboardHeader } from "#/components/dashboard/Header";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { LazyTiptapEditor } from "#/components/lazy-tiptap-editor";
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
import { db } from "#/db/index";
import { posts } from "#/db/schema";
import { requireAdminSession } from "#/lib/admin-auth";
import {
  buildNewsletterTemplateFromPost,
  mapNewsletterToFormValues,
  newsletterCampaignFormSchema,
  normalizeNewsletterCampaignSubmission,
  type NewsletterTemplatePost,
} from "#/lib/newsletter-form";
import { captureClientException } from "#/lib/sentry-client";
import {
  createNewsletterCampaignAction,
  getNewsletterCampaignAction,
  updateNewsletterCampaignAction,
} from "#/server/newsletter-actions";

const getPostsForTemplate = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession();
  return db
    .select({
      id: posts.id,
      title: posts.title,
      excerpt: posts.excerpt,
      slug: posts.slug,
      publishedAt: posts.publishedAt,
    })
    .from(posts)
    .orderBy(desc(posts.publishedAt))
    .limit(10);
});

export const Route = createFileRoute("/dashboard/newsletters/new")({
  validateSearch: (search: Record<string, unknown>) => ({
    fromId: search.fromId ? Number(search.fromId) : undefined,
  }),
  loaderDeps: ({ search }) => ({ fromId: search.fromId }),
  loader: async ({ deps }) => {
    const [recentPosts, existing] = await Promise.all([
      getPostsForTemplate(),
      deps.fromId ? getNewsletterCampaignAction({ data: deps.fromId }) : Promise.resolve(null),
    ]);

    return { recentPosts, existing };
  },
  component: NewsletterComposerPage,
});

function NewsletterComposerPage() {
  const { recentPosts, existing } = Route.useLoaderData();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const submitModeRef = useRef<"draft" | "schedule" | "queue">("draft");

  const form = useForm({
    defaultValues: mapNewsletterToFormValues(existing),
    validators: {
      onChange: newsletterCampaignFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        setSaving(true);
        setErrorMessage("");
        const payload = normalizeNewsletterCampaignSubmission(value, submitModeRef.current);

        if (existing?.id) {
          await updateNewsletterCampaignAction({
            data: {
              newsletterId: existing.id,
              ...payload,
            },
          });
        } else {
          await createNewsletterCampaignAction({
            data: payload,
          });
        }

        await navigate({ to: "/dashboard/newsletters" });
      } catch (error) {
        captureClientException(error, {
          tags: {
            area: "dashboard",
            flow: "newsletter-compose",
            mode: submitModeRef.current,
          },
        });
        setErrorMessage("Failed to save campaign.");
      } finally {
        setSaving(false);
      }
    },
  });

  function applyPostTemplate(postId: number) {
    const post = recentPosts.find((item: NewsletterTemplatePost) => item.id === postId);
    if (!post) {
      return;
    }

    const template = buildNewsletterTemplateFromPost(post);
    form.setFieldValue("subject", template.subject);
    form.setFieldValue("preheader", template.preheader);
    form.setFieldValue("content", template.content);
    form.setFieldValue("postId", template.postId);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    void form.handleSubmit();
  }

  return (
    <DashboardPageContainer className="px-4 pt-14">
      <DashboardHeader
        title={existing ? "Edit Campaign" : "New Campaign"}
        description="Create a newsletter draft, schedule it, or enqueue it for delivery."
        icon={Send}
        iconLabel="Campaign Composer"
      >
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </DashboardHeader>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
            <FieldGroup>
              <form.Field name="subject">
                {(field) => (
                  <Field data-invalid={field.state.meta.errors.length > 0}>
                    <FieldLabel htmlFor={field.name}>Subject</FieldLabel>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      placeholder="Your latest issue is here"
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="preheader">
                {(field) => (
                  <Field data-invalid={field.state.meta.errors.length > 0}>
                    <FieldLabel htmlFor={field.name}>Preheader</FieldLabel>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      placeholder="A short summary that appears in the inbox preview"
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <div className="grid gap-6 md:grid-cols-2">
                <form.Field name="segment">
                  {(field) => (
                    <Field>
                      <FieldLabel>Segment</FieldLabel>
                      <Select value={field.state.value} onValueChange={field.handleChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all_active">All active</SelectItem>
                          <SelectItem value="premium_members">Premium members</SelectItem>
                          <SelectItem value="free_subscribers">Free subscribers</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                </form.Field>

                <form.Field name="scheduledAt">
                  {(field) => (
                    <Field data-invalid={field.state.meta.errors.length > 0}>
                      <FieldLabel htmlFor={field.name}>Schedule For</FieldLabel>
                      <Input
                        id={field.name}
                        type="datetime-local"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                      />
                      <FieldDescription>Required only when scheduling.</FieldDescription>
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                </form.Field>
              </div>

              <form.Field name="content">
                {(field) => (
                  <Field data-invalid={field.state.meta.errors.length > 0}>
                    <FieldLabel htmlFor={field.name}>Content</FieldLabel>
                    <LazyTiptapEditor content={field.state.value} onChange={field.handleChange} />
                    <FieldDescription>External links are tracked automatically.</FieldDescription>
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
            </FieldGroup>

            {errorMessage ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="default"
                disabled={saving}
                onClick={() => {
                  submitModeRef.current = "queue";
                  void form.handleSubmit();
                }}
              >
                {saving && submitModeRef.current === "queue" ? "Queueing..." : "Queue Now"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => {
                  submitModeRef.current = "schedule";
                  void form.handleSubmit();
                }}
              >
                Schedule
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={saving}
                onClick={() => {
                  submitModeRef.current = "draft";
                  void form.handleSubmit();
                }}
              >
                Save Draft
              </Button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <Info className="h-5 w-5 text-primary" />
              Post Templates
            </h3>
            <div className="space-y-3">
              {recentPosts.map((post: NewsletterTemplatePost) => (
                <Button
                  key={post.id}
                  variant="outline"
                  className="h-auto w-full justify-start p-3 text-left"
                  onClick={() => applyPostTemplate(post.id)}
                >
                  <div>
                    <p className="font-semibold">{post.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "Draft"}
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <h3 className="text-lg font-bold">Queue-backed delivery</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Send now only enqueues the campaign. The Worker processes deliveries asynchronously with retries and tracking.
            </p>
          </section>
        </div>
      </div>
    </DashboardPageContainer>
  );
}
