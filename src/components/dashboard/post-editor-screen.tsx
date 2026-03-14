import { useQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { type LucideIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { PostEditorialPreview } from "#/components/dashboard/editorial-preview";
import { EditorialWorkspace } from "#/components/dashboard/editorial-workspace";
import { DashboardHeader } from "#/components/dashboard/Header";
import { LazyTiptapEditor } from "#/components/lazy-tiptap-editor";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import {
  Field,
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
import { Switch } from "#/components/ui/switch";
import { Textarea } from "#/components/ui/textarea";
import { postFormSchema, slugify } from "#/lib/cms-schema";
import {
  buildPostPreviewDraft,
  type PostEditorFormValues,
} from "#/lib/editorial-preview";
import { shouldAutoUpdateSlug } from "#/lib/editorial-form-utils";
import { getCategories, getTags } from "#/server/taxonomy-actions";

type PostStatus = PostEditorFormValues["status"];
type Category = Awaited<ReturnType<typeof getCategories>>[number];
type Tag = Awaited<ReturnType<typeof getTags>>[number];

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
}: PostEditorScreenProps) {
  const [saving, setSaving] = useState(false);
  const [showSeo, setShowSeo] = useState(false);

  const form = useForm({
    defaultValues: initialValues,
    validators: {
      onChange: postFormSchema,
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

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  const { data: tags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: () => getTags(),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
                  const isInvalid = field.state.meta.errors.length > 0;
                  return (
                    <Field data-invalid={isInvalid}>
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
                        placeholder="Designing A Better Publishing Workflow…"
                      />
                      {isInvalid ? (
                        <FieldError errors={field.state.meta.errors} />
                      ) : null}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="slug">
                {(field) => {
                  const isInvalid = field.state.meta.errors.length > 0;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Slug</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(slugify(event.target.value))
                        }
                        placeholder="designing-a-better-publishing-workflow…"
                      />
                      {isInvalid ? (
                        <FieldError errors={field.state.meta.errors} />
                      ) : null}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="excerpt">
                {(field) => {
                  const isInvalid = field.state.meta.errors.length > 0;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Excerpt</FieldLabel>
                      <Textarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        placeholder="Summarize the key argument of this post in 1 short paragraph…"
                        className="min-h-28 w-full rounded-xl border border-input bg-muted px-4 py-3 text-sm text-foreground"
                      />
                      {isInvalid ? (
                        <FieldError errors={field.state.meta.errors} />
                      ) : null}
                    </Field>
                  );
                }}
              </form.Field>

              <div className="grid grid-cols-1 gap-6 border-t border-border pt-4 md:grid-cols-2">
                <form.Field name="categoryIds">
                  {(field) => (
                    <Field>
                      <FieldLabel>Categories</FieldLabel>
                      <div className="flex flex-wrap gap-2 rounded-xl border border-input bg-muted/30 p-3">
                        {categories.length === 0 ? (
                          <p className="text-xs italic text-muted-foreground">
                            No categories available.
                          </p>
                        ) : (
                          categories.map((category: Category) => (
                            <label
                              key={category.id}
                              className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 transition-colors hover:border-primary"
                            >
                              <Checkbox
                                checked={field.state.value.includes(category.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.handleChange([
                                      ...field.state.value,
                                      category.id,
                                    ]);
                                    return;
                                  }

                                  field.handleChange(
                                    field.state.value.filter((id) => id !== category.id),
                                  );
                                }}
                              />
                              <span className="text-sm font-medium">
                                {category.name}
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                    </Field>
                  )}
                </form.Field>

                <form.Field name="tagIds">
                  {(field) => (
                    <Field>
                      <FieldLabel>Tags</FieldLabel>
                      <div className="flex flex-wrap gap-2 rounded-xl border border-input bg-muted/30 p-3">
                        {tags.length === 0 ? (
                          <p className="text-xs italic text-muted-foreground">
                            No tags available.
                          </p>
                        ) : (
                          tags.map((tag: Tag) => (
                            <label
                              key={tag.id}
                              className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 transition-colors hover:border-primary"
                            >
                              <Checkbox
                                checked={field.state.value.includes(tag.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.handleChange([
                                      ...field.state.value,
                                      tag.id,
                                    ]);
                                    return;
                                  }

                                  field.handleChange(
                                    field.state.value.filter((id) => id !== tag.id),
                                  );
                                }}
                              />
                              <span className="text-sm font-medium">
                                #{tag.name}
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                    </Field>
                  )}
                </form.Field>
              </div>

              <form.Field name="content">
                {(field) => {
                  const isInvalid = field.state.meta.errors.length > 0;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel>Content</FieldLabel>
                      <LazyTiptapEditor
                        content={field.state.value}
                        onChange={field.handleChange}
                      />
                      {isInvalid ? (
                        <FieldError errors={field.state.meta.errors} />
                      ) : null}
                    </Field>
                  );
                }}
              </form.Field>
            </FieldGroup>

            <div className="border-t border-border pt-6">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSeo((current) => !current)}
                className="flex items-center gap-2 font-bold text-foreground hover:bg-muted"
              >
                {showSeo ? "▼" : "▶"} SEO Settings
              </Button>

              {showSeo ? (
                <div className="mt-4 space-y-4 rounded-xl bg-muted/50 p-6">
                  <form.Field name="metaTitle">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>
                          Meta Title (Google Title)
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                          placeholder="Se ometido, usará o título do post"
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="metaDescription">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>
                          Meta Description
                        </FieldLabel>
                        <Textarea
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                          placeholder="Descrição curta para os resultados de busca..."
                          className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
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
                          placeholder="https://exemplo.com/imagem.jpg"
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
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
                  <label
                    htmlFor={field.name}
                    className="flex cursor-pointer flex-col"
                  >
                    <span className="text-sm font-bold text-foreground">
                      Post Premium
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Somente assinantes pagos poderão ler o conteúdo completo.
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
                      onValueChange={(value) =>
                        field.handleChange(value as PostStatus)
                      }
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>

              <form.Subscribe selector={(state) => state.values.status === "scheduled"}>
                {(isScheduled) => {
                  if (!isScheduled) {
                    return null;
                  }

                  return (
                    <form.Field name="publishedAt">
                      {(field) => (
                        <Field>
                          <FieldLabel htmlFor={field.name}>
                            Publication Date
                          </FieldLabel>
                          <Input
                            id={field.name}
                            type="datetime-local"
                            value={field.state.value}
                            onChange={(event) => field.handleChange(event.target.value)}
                          />
                        </Field>
                      )}
                    </form.Field>
                  );
                }}
              </form.Subscribe>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={saving} variant="default" size="lg">
                {saving ? "Saving…" : submitLabel}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={onCancel}
              >
                Cancel
              </Button>
            </div>
          </form>
        }
        preview={
          <form.Subscribe selector={(state) => state.values}>
            {(values) => (
              <PostEditorialPreview
                draft={buildPostPreviewDraft(values, {
                  categories,
                  tags,
                  ...previewOptions,
                })}
              />
            )}
          </form.Subscribe>
        }
      />
    </DashboardPageContainer>
  );
}
