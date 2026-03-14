import { useForm } from "@tanstack/react-form";
import { type LucideIcon, LayoutPanelTop } from "lucide-react";
import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Switch } from "#/components/ui/switch";
import { Textarea } from "#/components/ui/textarea";
import { pageFormSchema, slugify } from "#/lib/cms-schema";
import { buildPagePreviewDraft, type PageEditorFormValues } from "#/lib/editorial-preview";
import { shouldAutoUpdateSlug } from "#/lib/editorial-form-utils";
import {
  getPageBuilderData,
  isPuckPageContent,
  serializePuckData,
} from "#/lib/puck";

type PageStatus = PageEditorFormValues["status"];

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
}: PageEditorScreenProps) {
  const [saving, setSaving] = useState(false);
  const [showSeo, setShowSeo] = useState(false);

  // Pages use Puck as the primary page-building experience.
  // Text serialization support is preserved here for compatibility paths.

  const form = useForm({
    defaultValues: initialValues,
    validators: {
      onChange: pageFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        setSaving(true);
        await onSubmit(value);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : submitErrorMessage,
        );
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
  }, [
    form,
    values.content,
    values.excerpt,
    values.title,
    values.useVisualBuilder,
  ]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    form.handleSubmit();
  }

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title={title}
        description={description}
        icon={icon}
        iconLabel={iconLabel}
      />

      <EditorialWorkspace
        storageKey={storageKey}
        form={
          <form onSubmit={handleSubmit} className="space-y-6">
            <FieldGroup>
              <form.Field name="title">
                {(field) => {
                  const invalid = field.state.meta.errors.length > 0;
                  return (
                    <Field data-invalid={invalid}>
                      <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                      <Input
                        id={field.name}
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
                      {invalid ? <FieldError errors={field.state.meta.errors} /> : null}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="slug">
                {(field) => (
                  <Field data-invalid={field.state.meta.errors.length > 0}>
                    <FieldLabel htmlFor={field.name}>Slug</FieldLabel>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(slugify(event.target.value))
                      }
                    />
                    {field.state.meta.errors.length > 0 ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
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
                        saveToastMessage={`Puck data updated in form. Click ${submitLabel} to persist.`}
                      />
                    )}
                  </form.Field>
                )}
              </form.Subscribe>
            </FieldGroup>

            <div className="border-t border-border pt-6">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSeo((current) => !current)}
              >
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

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={saving} size="lg">
                {saving ? "Saving…" : submitLabel}
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        }
        preview={
          <form.Subscribe selector={(state) => state.values}>
            {(previewValues) => (
              <PageEditorialPreview draft={buildPagePreviewDraft(previewValues)} />
            )}
          </form.Subscribe>
        }
      />
    </DashboardPageContainer>
  );
}
