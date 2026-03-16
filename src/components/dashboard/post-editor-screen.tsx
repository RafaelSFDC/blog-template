import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { type LucideIcon, History, Lock, LockOpen, MessageSquare, RefreshCcw, Send, ShieldCheck } from "lucide-react";
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
import { StatusBadge } from "#/components/ui/status-badge";
import { Switch } from "#/components/ui/switch";
import { Textarea } from "#/components/ui/textarea";
import { authClient } from "#/lib/auth-client";
import { postFormSchema } from "#/lib/cms-schema";
import { buildPostPreviewDraft, type PostEditorFormValues } from "#/lib/editorial-preview";
import { getNextAutoSlug, normalizeEditorialSlugInput } from "#/lib/editorial-form-utils";
import { getEditorialStatusCopy } from "#/lib/editorial-workflow";
import {
  approvePost,
  acquirePostLock,
  autosavePost,
  archivePost,
  createEditorialComment,
  getPostWorkflowState,
  getPostRevisionsForEditor,
  heartbeatPostLock,
  requestPostReview,
  releasePostLock,
  resolveEditorialComment,
  restorePostRevision,
  sendPostBackToDraft,
  updateEditorialChecklist,
} from "#/server/post-actions";
import { getCategories, getTags } from "#/server/taxonomy-actions";

type PostStatus = PostEditorFormValues["status"];
type Category = Awaited<ReturnType<typeof getCategories>>[number];
type Tag = Awaited<ReturnType<typeof getTags>>[number];
type PostRevision = Awaited<ReturnType<typeof getPostRevisionsForEditor>>[number];
type PostWorkflowState = Awaited<ReturnType<typeof getPostWorkflowState>>;

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
  initialWorkflow?: PostWorkflowState;
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
  initialWorkflow,
}: PostEditorScreenProps) {
  const { data: session } = authClient.useSession();
  const [saving, setSaving] = useState(false);
  const [showSeo, setShowSeo] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState("Not saved yet");
  const [lockState, setLockState] = useState<"idle" | "acquired" | "held_by_other">("idle");
  const [revisions, setRevisions] = useState<PostRevision[]>(initialRevisions);
  const [commentDraft, setCommentDraft] = useState("");
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
    ? ["draft", "in_review", "scheduled", "published", "archived"]
    : ["draft", "in_review"];

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

  const workflowQuery = useQuery({
    queryKey: ["post-workflow", entityId],
    queryFn: () => getPostWorkflowState({ data: { postId: entityId! } }),
    enabled: Boolean(entityId),
    initialData: initialWorkflow,
  });
  const workflow = workflowQuery.data;
  const permissions = workflow?.permissions;
  const isReadOnly = lockState === "held_by_other" || (entityId ? !permissions?.canEditContent : false);

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
    if (!entityId || lockState !== "acquired" || isReadOnly) return;

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
  }, [entityId, isReadOnly, lockState, saving, values]);

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

  async function handleChecklistToggle(itemKey: string, isCompleted: boolean) {
    if (!entityId) return;
    try {
      await updateEditorialChecklist({ data: { postId: entityId, itemKey, isCompleted } });
      await workflowQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update checklist");
    }
  }

  async function handleCreateComment() {
    if (!entityId || !commentDraft.trim()) return;
    try {
      await createEditorialComment({
        data: {
          postId: entityId,
          content: commentDraft.trim(),
        },
      });
      setCommentDraft("");
      await workflowQuery.refetch();
      toast.success("Internal note added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add internal note");
    }
  }

  async function handleResolveComment(commentId: number) {
    try {
      await resolveEditorialComment({ data: { commentId } });
      await workflowQuery.refetch();
      toast.success("Internal note resolved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not resolve internal note");
    }
  }

  async function handleWorkflowAction(action: "request_review" | "publish" | "schedule" | "send_back" | "archive") {
    if (!entityId) return;
    try {
      if (action === "request_review") {
        await requestPostReview({
          data: {
            id: entityId,
            editorOwnerId: values.editorOwnerId || undefined,
          },
        });
      } else if (action === "send_back") {
        await sendPostBackToDraft({ data: { id: entityId } });
      } else if (action === "archive") {
        await archivePost({ data: { id: entityId } });
      } else {
        await approvePost({
          data: {
            id: entityId,
            action,
            scheduledFor: action === "schedule" && values.publishedAt ? new Date(values.publishedAt) : undefined,
            editorOwnerId: values.editorOwnerId || undefined,
          },
        });
      }
      await workflowQuery.refetch();
      toast.success("Workflow updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update workflow");
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
                        form.setFieldValue(
                          "slug",
                          getNextAutoSlug({
                            currentSlug: form.getFieldValue("slug"),
                            previousSource: field.state.value,
                            nextSource: event.target.value,
                          }),
                        );
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
                      onChange={(event) => field.handleChange(normalizeEditorialSlugInput(event.target.value))}
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
                  <form.Field name="seoNoIndex">
                    {(field) => (
                      <div className="flex items-center space-x-3 rounded-xl border border-border bg-background p-4">
                        <Switch
                          id={field.name}
                          checked={field.state.value}
                          onCheckedChange={(checked) => field.handleChange(checked === true)}
                        />
                        <label htmlFor={field.name} className="flex cursor-pointer flex-col">
                          <span className="text-sm font-bold text-foreground">Noindex this post</span>
                          <span className="text-xs text-muted-foreground">
                            Search engines will receive `noindex, nofollow` for this URL.
                          </span>
                        </label>
                      </div>
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

            <form.Subscribe selector={(state) => state.values.isPremium}>
              {(isPremium) =>
                isPremium ? (
                  <form.Field name="teaserMode">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Premium Teaser</FieldLabel>
                        <Select
                          value={field.state.value}
                          onValueChange={(value) => field.handleChange(value as typeof field.state.value)}
                          disabled={isReadOnly}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Select teaser mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excerpt">Use excerpt</SelectItem>
                            <SelectItem value="truncate">Truncate article body</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  </form.Field>
                ) : null
              }
            </form.Subscribe>

            <div className="grid grid-cols-1 gap-6 border-t border-border pt-6 sm:grid-cols-2">
              <form.Field name="status">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Status</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value as PostStatus)}
                      disabled={isReadOnly}
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

              <form.Field name="editorOwnerId">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Editorial Owner</FieldLabel>
                    <Select
                      value={field.state.value || "unassigned"}
                      onValueChange={(value) =>
                        field.handleChange(value === "unassigned" ? "" : value)
                      }
                      disabled={!canPublish}
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue placeholder="Select editor owner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {workflow?.editors.map((editor) => (
                          <SelectItem key={editor.id} value={editor.id}>
                            {editor.name}
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
                            disabled={isReadOnly}
                          />
                        </Field>
                      )}
                    </form.Field>
                  ) : null
                }
              </form.Subscribe>
            </div>

            {entityId && workflow ? (
              <section className="space-y-4 rounded-2xl border border-border bg-muted/20 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                      Workflow
                    </p>
                    <div className="flex items-center gap-2">
                      <StatusBadge variant={workflow.status === "published" ? "success" : workflow.status === "in_review" ? "warning" : "default"}>
                        {getEditorialStatusCopy(workflow.status)}
                      </StatusBadge>
                      {workflow.reviewRequestedAt ? (
                        <span className="text-xs text-muted-foreground">
                          Review requested {new Date(workflow.reviewRequestedAt).toLocaleString()}
                        </span>
                      ) : null}
                      {workflow.scheduledAt ? (
                        <span className="text-xs text-muted-foreground">
                          Scheduled for {new Date(workflow.scheduledAt).toLocaleString()}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {permissions?.canRequestReview ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => void handleWorkflowAction("request_review")}>
                        <Send className="mr-2 h-4 w-4" />
                        Request Review
                      </Button>
                    ) : null}
                    {permissions?.canManageWorkflow ? (
                      <>
                        <Button type="button" variant="outline" size="sm" onClick={() => void handleWorkflowAction("send_back")}>
                          Move to Draft
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => void handleWorkflowAction("schedule")}>
                          Schedule
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => void handleWorkflowAction("publish")}>
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Publish
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => void handleWorkflowAction("archive")}>
                          Archive
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3 rounded-xl border border-border bg-background p-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <h3 className="font-bold text-foreground">Editorial Checklist</h3>
                    </div>
                    <div className="space-y-2">
                      {workflow.checklist.map((item) => (
                        <label
                          key={item.key}
                          className="flex items-start gap-3 rounded-lg border border-border/60 px-3 py-2"
                        >
                          <Checkbox
                            checked={item.isCompleted}
                            onCheckedChange={(checked) => void handleChecklistToggle(item.key, checked === true)}
                            disabled={!permissions?.canEditContent && !permissions?.canManageWorkflow}
                          />
                          <span className="space-y-1">
                            <span className="block text-sm font-medium text-foreground">{item.label}</span>
                            {item.completedAt ? (
                              <span className="block text-xs text-muted-foreground">
                                Done {new Date(item.completedAt).toLocaleString()}
                                {item.completedBy?.name ? ` by ${item.completedBy.name}` : ""}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-xl border border-border bg-background p-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <h3 className="font-bold text-foreground">Internal Notes</h3>
                    </div>
                    <div className="space-y-2">
                      <Textarea
                        value={commentDraft}
                        onChange={(event) => setCommentDraft(event.target.value)}
                        placeholder="Add an internal note for the editorial team"
                        className="min-h-24"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => void handleCreateComment()}>
                        Add Note
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {workflow.comments.map((comment) => (
                        <div key={comment.id} className="rounded-lg border border-border/60 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {comment.author?.name ?? "Editorial Team"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatRevisionDate(comment.createdAt)}
                              </p>
                            </div>
                            {comment.resolvedAt ? (
                              <StatusBadge variant="success">Resolved</StatusBadge>
                            ) : permissions?.canResolveComments ? (
                              <Button type="button" variant="ghost" size="sm" onClick={() => void handleResolveComment(comment.id)}>
                                Resolve
                              </Button>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm text-foreground">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

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
              <Button type="submit" disabled={saving || isReadOnly} size="lg">
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
