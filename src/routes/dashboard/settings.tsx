import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { appSettings } from "#/db/schema";
import { useState, type FormEvent } from "react";
import { requireAdminSession } from "#/lib/admin-auth";
import { Button } from "#/components/ui/button";
import {
  Settings as SettingsIcon,
  Save,
  Info,
  Trash2,
  Plus,
} from "lucide-react";
import { getAvailableThemes, applyThemeClasses } from "#/lib/theme-utils";
import { useEffect } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "#/components/ui/select";
import { toast } from "sonner";
import { settingsSchema } from "#/lib/cms-schema";

const getAppSettings = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession();
  const { db } = await import("#/db/index");
  const settings = await db.select().from(appSettings);

  // Convert array to a more useful object
  const settingsObj: Record<string, string> = {};
  settings.forEach((s: typeof appSettings.$inferSelect) => {
    settingsObj[s.key] = s.value;
  });

  let socialLinks: { platform: string; url: string }[] = [];
  try {
    socialLinks = settingsObj["socialLinks"]
      ? JSON.parse(settingsObj["socialLinks"])
      : [];
  } catch (e) {
    console.error("Failed to parse socialLinks", e);
  }

  // Backward compatibility migration
  if (socialLinks.length === 0) {
    if (settingsObj["twitterProfile"])
      socialLinks.push({
        platform: "x",
        url: settingsObj["twitterProfile"],
      });
    if (settingsObj["githubProfile"])
      socialLinks.push({
        platform: "github",
        url: settingsObj["githubProfile"],
      });
    if (settingsObj["linkedinProfile"])
      socialLinks.push({
        platform: "linkedin",
        url: settingsObj["linkedinProfile"],
      });
  }

  return {
    blogName: settingsObj["blogName"] || "Lumina",
    blogDescription:
      settingsObj["blogDescription"] || "An elegant premium blog for creators.",
    blogLogo: settingsObj["blogLogo"] || "",
    fontFamily: settingsObj["fontFamily"] || "Inter",
    themeVariant: settingsObj["themeVariant"] || "default",
    socialLinks,
  };
});

const updateAppSettings = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => settingsSchema.parse(input))
  .handler(async ({ data }) => {
    await requireAdminSession();
    const { db } = await import("#/db/index");

    const upsert = async (key: string, value: string) => {
      await db
        .insert(appSettings)
        .values({ key, value, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: appSettings.key,
          set: { value, updatedAt: new Date() },
        });
    };

    await upsert("blogName", data.blogName);
    await upsert("blogDescription", data.blogDescription);
    await upsert("blogLogo", data.blogLogo || "");
    await upsert("fontFamily", data.fontFamily);
    await upsert("themeVariant", data.themeVariant);
    await upsert("socialLinks", JSON.stringify(data.socialLinks));

    return { ok: true as const };
  });

export const Route = createFileRoute("/dashboard/settings")({
  loader: () => getAppSettings(),
  component: SettingsPage,
});

import { DashboardHeader } from "#/components/dashboard/Header";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";

function SettingsPage() {
  const initialSettings = Route.useLoaderData();
  const [saving, setSaving] = useState(false);

  const form = useForm({
    defaultValues: {
      blogName: initialSettings.blogName,
      blogDescription: initialSettings.blogDescription,
      blogLogo: initialSettings.blogLogo,
      fontFamily: initialSettings.fontFamily,
      themeVariant: initialSettings.themeVariant,
      socialLinks: initialSettings.socialLinks,
    },
    validators: {
      onChange: settingsSchema,
    },
    onSubmit: async ({ value }) => {
      setSaving(true);

      try {
        await updateAppSettings({
          data: {
            ...value,
            socialLinks: value.socialLinks.map((link) => ({
              ...link,
              url: link.url.trim(),
            })),
          },
        });
        toast.success("Settings saved successfully!");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to save settings. Please try again.",
        );
      } finally {
        setSaving(false);
      }
    },
  });

  const formThemeVariant = useStore(
    form.store,
    (state) => state.values.themeVariant,
  );

  useEffect(() => {
    applyThemeClasses(formThemeVariant);
  }, [formThemeVariant]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    form.handleSubmit();
  }

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title="Blog Settings"
        description="Manage your publication's identity and global configuration."
        icon={SettingsIcon}
        iconLabel="Configuration"
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="bg-card border shadow-sm rounded-md p-6 sm:p-10  space-y-8"
          >
            <FieldGroup>
              <h3 className="text-sm font-black text-primary ">
                Publication Identity
              </h3>

              <form.Field name="blogName">
                {(field) => {
                  const isInvalid = !!field.state.meta.errors.length;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel
                        htmlFor={field.name}
                        className="text-xs  text-foreground"
                      >
                        Publication Name
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g. Lumina"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="blogDescription">
                {(field) => (
                  <Field>
                    <FieldLabel
                      htmlFor={field.name}
                      className="text-xs  text-foreground"
                    >
                      Short Bio / Description
                    </FieldLabel>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="min-h-32"
                      placeholder="Tell your readers what this blog is about..."
                    />
                  </Field>
                )}
              </form.Field>

              <div className="pt-6 border-t border-border/10">
                <h3 className="text-sm font-black text-primary mb-6">
                  Branding & Style
                </h3>

                <div className="grid gap-6 sm:grid-cols-2">
                  <form.Field name="blogLogo">
                    {(field) => (
                      <Field>
                        <FieldLabel
                          htmlFor={field.name}
                          className="text-xs  text-foreground"
                        >
                          Logo URL
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="https://exemplo.com/logo.png"
                        />
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="fontFamily">
                    {(field) => (
                      <Field className="sm:col-span-2">
                        <FieldLabel
                          htmlFor={field.name}
                          className="text-xs  text-foreground"
                        >
                          Typography / Font Family
                        </FieldLabel>
                        <Select
                          value={field.state.value}
                          onValueChange={(val) => field.handleChange(val)}
                        >
                          <SelectTrigger
                            id={field.name}
                            className="w-full h-auto"
                          >
                            <SelectValue placeholder="Select a font family" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inter">
                              Modern (Inter)
                            </SelectItem>
                            <SelectItem value="Outfit">
                              Creative (Outfit)
                            </SelectItem>
                            <SelectItem value="Playfair Display">
                              Elegant (Playfair Display)
                            </SelectItem>
                            <SelectItem value="Space Grotesk">
                              Tech (Space Grotesk)
                            </SelectItem>
                            <SelectItem value="Bricolage Grotesque">
                              Expressive (Bricolage Grotesque)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="themeVariant">
                    {(field) => (
                      <Field className="sm:col-span-2">
                        <FieldLabel
                          htmlFor={field.name}
                          className="text-xs  text-foreground"
                        >
                          Theme Variant (Kataly Style)
                        </FieldLabel>
                        <Select
                          value={field.state.value}
                          onValueChange={(val) => field.handleChange(val)}
                        >
                          <SelectTrigger
                            id={field.name}
                            className="w-full h-auto"
                          >
                            <SelectValue placeholder="Select a theme variant" />
                          </SelectTrigger>
                          <SelectContent>
                            {["standard", "creative", "compact", "special"].map(
                              (group) => (
                                <SelectGroup key={group}>
                                  <div className="px-2 py-1.5 text-xs  text-muted-foreground bg-muted/30">
                                    {group}
                                  </div>
                                  {getAvailableThemes()
                                    .filter((t) => t.group === group)
                                    .map((theme) => (
                                      <SelectItem
                                        key={theme.variant}
                                        value={`theme-${theme.variant}`}
                                        className="font-bold"
                                      >
                                        {theme.name}
                                      </SelectItem>
                                    ))}
                                </SelectGroup>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  </form.Field>
                </div>
              </div>

              <div className="pt-6 border-t border-border/10">
                <h3 className="text-sm font-black text-primary mb-6">
                  Social Links & Feeds
                </h3>
                <div className="space-y-6">
                  <form.Field name="socialLinks" mode="array">
                    {(field) => (
                      <div className="space-y-4">
                        {field.state.value.map((_, i) => (
                          <div
                            key={i}
                            className="flex flex-col sm:flex-row gap-4 p-4 border rounded-xl bg-muted/20 items-end"
                          >
                            <form.Field name={`socialLinks[${i}].platform`}>
                              {(subField) => (
                                <Field className="flex-1 w-full">
                                  <FieldLabel className="text-xs text-foreground">
                                    Platform
                                  </FieldLabel>
                                  <Select
                                    value={subField.state.value}
                                    onValueChange={(val) =>
                                      subField.handleChange(val)
                                    }
                                  >
                                    <SelectTrigger className="w-full h-auto">
                                      <SelectValue placeholder="Social Media" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="twitter">
                                        X (Twitter)
                                      </SelectItem>
                                      <SelectItem value="github">
                                        GitHub
                                      </SelectItem>
                                      <SelectItem value="linkedin">
                                        LinkedIn
                                      </SelectItem>
                                      <SelectItem value="instagram">
                                        Instagram
                                      </SelectItem>
                                      <SelectItem value="youtube">
                                        YouTube
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </Field>
                              )}
                            </form.Field>
                            <form.Field name={`socialLinks[${i}].url`}>
                              {(subField) => (
                                <Field className="flex-2 w-full">
                                  <FieldLabel className="text-xs text-foreground">
                                    URL
                                  </FieldLabel>
                                  <Input
                                    value={subField.state.value}
                                    onBlur={subField.handleBlur}
                                    onChange={(e) =>
                                      subField.handleChange(e.target.value)
                                    }
                                    placeholder="https://..."
                                    className="h-auto"
                                  />
                                </Field>
                              )}
                            </form.Field>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive h-10 w-10 shrink-0"
                              onClick={() => field.removeValue(i)}
                            >
                              <Trash2 size={20} />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full bg-background border-dashed border-2 hover:border-primary hover:text-primary rounded-xl"
                          onClick={() =>
                            field.pushValue({ platform: "twitter", url: "" })
                          }
                        >
                          <Plus size={20} className="mr-2" />
                          Add New Link
                        </Button>
                      </div>
                    )}
                  </form.Field>
                </div>
              </div>
            </FieldGroup>

            <div className="pt-4 border-t-2 border-border/10">
              <Button
                type="submit"
                disabled={saving}
                variant="default"
                size="lg"
                className="shadow-sm"
              >
                <Save size={20} className="mr-2" strokeWidth={3} />
                <span className="">
                  {saving ? "Saving..." : "Save Configuration"}
                </span>
              </Button>
            </div>
          </form>
        </div>

        <aside className="space-y-6">
          <div className="border shadow-sm rounded-md bg-muted/50 p-6 border-border/30">
            <h3 className=" tracking-tighter text-foreground mb-4 flex items-center gap-2">
              <Info size={18} className="text-primary" />
              Metadata Tip
            </h3>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              These settings affect your blog&apos;s public appearance in the
              header, footer, and SEO tags. Ensure your description is concise
              but descriptive to help with search engine rankings.
            </p>
          </div>
        </aside>
      </div>
    </DashboardPageContainer>
  );
}
