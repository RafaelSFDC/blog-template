import { createFileRoute } from "@tanstack/react-router";
import { DashboardHeader } from "#/components/dashboard/Header";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { FolderTree, Plus, Pencil, Trash2 } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { Button } from "#/components/ui/button";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "#/server/taxonomy-actions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "#/components/dashboard/DataTable";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().catch(""),
});

export const Route = createFileRoute("/dashboard/categories/")({
  component: CategoriesPage,
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function CategoriesPage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm({
    defaultValues: {
      name: "",
      slug: "",
      description: "",
    },
    validators: {
      onChange: categorySchema,
    },
    onSubmit: async ({ value }) => {
      const data = {
        name: value.name,
        slug: value.slug,
        description: value.description || "",
      };
      if (editingId) {
        updateMutation.mutate({ data: { id: editingId, data: data } });
      } else {
        createMutation.mutate({ data: data });
      }
    },
  });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setIsAdding(false);
      resetForm();
      toast.success("Category created successfully");
    },
    onError: () => toast.error("Error creating category"),
  });

  const updateMutation = useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditingId(null);
      resetForm();
      toast.success("Category updated successfully");
    },
    onError: () => toast.error("Error updating category"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted successfully");
    },
    onError: () => toast.error("Error deleting category"),
  });

  const resetForm = () => {
    form.reset();
  };

  const handleEdit = useCallback((category: typeof categories[0]) => {
    setEditingId(category.id);
    form.setFieldValue("name", category.name);
    form.setFieldValue("slug", category.slug);
    form.setFieldValue("description", category.description || "");
    setIsAdding(false);
  }, [form]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  };

  const columns = useMemo<ColumnDef<typeof categories[0]>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="font-semibold">{row.getValue("name")}</div>
        ),
      },
      {
        accessorKey: "slug",
        header: "Slug",
        cell: ({ row }) => (
          <div className="italic text-muted-foreground">
            {row.getValue("slug")}
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground hidden md:table-cell truncate max-w-xs">
            {row.getValue("description") || "-"}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const category = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleEdit(category)}
                title="Edit"
              >
                <Pencil size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  if (
                    confirm("Are you sure you want to delete this category?")
                  ) {
                    deleteMutation.mutate({
                      data: { id: category.id },
                    });
                  }
                }}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                title="Delete"
              >
                <Trash2 size={18} />
              </Button>
            </div>
          );
        },
      },
    ],
    [handleEdit, deleteMutation],
  );

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title="Categories"
        description="Manage your blog categories to organize your content."
        icon={FolderTree}
        iconLabel="Taxonomies"
      >
        {!isAdding && !editingId && (
          <Button onClick={() => setIsAdding(true)} variant="default">
            <Plus className="mr-2 h-4 w-4" /> New Category
          </Button>
        )}
      </DashboardHeader>

      {(isAdding || editingId) && (
        <section className="bg-card border shadow-sm rounded-xl p-8 space-y-6">
          <h2 className="text-2xl font-bold">
            {editingId ? "Edit Category" : "Add New Category"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <form.Field name="name">
                  {(field) => {
                    const isInvalid = !!field.state.meta.errors.length;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Name</FieldLabel>
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
                              form.setFieldValue(
                                "slug",
                                slugify(e.target.value),
                              );
                            }
                          }}
                          placeholder="e.g. Technology"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                </form.Field>
                <form.Field name="slug">
                  {(field) => {
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
                          placeholder="e.g. technology"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                </form.Field>
              </div>
              <form.Field name="description">
                {(field) => {
                  const isInvalid = !!field.state.meta.errors.length;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                      <Textarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="min-h-[100px]"
                        placeholder="Optional description..."
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>
            </FieldGroup>
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="default"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingId ? "Update" : "Create"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </section>
      )}

      <DataTable
        columns={columns}
        data={categories}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Filter categories..."
      />
    </DashboardPageContainer>
  );
}
