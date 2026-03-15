import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { type LucideIcon, History, Lock, LockOpen, RefreshCcw } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { PostEditorialPreview } from "#/components/dashboard/editorial-preview";
import { EditorialWorkspace } from "#/components/dashboard/editorial-workspace";
import { DashboardHeader } from "#/components/dashboard/Header";
import { LazyTiptapEditor } from "#/components/lazy-tiptap-editor";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { Switch } from "#/components/ui/switch";
import { Textarea } from "#/components/ui/textarea";
import { authClient } from "#/lib/auth-client";
import { postFormSchema, slugify } from "#/lib/cms-schema";
import { buildPostPreviewDraft, type PostEditorFormValues } from "#/lib/editorial-preview";
import { shouldAutoUpdateSlug } from "#/lib/editorial-form-utils";
import {
  acquirePostLock,
  autosavePost,
  getPostRevisionsForEditor,
  heartbeatPostLock,
  releasePostLock,
  restorePostRevision,
} from "#/server/post-actions";
import { getCategories, getTags } from "#/server/taxonomy-actions";

type PostStatus = PostEditorFormValues["status"];
type Category = Awaited<ReturnType<typeof getCategories>>[number];
type Tag = Awaited<ReturnType<typeof getTags>>[number];
type PostRevision = Awaited<ReturnType<typeof getPostRevisionsForEditor>>[number];

interface PostEditorPreviewOptions {
  coverImage?: string | null;
  authorName?: string | null;
  readingTime?: number | null;
}

interface PostEditorScreenProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconLabel: string;
  initialValues: PostEditorFormValues;
  storageKey: string;
  submitLabel: string;
  submitErrorMessage: string;
  onSubmit: (values: PostEditorFormValues) => Promise<void>;
  onCancel: () => void;
  previewOptions?: PostEditorPreviewOptions;
  entityId?: number;
  initialRevisions?: PostRevision[];
}

function formatRevisionDate(date: Date | string | null) {
  if (!date) return "Unknown";
  return new Date(date).toLocaleString();
}

export function PostEditorScreen({
  title,
  description,
  icon,
  iconLabel,
  initialValues,
  storageKey,
  submitLabel,
  submitErrorMessage,
  onSubmit,
  onCancel,
  previewOptions,
  entityId,
  initialRevisions = [],
}: PostEditorScreenProps) {
  const { data: session } = authClient.useSession();
  const [saving, setSaving] = useState(false);
  const [showSeo, setShowSeo] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState("Not saved yet");
  const [lockState, setLockState] = useState<"idle" | "acquired" | "held_by_other">("idle");
  const [revisions, setRevisions] = useState<PostRevision[]>(initialRevisions);
  const lastAutosavedRef = useRef(JSON.stringify(initialValues));

  const form = useForm({
    defaultValues: initialValues,
    validators: {
      onChange: postFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        setSaving(true);
        await onSubmit(value);
        lastAutosavedRef.current = JSON.stringify(value);
        setAutosaveStatus("Saved");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : submitErrorMessage);
      } finally {
        setSaving(false);
      }
    },
  });

  const values = form.state.values;
  const role = session?.user?.role;
  const canPublish = role === "editor" || role === "admin" || role === "super-admin" || role === "superAdmin";
  const availableStatuses: PostStatus[] = canPublish
    ? ["published", "scheduled", "draft", "private"]
    : ["draft", "private"];

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
    enabled: canPublish,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: () => getTags(),
    enabled: canPublish,
  });

  useEffect(() => {
    if (!entityId) return;

    let active = true;
    void acquirePostLock({ data: { postId: entityId } })
      .then((result) => {
        if (!active) return;
        setLockState(result.state === "held_by_other" ? "held_by_other" : "acquired");
      })
      .catch((error) => {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : "Could not acquire editor lock");
      });

    const heartbeat = window.setInterval(() => {
      void heartbeatPostLock({ data: { postId: entityId } })
        .then((result) => {
          if (!active) return;
          setLockState(result.state === "held_by_other" ? "held_by_other" : "acquired");
        })
        .catch(() => undefined);
    }, 60_000);

    return () => {
      active = false;
      window.clearInterval(heartbeat);
      void releasePostLock({ data: { postId: entityId } }).catch(() => undefined);
    };
  }, [entityId]);

  useEffect(() => {
    if (!entityId || lockState !== "acquired") return;

    const autosaveTimer = window.setInterval(() => {
      const serialized = JSON.stringify(values);
      if (serialized === lastAutosavedRef.current || saving) {
        return;
      }

      setAutosaveStatus("Autosaving...");
      void autosavePost({
        data: {
          id: entityId,
          ...values,
        },
      })
        .then(async () => {
          lastAutosavedRef.current = serialized;
          setAutosaveStatus("Autosaved");
          const nextRevisions = await getPostRevisionsForEditor({ data: { postId: entityId } });
          setRevisions(nextRevisions);
        })
        .catch((error) => {
          setAutosaveStatus("Autosave failed");
          toast.error(error instanceof Error ? error.message : "Autosave failed");
        });
    }, 20_000);

    return () => window.clearInterval(autosaveTimer);
  }, [entityId, lockState, saving, values]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    form.handleSubmit();
  }

  async function handleRestoreRevision(revisionId: number) {
    if (!entityId) return;

    try {
      await restorePostRevision({ data: { revisionId } });
      const nextRevisions = await getPostRevisionsForEditor({ data: { postId: entityId } });
      setRevisions(nextRevisions);
      toast.success("Revision restored as a new draft");
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not restore revision");
    }
  }

  return (
    <DashboardPageContainer>
      <DashboardHeader title={title} description={description} icon={icon} iconLabel={iconLabel}>
        <div className="flex flex-wrap gap-2">
          {entityId ? (
            <Button asChild variant="outline">
              <Link to="/dashboard/preview/post/$postId" params={{ postId: String(entityId) }} target="_blank">
                Authenticated Preview
              </Link>
            </Button>
          ) : null}
        </div>
      </DashboardHeader>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/30 p-3 text-sm">
        <div className="flex items-center gap-2">
          {lockState === "held_by_other" ? (
            <Lock className="h-4 w-4 text-destructive" />
          ) : lockState === "acquired" ? (
            <LockOpen className="h-4 w-4 text-primary" />
          ) : null}
          <span className="font-semibold">
            {lockState === "held_by_other"
              ? "Another editor currently holds the lock"
              : lockState === "acquired"
                ? "Editing lock acquired"
                : "No active lock"}
          </span>
        </div>
        <span className="text-muted-foreground">{autosaveStatus}</span>
      </div>

      <EditorialWorkspace
        storageKey={storageKey}
        form={
          <form onSubmit={handleSubmit} className="space-y-6">
            <FieldGroup>
              <form.Field name="title">
                {(field) => (
                  <Field data-invalid={field.state.meta.errors.length > 0}>
                    <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        field.handleChange(event.target.value);
                        const currentSlug = form.getFieldValue("slug");
                        if (shouldAutoUpdateSlug(currentSlug, field.state.value)) {
                          form.setFieldValue("slug", slugify(event.target.value));
                        }
                      }}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="slug">
                {(field) => (
                  <Field data-invalid={field.state.meta.errors.length > 0}>
                    <FieldLabel htmlFor={field.name}>Slug</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(slugify(event.target.value))}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="excerpt">
                {(field) => (
                  <Field data-invalid={field.state.meta.errors.length > 0}>
                    <FieldLabel htmlFor={field.name}>Excerpt</FieldLabel>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      className="min-h-28"
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              {canPublish ? (
                <div className="grid grid-cols-1 gap-6 border-t border-border pt-4 md:grid-cols-2">
                  <form.Field name="categoryIds">
                    {(field) => (
                      <Field>
                        <FieldLabel>Categories</FieldLabel>
                        <div className="flex flex-wrap gap-2 rounded-xl border border-input bg-muted/30 p-3">
                          {categories.map((category: Category) => (
                            <label
                              key={category.id}
                              className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5"
                            >
                              <Checkbox
                                checked={field.state.value.includes(category.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.handleChange([...field.state.value, category.id]);
                                    return;
                                  }
                                  field.handleChange(field.state.value.filter((id) => id !== category.id));
                                }}
                              />
                              <span className="text-sm font-medium">{category.name}</span>
                            </label>
                          ))}
                        </div>
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="tagIds">
                    {(field) => (
                      <Field>
                        <FieldLabel>Tags</FieldLabel>
                        <div className="flex flex-wrap gap-2 rounded-xl border border-input bg-muted/30 p-3">
                          {tags.map((tag: Tag) => (
                            <label
                              key={tag.id}
                              className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5"
                            >
                              <Checkbox
                                checked={field.state.value.includes(tag.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.handleChange([...field.state.value, tag.id]);
                                    return;
                                  }
                                  field.handleChange(field.state.value.filter((id) => id !== tag.id));
                                }}
                              />
                              <span className="text-sm font-medium">#{tag.name}</span>
                            </label>
                          ))}
                        </div>
                      </Field>
                    )}
                  </form.Field>
                </div>
              ) : null}

              <form.Field name="content">
                {(field) => (
                  <Field data-invalid={field.state.meta.errors.length > 0}>
                    <FieldLabel>Content</FieldLabel>
                    <LazyTiptapEditor content={field.state.value} onChange={field.handleChange} />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
            </FieldGroup>

            <div className="border-t border-border pt-6">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowSeo((current) => !current)}>
                {showSeo ? "▼" : "▶"} SEO Settings
              </Button>
              {showSeo ? (
                <div className="mt-4 space-y-4 rounded-xl bg-muted/50 p-6">
                  <form.Field name="metaTitle">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Meta Title</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="metaDescription">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Meta Description</FieldLabel>
                        <Textarea
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="ogImage">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>OG Image URL</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                        />
                      </Field>
                    )}
                  </form.Field>
                </div>
              ) : null}
            </div>

            <form.Field name="isPremium">
              {(field) => (
                <div className="flex items-center space-x-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <Switch
                    id={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked === true)}
                  />
                  <label htmlFor={field.name} className="flex cursor-pointer flex-col">
                    <span className="text-sm font-bold text-foreground">Premium Post</span>
                    <span className="text-xs text-muted-foreground">
                      Only paid subscribers can read the full post.
                    </span>
                  </label>
                </div>
              )}
            </form.Field>

            <div className="grid grid-cols-1 gap-6 border-t border-border pt-6 sm:grid-cols-2">
              <form.Field name="status">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Status</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value as PostStatus)}
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>

              <form.Subscribe selector={(state) => state.values.status === "scheduled"}>
                {(isScheduled) =>
                  isScheduled ? (
                    <form.Field name="publishedAt">
                      {(field) => (
                        <Field>
                          <FieldLabel htmlFor={field.name}>Publication Date</FieldLabel>
                          <Input
                            id={field.name}
                            type="datetime-local"
                            value={field.state.value}
                            onChange={(event) => field.handleChange(event.target.value)}
                          />
                        </Field>
                      )}
                    </form.Field>
                  ) : null
                }
              </form.Subscribe>
            </div>

            {entityId ? (
              <section className="space-y-3 border-t border-border pt-6">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-foreground">Revisions</h3>
                </div>
                <div className="space-y-2">
                  {revisions.map((revision) => (
                    <div
                      key={revision.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {revision.source}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRevisionDate(revision.createdAt)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void handleRestoreRevision(revision.id)}
                      >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Restore as Draft
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={saving || lockState === "held_by_other"} size="lg">
                {saving ? "Saving…" : submitLabel}
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        }
        preview={
          <PostEditorialPreview
            draft={buildPostPreviewDraft(values, {
              categories,
              tags,
              ...previewOptions,
            })}
          />
        }
      />
    </DashboardPageContainer>
  );
}
