import { Link } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { type LucideIcon, History, LayoutPanelTop, Lock, LockOpen, RefreshCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Editor as PuckEditor } from "#/components/cms/Editor";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { PageEditorialPreview } from "#/components/dashboard/editorial-preview";
import { EditorialWorkspace } from "#/components/dashboard/editorial-workspace";
import { DashboardHeader } from "#/components/dashboard/Header";
import { LazyTiptapEditor } from "#/components/lazy-tiptap-editor";
import { Button } from "#/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { Switch } from "#/components/ui/switch";
import { Textarea } from "#/components/ui/textarea";
import { pageFormSchema } from "#/schemas";
import { buildPagePreviewDraft } from "#/lib/editorial-preview";
import { getNextAutoSlug, normalizeEditorialSlugInput } from "#/lib/editorial-form-utils";
import { getPageBuilderData, isPuckPageContent, serializePuckData } from "#/lib/puck";
import type { PageEditorFormValues } from "#/types/editorial";
import {
  acquirePageLock,
  autosavePage,
  getPageRevisionsForEditor,
  heartbeatPageLock,
  releasePageLock,
  restorePageRevision,
} from "#/server/actions/page-actions";

type PageStatus = PageEditorFormValues["status"];
type PageRevision = Awaited<ReturnType<typeof getPageRevisionsForEditor>>[number];

interface PageEditorScreenProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconLabel: string;
  initialValues: PageEditorFormValues;
  storageKey: string;
  submitLabel: string;
  submitErrorMessage: string;
  onSubmit: (values: PageEditorFormValues) => Promise<void>;
  onCancel: () => void;
  entityId?: number;
  initialRevisions?: PageRevision[];
}

function formatRevisionDate(date: Date | string | null) {
  if (!date) return "Unknown";
  return new Date(date).toLocaleString();
}

function PageContentField({
  content,
  excerpt,
  title,
  useVisualBuilder,
  onChange,
  errors,
  saveToastMessage,
}: {
  content: string;
  excerpt: string;
  title: string;
  useVisualBuilder: boolean;
  onChange: (value: string) => void;
  errors: unknown[];
  saveToastMessage: string;
}) {
  const normalizedErrors = errors
    .map((error) => (typeof error === "string" ? error : "Invalid content"))
    .filter((error) => error.length > 0);

  return (
    <Field data-invalid={normalizedErrors.length > 0}>
      <FieldLabel>Content</FieldLabel>
      {useVisualBuilder ? (
        <div className="mt-2">
          <PuckEditor
            data={getPageBuilderData({
              content,
              title,
              description: excerpt,
            })}
            onSave={async (data) => {
              onChange(serializePuckData(data));
              toast.info(saveToastMessage);
            }}
            onChange={(data) => {
              onChange(serializePuckData(data));
            }}
          />
        </div>
      ) : (
        <LazyTiptapEditor content={content} onChange={onChange} />
      )}
      {normalizedErrors.length > 0 ? <FieldError errors={normalizedErrors} /> : null}
    </Field>
  );
}

export function PageEditorScreen({
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
  entityId,
  initialRevisions = [],
}: PageEditorScreenProps) {
  const [saving, setSaving] = useState(false);
  const [showSeo, setShowSeo] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState("Not saved yet");
  const [lockState, setLockState] = useState<"idle" | "acquired" | "held_by_other">("idle");
  const [revisions, setRevisions] = useState<PageRevision[]>(initialRevisions);
  const lastAutosavedRef = useRef(JSON.stringify(initialValues));

  const form = useForm({
    defaultValues: initialValues,
    validators: {
      onChange: pageFormSchema,
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

  useEffect(() => {
    if (!values.useVisualBuilder || isPuckPageContent(values.content)) {
      return;
    }

    form.setFieldValue(
      "content",
      serializePuckData(
        getPageBuilderData({
          content: values.content,
          title: values.title,
          description: values.excerpt,
        }),
      ),
    );
  }, [form, values.content, values.excerpt, values.title, values.useVisualBuilder]);

  useEffect(() => {
    if (!entityId) return;

    let active = true;
    void acquirePageLock({ data: { pageId: entityId } })
      .then((result) => {
        if (!active) return;
        setLockState(result.state === "held_by_other" ? "held_by_other" : "acquired");
      })
      .catch((error) => {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : "Could not acquire editor lock");
      });

    const heartbeat = window.setInterval(() => {
      void heartbeatPageLock({ data: { pageId: entityId } })
        .then((result) => {
          if (!active) return;
          setLockState(result.state === "held_by_other" ? "held_by_other" : "acquired");
        })
        .catch(() => undefined);
    }, 60_000);

    return () => {
      active = false;
      window.clearInterval(heartbeat);
      void releasePageLock({ data: { pageId: entityId } }).catch(() => undefined);
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
      void autosavePage({
        data: {
          id: entityId,
          ...values,
        },
      })
        .then(async () => {
          lastAutosavedRef.current = serialized;
          setAutosaveStatus("Autosaved");
          const nextRevisions = await getPageRevisionsForEditor({ data: { pageId: entityId } });
          setRevisions(nextRevisions);
        })
        .catch((error) => {
          setAutosaveStatus("Autosave failed");
          toast.error(error instanceof Error ? error.message : "Autosave failed");
        });
    }, 20_000);

    return () => window.clearInterval(autosaveTimer);
  }, [entityId, lockState, saving, values]);

  async function handleRestoreRevision(revisionId: number) {
    if (!entityId) return;

    try {
      await restorePageRevision({ data: { revisionId } });
      const nextRevisions = await getPageRevisionsForEditor({ data: { pageId: entityId } });
      setRevisions(nextRevisions);
      toast.success("Revision restored as a draft");
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not restore revision");
    }
  }

  return (
    <DashboardPageContainer>
      <DashboardHeader title={title} description={description} icon={icon} iconLabel={iconLabel}>
        {entityId ? (
          <Button asChild variant="outline">
            <Link to="/dashboard/preview/page/$pageId" params={{ pageId: String(entityId) }} target="_blank">
              Authenticated Preview
            </Link>
          </Button>
        ) : null}
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
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-6"
          >
            <FieldGroup>
              <form.Field name="title">
                {(field) => (
                  <Field data-invalid={field.state.meta.errors.length > 0}>
                    <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                    <Input
                      id={field.name}
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
                  <Field>
                    <FieldLabel htmlFor={field.name}>Excerpt</FieldLabel>
                    <Textarea
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="useVisualBuilder">
                {(field) => (
                  <div className="mb-6 flex items-center space-x-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <Switch
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked === true)}
                    />
                    <label htmlFor={field.name} className="flex cursor-pointer flex-col">
                      <span className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
                        <LayoutPanelTop className="size-4" />
                        Visual Builder (Puck)
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Enable block-based visual editing for this page.
                      </span>
                    </label>
                  </div>
                )}
              </form.Field>

              <form.Field name="isPremium">
                {(field) => (
                  <div className="flex items-center space-x-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <Switch
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked === true)}
                    />
                    <label htmlFor={field.name} className="flex cursor-pointer flex-col">
                      <span className="text-sm font-bold text-foreground">Premium Page</span>
                      <span className="text-xs text-muted-foreground">
                        Only members can read the full page content.
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
                          >
                            <SelectTrigger id={field.name}>
                              <SelectValue placeholder="Select teaser mode" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="excerpt">Use excerpt</SelectItem>
                              <SelectItem value="truncate">Truncate page body</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                      )}
                    </form.Field>
                  ) : null
                }
              </form.Subscribe>

              <form.Subscribe
                selector={(state) => ({
                  excerpt: state.values.excerpt,
                  title: state.values.title,
                  useVisualBuilder: state.values.useVisualBuilder,
                })}
              >
                {(editorValues) => (
                  <form.Field name="content">
                    {(field) => (
                      <PageContentField
                        content={field.state.value}
                        excerpt={editorValues.excerpt}
                        title={editorValues.title}
                        useVisualBuilder={editorValues.useVisualBuilder}
                        onChange={field.handleChange}
                        errors={field.state.meta.errors}
                        saveToastMessage={`Puck data updated. Click ${submitLabel} to persist.`}
                      />
                    )}
                  </form.Field>
                )}
              </form.Subscribe>
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
                          <span className="text-sm font-bold text-foreground">Noindex this page</span>
                          <span className="text-xs text-muted-foreground">
                            Useful for thank-you pages, promos, or utility pages that should stay out of search.
                          </span>
                        </label>
                      </div>
                    )}
                  </form.Field>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-6 border-t border-border pt-6 sm:grid-cols-2">
              <form.Field name="status">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Status</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value as PageStatus)}
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>

              <form.Field name="isHome">
                {(field) => (
                  <div className="flex items-center space-x-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <Switch
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked === true)}
                    />
                    <label htmlFor={field.name} className="flex cursor-pointer flex-col">
                      <span className="text-sm font-bold text-foreground">Set as Homepage</span>
                      <span className="text-xs text-muted-foreground">
                        This page will be rendered at `/`.
                      </span>
                    </label>
                  </div>
                )}
              </form.Field>
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
                        <p className="text-sm font-semibold text-foreground">{revision.source}</p>
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
        preview={<PageEditorialPreview draft={buildPagePreviewDraft(values)} />}
      />
    </DashboardPageContainer>
  );
}

