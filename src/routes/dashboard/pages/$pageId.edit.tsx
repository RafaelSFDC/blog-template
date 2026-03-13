import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { toast } from "sonner";
import { Library } from "lucide-react";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { DashboardHeader } from "#/components/dashboard/Header";
import { EditorialWorkspace } from "#/components/dashboard/editorial-workspace";
import { PageEditorialPreview } from "#/components/dashboard/editorial-preview";
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
import { buildPagePreviewDraft } from "#/lib/editorial-preview";
import { getPageById, updatePage } from "#/server/page-actions";
import { Editor as PuckEditor } from "#/components/cms/Editor";
import { LayoutPanelTop } from "lucide-react";

export const Route = createFileRoute("/dashboard/pages/$pageId/edit")({
  loader: async ({ params }) => {
    const id = Number(params.pageId);
    if (!Number.isFinite(id)) {
      throw notFound();
    }

    const page = await getPageById({ data: id });
    if (!page) {
      throw notFound();
    }

    return page;
  },
  component: EditPagePage,
});

function EditPagePage() {
  const page = Route.useLoaderData();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [showSeo, setShowSeo] = useState(false);

  const form = useForm({
    defaultValues: {
      title: page.title,
      slug: page.slug,
      excerpt: page.excerpt || "",
      content: page.content,
      metaTitle: page.metaTitle || "",
      metaDescription: page.metaDescription || "",
      ogImage: page.ogImage || "",
      status: page.status as "draft" | "published" | "private",
      isHome: page.isHome || false,
      useVisualBuilder: page.content.startsWith('{"content":') || page.content.startsWith('{"root":'),
    },
    validators: {
      onChange: pageFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        setSaving(true);
        await updatePage({
          data: {
            id: page.id,
            ...value,
            title: value.title.trim(),
            slug: value.slug.trim(),
            excerpt: value.excerpt.trim() || undefined,
            metaTitle: value.metaTitle.trim() || undefined,
            metaDescription: value.metaDescription.trim() || undefined,
            ogImage: value.ogImage.trim() || undefined,
          },
        });
        toast.success("Page updated successfully");
        await navigate({ to: "/dashboard/pages" });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not update page",
        );
      } finally {
        setSaving(false);
      }
    },
  });

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title="Edit Page"
        description="Update a static page in your publication."
        icon={Library}
        iconLabel="Static Content"
      />

      <EditorialWorkspace
        storageKey={`page-editor-${page.id}`}
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
                          if (!currentSlug || currentSlug === slugify(field.state.value)) {
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
                  <div className="flex items-center space-x-3 rounded-xl border border-primary/20 bg-primary/5 p-4 mb-6">
                    <Switch
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked === true)}
                    />
                    <label htmlFor={field.name} className="flex cursor-pointer flex-col">
                      <span className="text-sm font-bold text-foreground inline-flex items-center gap-2">
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

              <form.Field name="content">
                {(field) => (
                  <Field data-invalid={field.state.meta.errors.length > 0}>
                    <FieldLabel>Content</FieldLabel>
                    {form.getFieldValue("useVisualBuilder") ? (
                      <div className="mt-2">
                        <PuckEditor
                          data={(() => {
                            try {
                              return JSON.parse(field.state.value);
                            } catch {
                              return { content: [], root: {} };
                            }
                          })()}
                          onSave={async (data) => {
                            field.handleChange(JSON.stringify(data));
                            toast.info("Puck data updated in form. Click Save Changes to persist.");
                          }}
                          onChange={(data) => {
                            field.handleChange(JSON.stringify(data));
                          }}
                        />
                      </div>
                    ) : (
                      <LazyTiptapEditor
                        content={field.state.value}
                        onChange={field.handleChange}
                      />
                    )}
                    {field.state.meta.errors.length > 0 ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                )}
              </form.Field>
            </FieldGroup>

            <div className="border-t border-border pt-6">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSeo(!showSeo)}
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
                      onValueChange={(value) =>
                        field.handleChange(value as "draft" | "published" | "private")
                      }
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
                {saving ? "Saving…" : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => void navigate({ to: "/dashboard/pages" })}
              >
                Cancel
              </Button>
            </div>
          </form>
        }
        preview={
          <form.Subscribe selector={(state) => state.values}>
            {(values) => (
              <PageEditorialPreview draft={buildPagePreviewDraft(values)} />
            )}
          </form.Subscribe>
        }
      />
    </DashboardPageContainer>
  );
}
