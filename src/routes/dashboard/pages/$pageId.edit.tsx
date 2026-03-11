import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { DashboardHeader } from "#/components/dashboard/Header";
import { Button } from "#/components/ui/button";
import { getPageById, updatePage } from "#/server/page-actions";
import { useState } from "react";
import { Library } from "lucide-react";
import { TiptapEditor } from "#/components/tiptap-editor";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Field, FieldError, FieldGroup, FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { Switch } from "#/components/ui/switch";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { slugify } from "#/lib/cms-schema";

const pageFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  excerpt: z.string(),
  content: z.string().min(1, "Content is required"),
  metaTitle: z.string(),
  metaDescription: z.string(),
  ogImage: z.string(),
  status: z.enum(["draft", "published", "private"]),
  isHome: z.boolean(),
});

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
        toast.error(error instanceof Error ? error.message : "Could not update page");
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

      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
        className="bg-card border shadow-sm mt-8 space-y-6 rounded-[1.6rem] p-6 sm:p-8"
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
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                      const currentSlug = form.getFieldValue("slug");
                      if (!currentSlug || currentSlug === slugify(field.state.value)) {
                        form.setFieldValue("slug", slugify(e.target.value));
                      }
                    }}
                  />
                  {invalid && <FieldError errors={field.state.meta.errors} />}
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
                  onChange={(e) => field.handleChange(slugify(e.target.value))}
                />
                {field.state.meta.errors.length > 0 && (
                  <FieldError errors={field.state.meta.errors} />
                )}
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
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="content">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel>Content</FieldLabel>
                <TiptapEditor content={field.state.value} onChange={field.handleChange} />
                {field.state.meta.errors.length > 0 && (
                  <FieldError errors={field.state.meta.errors} />
                )}
              </Field>
            )}
          </form.Field>
        </FieldGroup>

        <div className="border-t border-border pt-6">
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowSeo(!showSeo)}>
            {showSeo ? "▼" : "▶"} SEO Settings
          </Button>
          {showSeo && (
            <div className="mt-4 space-y-4 rounded-xl bg-muted/50 p-6">
              <form.Field name="metaTitle">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Meta Title</FieldLabel>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
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
                      onChange={(e) => field.handleChange(e.target.value)}
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
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </Field>
                )}
              </form.Field>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 border-t border-border pt-6 sm:grid-cols-2">
          <form.Field name="status">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Status</FieldLabel>
                <Select value={field.state.value} onValueChange={(value) => field.handleChange(value as "draft" | "published" | "private")}>
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
          <Button type="button" variant="outline" size="lg" onClick={() => void navigate({ to: "/dashboard/pages" })}>
            Cancel
          </Button>
        </div>
      </form>
    </DashboardPageContainer>
  );
}
