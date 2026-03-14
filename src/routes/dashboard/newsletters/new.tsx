import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { usePostHog } from "@posthog/react";
import { format } from "date-fns";
import { desc, eq } from "drizzle-orm";
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
import { db } from "#/db/index";
import { newsletters, posts } from "#/db/schema";
import { requireAdminSession } from "#/lib/admin-auth";
import {
  buildNewsletterTemplateFromPost,
  mapNewsletterToFormValues,
  newsletterCampaignFormSchema,
  newsletterCampaignSubmissionSchema,
  normalizeNewsletterCampaignSubmission,
  type NewsletterTemplatePost,
} from "#/lib/newsletter-form";
import { sendNewsletter } from "#/lib/newsletter";

const saveAndSendNewsletter = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    newsletterCampaignSubmissionSchema.parse(input),
  )
  .handler(async ({ data }) => {
    await requireAdminSession();

    const [created] = await db
      .insert(newsletters)
      .values({
        subject: data.subject,
        content: data.content,
        postId: data.postId,
        status: data.sendNow ? "sending" : "draft",
      })
      .returning({ id: newsletters.id });

    if (data.sendNow) {
      // In a real app, this should be an async background task
      // For now, we call it and wait (might timeout on serverless)
      try {
        await sendNewsletter(created.id);
      } catch (err) {
        console.error("Failed to send newsletter:", err);
      }
    }

    return created;
  });

const getPostsForTemplate = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireAdminSession();
    return db.select().from(posts).orderBy(desc(posts.publishedAt)).limit(10);
  },
);

const getNewsletterById = createServerFn({ method: "GET" })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    await requireAdminSession();
    return db.query.newsletters.findFirst({
      where: eq(newsletters.id, id),
    });
  });

export const Route = createFileRoute("/dashboard/newsletters/new")({
  validateSearch: (search: Record<string, unknown>) => ({
    fromId: search.fromId ? Number(search.fromId) : undefined,
  }),
  loaderDeps: ({ search }) => ({
    fromId: search.fromId,
  }),
  loader: async ({ deps }) => {
    const [posts, existing] = await Promise.all([
      getPostsForTemplate(),
      deps.fromId
        ? getNewsletterById({ data: deps.fromId })
        : Promise.resolve(null),
    ]);
    return { posts, existing };
  },
  component: NewNewsletterPage,
});

function NewNewsletterPage() {
  const { posts: recentPosts, existing } = Route.useLoaderData();
  const navigate = useNavigate();
  const posthog = usePostHog();
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const submitModeRef = useRef<"send" | "draft">("draft");

  const form = useForm({
    defaultValues: mapNewsletterToFormValues(existing),
    validators: {
      onChange: newsletterCampaignFormSchema,
    },
    onSubmit: async ({ value }) => {
      const sendNow = submitModeRef.current === "send";

      try {
        setSaving(true);
        setErrorMessage("");
        await saveAndSendNewsletter({
          data: normalizeNewsletterCampaignSubmission(value, sendNow),
        });
        if (sendNow) {
          posthog.capture("newsletter_campaign_sent", {
            subject: value.subject,
            post_id: value.postId,
          });
        }
        await navigate({ to: "/dashboard/newsletters" });
      } catch (err) {
        posthog.captureException(err);
        setErrorMessage("Failed to save newsletter campaign.");
      } finally {
        setSaving(false);
      }
    }
  });

  function handlePostTemplate(postId: number) {
    const post = recentPosts.find(
      (candidate: NewsletterTemplatePost) => candidate.id === postId,
    );
    if (post) {
      const template = buildNewsletterTemplateFromPost(post);
      form.setFieldValue("subject", template.subject);
      form.setFieldValue("content", template.content);
      form.setFieldValue("postId", template.postId);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    void form.handleSubmit();
  }

  return (
    <DashboardPageContainer className="px-4 pt-14">
      <DashboardHeader
        title="New Campaign"
        description="Compose a newsletter, reuse recent posts as a starting point, and send when ready."
        icon={Send}
        iconLabel="Composer"
      >
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1"
          onClick={() => window.history.back()}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Campaigns
        </Button>
      </DashboardHeader>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="bg-card border shadow-sm space-y-6 rounded-[1.6rem] p-6 sm:p-8"
          >
            <FieldGroup>
              <form.Field name="subject">
                {(field) => (
                  <Field data-invalid={field.state.meta.errors.length > 0}>
                    <FieldLabel htmlFor={field.name}>Email Subject</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      placeholder="Check out our latest news..."
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="content">
                {(field) => (
                  <Field data-invalid={field.state.meta.errors.length > 0}>
                    <FieldLabel htmlFor={field.name}>Email Body</FieldLabel>
                    <LazyTiptapEditor
                      content={field.state.value}
                      onChange={field.handleChange}
                    />
                    <FieldDescription>
                      You can write freely or start from a recent post template.
                    </FieldDescription>
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
            </FieldGroup>

            {errorMessage && (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-4">
              <Button
                type="button"
                disabled={saving}
                variant="default"
                size="lg"
                onClick={() => {
                  submitModeRef.current = "send";
                  void form.handleSubmit();
                }}
              >
                <Send className="mr-2 h-5 w-5" />
                {saving ? "Processing…" : "Save & Send Now"}
              </Button>
              <Button
                type="button"
                disabled={saving}
                variant="outline"
                size="lg"
                onClick={() => {
                  submitModeRef.current = "draft";
                  void form.handleSubmit();
                }}
              >
                Save as Draft
              </Button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <section className="bg-card border shadow-sm rounded-xl p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <Info className="h-5 w-5 text-primary" />
              Use Post as Template
            </h3>
            <div className="space-y-3">
              {recentPosts.map((post: NewsletterTemplatePost) => (
                <Button
                  key={post.id}
                  variant="outline"
                  onClick={() => handlePostTemplate(post.id)}
                  className="w-full h-auto justify-start p-3 text-left font-normal"
                >
                  <div className="flex flex-col items-start gap-1">
                    <p className="font-semibold line-clamp-1">{post.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(post.publishedAt!), "MMM d")}
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          </section>

          <section className="border shadow-sm rounded-xl border-primary/20 bg-primary/5 p-6">
            <h3 className="text-lg font-bold">Ready to send?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Once sent, we will email all your active subscribers. This action
              cannot be undone.
            </p>
          </section>
        </div>
      </div>
    </DashboardPageContainer>
  );
}
