import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { DashboardHeader } from "#/components/dashboard/Header";
import { Button } from "#/components/ui/button";
import { createServerFn } from "@tanstack/react-start";
import { posts } from "#/db/schema";
import { eq } from "drizzle-orm";
import { useState } from "react";
import { requireAdminSession } from "#/lib/admin-auth";
import { TiptapEditor } from "#/components/tiptap-editor";
import { postCategories, postTags } from "#/db/schema";
import { getCategories, getTags } from "#/server/taxonomy-actions";
import { FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { triggerWebhook } from "#/lib/webhooks";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { Checkbox } from "#/components/ui/checkbox";
import { Switch } from "#/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";

const postSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  excerpt: z.string().min(1, "Excerpt is required"),
  content: z.string().min(1, "Content is required"),
  metaTitle: z.string(),
  metaDescription: z.string(),
  ogImage: z.string(),
  isPremium: z.boolean(),
  status: z.enum(["draft", "published", "scheduled", "private"]),
  publishedAt: z.string(),
  categoryIds: z.array(z.number()),
  tagIds: z.array(z.number()),
});

interface PostFormInput {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  isPremium: boolean;
  status: "draft" | "published" | "scheduled" | "private";
  publishedAt?: Date;
  categoryIds: number[];
  tagIds: number[];
}

const getPostForEdit = createServerFn({ method: "GET" })
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    await requireAdminSession();
    const { db } = await import("#/db/index");
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, data.id),
      with: {
        postCategories: true,
        postTags: true,
      },
    });

    if (!post) {
      throw notFound();
    }

    return post;
  });

const updatePost = createServerFn({ method: "POST" })
  .inputValidator((input: PostFormInput) => input)
  .handler(async ({ data }) => {
    await requireAdminSession();
    const { db } = await import("#/db/index");
    await db
      .update(posts)
      .set({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        ogImage: data.ogImage,
        isPremium: data.isPremium,
        status: data.status,
        publishedAt: data.publishedAt || new Date(),
        updatedAt: new Date(),
      })
      .where(eq(posts.id, data.id));

    // Sync categories
    await db.delete(postCategories).where(eq(postCategories.postId, data.id));
    if (data.categoryIds.length > 0) {
      await db.insert(postCategories).values(
        data.categoryIds.map((categoryId) => ({
          postId: data.id,
          categoryId,
        })),
      );
    }

    // Sync tags
    await db.delete(postTags).where(eq(postTags.postId, data.id));
    if (data.tagIds.length > 0) {
      await db
        .insert(postTags)
        .values(data.tagIds.map((tagId) => ({ postId: data.id, tagId })));
    }

    if (data.status === "published") {
      await triggerWebhook("post.published", {
        id: data.id,
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
      });
    }

    return { ok: true as const };
  });

export const Route = createFileRoute("/dashboard/posts/$postId/edit")({
  loader: ({ params }) => {
    const id = Number(params.postId);
    if (!Number.isFinite(id)) {
      throw notFound();
    }
    return getPostForEdit({ data: { id } });
  },
  component: EditPostPage,
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function EditPostPage() {
  const post = Route.useLoaderData();
  const navigate = useNavigate();
  const form = useForm({
    defaultValues: {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      metaTitle: post.metaTitle || "",
      metaDescription: post.metaDescription || "",
      ogImage: post.ogImage || "",
      isPremium: post.isPremium || false,
      status: post.status as "draft" | "published" | "scheduled" | "private",
      publishedAt: post.publishedAt
        ? new Date(post.publishedAt).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      categoryIds:
        post.postCategories?.map((pc: any) => pc.categoryId) ||
        ([] as number[]),
      tagIds: post.postTags?.map((pt: any) => pt.tagId) || ([] as number[]),
    },
    validators: {
      onChange: postSchema,
    },
    onSubmit: async ({ value }) => {
      const normalizedSlug = value.slug || slugify(value.title);
      if (!normalizedSlug) {
        setErrorMessage(
          "Add a title or slug so the post URL can be generated.",
        );
        return;
      }

      try {
        setSaving(true);
        setErrorMessage("");
        await updatePost({
          data: {
            id: post.id,
            title: value.title.trim(),
            slug: normalizedSlug,
            excerpt: value.excerpt.trim(),
            content: value.content.trim(),
            metaTitle: value.metaTitle?.trim() || undefined,
            metaDescription: value.metaDescription?.trim() || undefined,
            ogImage: value.ogImage?.trim() || undefined,
            isPremium: value.isPremium,
            status: value.status,
            publishedAt:
              value.status === "scheduled"
                ? new Date(value.publishedAt || "")
                : value.status === "published"
                  ? new Date()
                  : undefined,
            categoryIds: value.categoryIds,
            tagIds: value.tagIds,
          },
        });
        await navigate({ to: "/dashboard" });
      } catch (e) {
        console.error(e);
        setErrorMessage(
          "Could not update this post. Check the slug and try again.",
        );
      } finally {
        setSaving(false);
      }
    },
  });

  // UI-only states
  const [errorMessage, setErrorMessage] = useState("");
  const [showSEO, setShowSEO] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  const { data: tags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: () => getTags(),
  });

  async function handleSubmit(event: any) {
    event.preventDefault();
    event.stopPropagation();
    form.handleSubmit();
  }

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title="Edit Post"
        description="Refine the story and keep your publication up to date."
        icon={FileText}
        iconLabel="Editorial Dashboard"
      />

      <form
        onSubmit={handleSubmit}
        className="bg-card border shadow-sm mt-8 space-y-6 rounded-[1.6rem] p-6 sm:p-8"
      >
        <FieldGroup>
          <form.Field
            name="title"
            children={(field) => {
              const isInvalid = !!field.state.meta.errors.length;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                      const currentSlug = form.getFieldValue("slug");
                      if (
                        !currentSlug ||
                        currentSlug === slugify(field.state.value)
                      ) {
                        form.setFieldValue("slug", slugify(e.target.value));
                      }
                    }}
                    placeholder="Designing A Better Publishing Workflow…"
                  />
                  {isInvalid && (
                    <FieldError errors={field.state.meta.errors as any} />
                  )}
                </Field>
              );
            }}
          />

          <form.Field
            name="slug"
            children={(field) => {
              const isInvalid = !!field.state.meta.errors.length;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Slug</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(slugify(e.target.value))
                    }
                    placeholder="designing-a-better-publishing-workflow…"
                  />
                  {isInvalid && (
                    <FieldError errors={field.state.meta.errors as any} />
                  )}
                </Field>
              );
            }}
          />

          <form.Field
            name="excerpt"
            children={(field) => {
              const isInvalid = !!field.state.meta.errors.length;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Excerpt</FieldLabel>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Summarize the key argument of this post in 1 short paragraph…"
                  />
                  {isInvalid && (
                    <FieldError errors={field.state.meta.errors as any} />
                  )}
                </Field>
              );
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
            <form.Field
              name="categoryIds"
              children={(field) => (
                <Field>
                  <FieldLabel>Categories</FieldLabel>
                  <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-input bg-muted/30">
                    {categories.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        No categories available.
                      </p>
                    ) : (
                      categories.map((cat: any) => (
                        <label
                          key={cat.id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-border cursor-pointer hover:border-primary transition-colors"
                        >
                          <Checkbox
                            checked={field.state.value.includes(cat.id)}
                            onCheckedChange={(checked) => {
                              if (checked)
                                field.handleChange([
                                  ...field.state.value,
                                  cat.id,
                                ]);
                              else
                                field.handleChange(
                                  field.state.value.filter(
                                    (id: number) => id !== cat.id,
                                  ),
                                );
                            }}
                          />
                          <span className="text-sm font-medium">
                            {cat.name}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </Field>
              )}
            />

            <form.Field
              name="tagIds"
              children={(field) => (
                <Field>
                  <FieldLabel>Tags</FieldLabel>
                  <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-input bg-muted/30">
                    {tags.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        No tags available.
                      </p>
                    ) : (
                      tags.map((tag: any) => (
                        <label
                          key={tag.id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-border cursor-pointer hover:border-primary transition-colors"
                        >
                          <Checkbox
                            checked={field.state.value.includes(tag.id)}
                            onCheckedChange={(checked) => {
                              if (checked)
                                field.handleChange([
                                  ...field.state.value,
                                  tag.id,
                                ]);
                              else
                                field.handleChange(
                                  field.state.value.filter(
                                    (id: number) => id !== tag.id,
                                  ),
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
            />
          </div>

          <form.Field
            name="content"
            children={(field) => {
              const isInvalid = !!field.state.meta.errors.length;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel>Content</FieldLabel>
                  <TiptapEditor
                    content={field.state.value}
                    onChange={field.handleChange}
                  />
                  {isInvalid && (
                    <FieldError errors={field.state.meta.errors as any} />
                  )}
                </Field>
              );
            }}
          />
        </FieldGroup>

        <div className="border-t border-border pt-6">
          <button
            type="button"
            onClick={() => setShowSEO(!showSEO)}
            className="flex items-center gap-2 text-sm font-bold text-foreground hover:opacity-80"
          >
            {showSEO ? "▼" : "▶"} SEO Settings
          </button>

          {showSEO && (
            <div className="mt-4 space-y-4 rounded-xl bg-muted/50 p-6">
              <form.Field
                name="metaTitle"
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      Meta Title (Google Title)
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Se ometido, usará o título do post"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </Field>
                )}
              />
              <form.Field
                name="metaDescription"
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      Meta Description
                    </FieldLabel>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Descrição curta para os resultados de busca..."
                      className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </Field>
                )}
              />
              <form.Field
                name="ogImage"
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>OG Image URL</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="https://exemplo.com/imagem.jpg"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </Field>
                )}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 border-t border-border pt-6 sm:grid-cols-2">
          <form.Field
            name="status"
            children={(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Status</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(val) => field.handleChange(val as any)}
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
          />

          <form.Subscribe
            selector={(state) => state.values.status}
            children={(status: any) => {
              if (status !== ("scheduled" as any)) return null;
              return (
                <form.Field
                  name="publishedAt"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        Publication Date
                      </FieldLabel>
                      <Input
                        id={field.name}
                        type="datetime-local"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </Field>
                  )}
                />
              );
            }}
          />
        </div>

        <form.Field
          name="isPremium"
          children={(field) => (
            <div className="flex items-center space-x-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <Switch
                id={field.name}
                checked={field.state.value}
                onCheckedChange={(val) => field.handleChange(val as any)}
              />
              <label
                htmlFor={field.name}
                className="flex flex-col cursor-pointer"
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
        />

        {errorMessage ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={saving} variant="default" size="lg">
            {saving ? "Saving…" : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => void navigate({ to: "/dashboard" })}
          >
            Cancel
          </Button>
        </div>
      </form>
    </DashboardPageContainer>
  );
}
