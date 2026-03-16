import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Library, Sparkles } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { PageEditorScreen } from "#/components/dashboard/page-editor-screen";
import { normalizePageSubmission } from "#/lib/editorial-form-utils";
import { buildTemplatePageValues } from "#/lib/site-presets";
import { Button } from "#/components/ui/button";
import { getLaunchTemplateCatalog } from "#/server/setup-actions";
import { createPage } from "#/server/page-actions";

export const Route = createFileRoute("/dashboard/pages/new")({
  validateSearch: z.object({
    template: z
      .enum([
        "home",
        "about",
        "pricing",
        "contact",
        "newsletterLanding",
        "membersOnlyArchive",
      ])
      .optional(),
    preset: z
      .enum([
        "creator-journal",
        "magazine-newsletter",
        "premium-publication",
      ])
      .optional(),
  }),
  loaderDeps: ({ search }) => ({
    template: search.template,
    preset: search.preset,
  }),
  loader: async ({ deps }) => {
    const catalog = await getLaunchTemplateCatalog();
    return {
      catalog,
      template:
        deps.template
          ? buildTemplatePageValues({
              presetKey: deps.preset ?? catalog.currentPresetKey,
              templateKey: deps.template,
              blogName: catalog.blogName,
              blogDescription: catalog.blogDescription,
            })
          : null,
      selectedTemplate: deps.template ?? null,
      selectedPreset: deps.preset ?? catalog.currentPresetKey,
    };
  },
  component: NewPagePage,
});

function NewPagePage() {
  const navigate = useNavigate();
  const { catalog, template, selectedTemplate, selectedPreset } = Route.useLoaderData();
  const search = Route.useSearch();

  return (
    <>
      {!selectedTemplate ? (
        <div className="mb-8 rounded-xl border border-border/50 bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-xl font-black tracking-tight text-foreground">
                Start from a launch template
              </h2>
              <p className="text-sm text-muted-foreground">
                Pick a template and preset to avoid starting from a blank page.
              </p>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-3">
            {catalog.presets.map((preset) => (
              <Button
                key={preset.key}
                asChild
                variant={selectedPreset === preset.key ? "default" : "outline"}
              >
                <Link
                  to="/dashboard/pages/new"
                  search={{
                    ...search,
                    preset: preset.key,
                  }}
                >
                  {preset.label}
                </Link>
              </Button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {catalog.templates.map((entry) => (
              <Link
                key={entry.key}
                to="/dashboard/pages/new"
                search={{
                  template: entry.key,
                  preset: selectedPreset,
                }}
                className="rounded-xl border border-border/50 bg-background p-5 no-underline transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                  {entry.label}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {entry.description}
                </p>
                <p className="mt-4 font-mono text-xs text-muted-foreground">/{entry.slug}</p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <PageEditorScreen
        title={selectedTemplate ? "New Page from Template" : "New Page"}
        description={
          selectedTemplate
            ? "Customize the template and publish when it feels right."
            : "Create a static page for your publication."
        }
        icon={Library}
        iconLabel="Static Content"
        initialValues={
          template ?? {
            title: "",
            slug: "",
            excerpt: "",
            content: "",
            metaTitle: "",
            metaDescription: "",
            ogImage: "",
            seoNoIndex: false,
            isPremium: false,
            teaserMode: "excerpt",
            status: "draft",
            isHome: false,
            useVisualBuilder: false,
          }
        }
        storageKey={`page-editor-${selectedTemplate ?? "blank"}`}
        submitLabel="Create Page"
        submitErrorMessage="Could not create page"
        onSubmit={async (values) => {
          await createPage({
            data: normalizePageSubmission(values),
          });
          toast.success("Page created successfully");
          await navigate({ to: "/dashboard/pages" });
        }}
        onCancel={() => void navigate({ to: "/dashboard/pages" })}
      />
    </>
  );
}
