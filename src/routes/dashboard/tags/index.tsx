import { createFileRoute } from "@tanstack/react-router";
import { DashboardHeader } from "#/components/dashboard/Header";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { Tags, Plus, Pencil, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "#/components/ui/button";
import {
  getTags,
  createTag,
  updateTag,
  deleteTag,
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
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "#/components/dashboard/DataTable";

const tagSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
});

export const Route = createFileRoute("/dashboard/tags/")({
  component: TagsPage,
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function TagsPage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm({
    defaultValues: {
      name: "",
      slug: "",
    },
    validators: {
      onChange: tagSchema,
    },
    onSubmit: async ({ value }) => {
      if (editingId) {
        updateMutation.mutate({ data: { id: editingId, data: value } });
      } else {
        createMutation.mutate({ data: value });
      }
    },
  });

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: () => getTags(),
  });

  const createMutation = useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setIsAdding(false);
      resetForm();
      toast.success("Tag created successfully");
    },
    onError: () => toast.error("Error creating tag"),
  });

  const updateMutation = useMutation({
    mutationFn: updateTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setEditingId(null);
      resetForm();
      toast.success("Tag updated successfully");
    },
    onError: () => toast.error("Error updating tag"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag deleted successfully");
    },
    onError: () => toast.error("Error deleting tag"),
  });

  const resetForm = () => {
    form.reset();
  };

  const handleEdit = (tag: any) => {
    setEditingId(tag.id);
    form.setFieldValue("name", tag.name);
    form.setFieldValue("slug", tag.slug);
    setIsAdding(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="font-semibold">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              #{row.getValue("name")}
            </span>
          </div>
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
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const tag = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleEdit(tag)}
                title="Edit"
              >
                <Pencil size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this tag?")) {
                    deleteMutation.mutate({ data: { id: tag.id } });
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
    [],
  );

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title="Tags"
        description="Manage your blog tags to help users find related content."
        icon={Tags}
        iconLabel="Taxonomies"
      >
        {!isAdding && !editingId && (
          <Button onClick={() => setIsAdding(true)} variant="default">
            <Plus className="mr-2 h-4 w-4" /> New Tag
          </Button>
        )}
      </DashboardHeader>

      {(isAdding || editingId) && (
        <section className="bg-card border shadow-sm rounded-xl p-8 space-y-6">
          <h2 className="text-2xl font-bold">
            {editingId ? "Edit Tag" : "Add New Tag"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <form.Field
                  name="name"
                  children={(field) => {
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
                          placeholder="e.g. React"
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
                          placeholder="e.g. react"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors as any} />
                        )}
                      </Field>
                    );
                  }}
                />
              </div>
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
        data={tags}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Filter tags..."
      />
    </DashboardPageContainer>
  );
}
