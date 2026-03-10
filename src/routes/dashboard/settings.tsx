import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { appSettings } from "#/db/schema";
import { useState, type FormEvent } from "react";
import { requireAdminSession } from "#/lib/admin-auth";
import { Button } from "#/components/ui/button";
import { Settings as SettingsIcon, Save, Info } from "lucide-react";
import { getAvailableThemes, applyThemeClasses } from "#/lib/theme-utils";
import { useEffect } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { z } from "zod";
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

const settingsSchema = z.object({
  blogName: z.string().min(1, "Publication Name is required"),
  blogDescription: z.string(),
  blogLogo: z.string(),
  fontFamily: z.string(),
  gaMeasurementId: z.string(),
  plausibleDomain: z.string(),
  stripePriceId: z.string(),
  resendApiKey: z.string(),
  newsletterSenderEmail: z.string(),
  twitterProfile: z.string(),
  githubProfile: z.string(),
  linkedinProfile: z.string(),
  themeVariant: z.string(),
});

type SettingsFormInput = z.infer<typeof settingsSchema>;

const getAppSettings = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession();
  const { db } = await import("#/db/index");
  const settings = await db.select().from(appSettings);

  // Convert array to a more useful object
  const settingsObj: Record<string, string> = {};
  settings.forEach((s: any) => {
    settingsObj[s.key] = s.value;
  });

  return {
    blogName: settingsObj["blogName"] || "VibeZine",
    blogDescription:
      settingsObj["blogDescription"] ||
      "A vibrant zine-style blog for creators.",
    blogLogo: settingsObj["blogLogo"] || "",
    fontFamily: settingsObj["fontFamily"] || "Inter",
    gaMeasurementId: settingsObj["gaMeasurementId"] || "",
    plausibleDomain: settingsObj["plausibleDomain"] || "",
    stripePriceId: settingsObj["stripePriceId"] || "",
    resendApiKey: settingsObj["resendApiKey"] || "",
    newsletterSenderEmail: settingsObj["newsletterSenderEmail"] || "",
    twitterProfile: settingsObj["twitterProfile"] || "",
    githubProfile: settingsObj["githubProfile"] || "",
    linkedinProfile: settingsObj["linkedinProfile"] || "",
    themeVariant: settingsObj["themeVariant"] || "default",
  };
});

const updateAppSettings = createServerFn({ method: "POST" })
  .inputValidator((input: SettingsFormInput) => input)
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
    await upsert("blogLogo", data.blogLogo);
    await upsert("fontFamily", data.fontFamily);
    await upsert("gaMeasurementId", data.gaMeasurementId);
    await upsert("plausibleDomain", data.plausibleDomain);
    await upsert("stripePriceId", data.stripePriceId);
    await upsert("resendApiKey", data.resendApiKey);
    await upsert("newsletterSenderEmail", data.newsletterSenderEmail);
    await upsert("twitterProfile", data.twitterProfile);
    await upsert("githubProfile", data.githubProfile);
    await upsert("linkedinProfile", data.linkedinProfile);
    await upsert("themeVariant", data.themeVariant);

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
      gaMeasurementId: initialSettings.gaMeasurementId,
      plausibleDomain: initialSettings.plausibleDomain,
      stripePriceId: initialSettings.stripePriceId,
      resendApiKey: initialSettings.resendApiKey,
      newsletterSenderEmail: initialSettings.newsletterSenderEmail,
      twitterProfile: initialSettings.twitterProfile,
      githubProfile: initialSettings.githubProfile,
      linkedinProfile: initialSettings.linkedinProfile,
      themeVariant: initialSettings.themeVariant,
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
            gaMeasurementId: value.gaMeasurementId.trim(),
            plausibleDomain: value.plausibleDomain.trim(),
            stripePriceId: value.stripePriceId.trim(),
            resendApiKey: value.resendApiKey.trim(),
            newsletterSenderEmail: value.newsletterSenderEmail.trim(),
            twitterProfile: value.twitterProfile.trim(),
            githubProfile: value.githubProfile.trim(),
            linkedinProfile: value.linkedinProfile.trim(),
          },
        });
        toast.success("Settings saved successfully!");
      } catch {
        toast.error("Failed to save settings. Please try again.");
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
            className="bg-card border shadow-sm rounded-xl p-6 sm:p-10 border-border/50 space-y-8"
          >
            <FieldGroup>
              <form.Field
                name="blogName"
                children={(field) => {
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
                        placeholder="e.g. VibeZine"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors as any} />
                      )}
                    </Field>
                  );
                }}
              />

              <form.Field
                name="blogDescription"
                children={(field) => (
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
              />

              <div className="pt-6 border-t border-border/10">
                <h3 className="text-sm font-black text-primary mb-6">
                  Branding & Style
                </h3>

                <div className="grid gap-6 sm:grid-cols-2">
                  <form.Field
                    name="blogLogo"
                    children={(field) => (
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
                  />

                  <form.Field
                    name="fontFamily"
                    children={(field) => (
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
                  />

                  <form.Field
                    name="themeVariant"
                    children={(field) => (
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
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-border/10">
                <h3 className="text-sm font-black text-primary mb-6">
                  Analytics Tracking
                </h3>

                <div className="grid gap-6 sm:grid-cols-2">
                  <form.Field
                    name="gaMeasurementId"
                    children={(field) => (
                      <Field>
                        <FieldLabel
                          htmlFor={field.name}
                          className="text-xs  text-foreground"
                        >
                          Google Analytics Measurement ID
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="G-XXXXXXXXXX"
                        />
                        <p className="text-[10px] text-muted-foreground ">
                          Requires a "G-" prefix
                        </p>
                      </Field>
                    )}
                  />

                  <form.Field
                    name="plausibleDomain"
                    children={(field) => (
                      <Field>
                        <FieldLabel
                          htmlFor={field.name}
                          className="text-xs  text-foreground"
                        >
                          Plausible Analytics Domain
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="yourdomain.com"
                        />
                        <p className="text-[10px] text-muted-foreground ">
                          Leaves out "https://"
                        </p>
                      </Field>
                    )}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-border/10">
                <h3 className="text-sm font-black text-primary mb-6">
                  Monetization (Stripe)
                </h3>
                <form.Field
                  name="stripePriceId"
                  children={(field) => (
                    <Field>
                      <FieldLabel
                        htmlFor={field.name}
                        className="text-xs  text-foreground"
                      >
                        Premium Plan Price ID
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="w-full font-mono"
                        placeholder="price_H5v..."
                      />
                      <p className="text-[10px] text-muted-foreground ">
                        Obtido no dashboard do Stripe
                      </p>
                    </Field>
                  )}
                />
              </div>

              <div className="pt-6 border-t border-border/10">
                <h3 className="text-sm font-black text-primary mb-6">
                  Email / Newsletter Configuration
                </h3>
                <div className="grid gap-6 sm:grid-cols-2">
                  <form.Field
                    name="resendApiKey"
                    children={(field) => (
                      <Field>
                        <FieldLabel
                          htmlFor={field.name}
                          className="text-xs  text-foreground"
                        >
                          Resend API Key
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="password"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full font-mono"
                          placeholder="re_XXXXXXXXXXXX"
                        />
                      </Field>
                    )}
                  />

                  <form.Field
                    name="newsletterSenderEmail"
                    children={(field) => (
                      <Field>
                        <FieldLabel
                          htmlFor={field.name}
                          className="text-xs  text-foreground"
                        >
                          Sender Email
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="newsletter@seudominio.com"
                        />
                        <p className="text-[10px] text-muted-foreground ">
                          Must be verified in Resend
                        </p>
                      </Field>
                    )}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-border/10">
                <h3 className="text-sm font-black text-primary mb-6">
                  Social Links & Feeds
                </h3>
                <div className="grid gap-6 sm:grid-cols-2">
                  <form.Field
                    name="twitterProfile"
                    children={(field) => (
                      <Field>
                        <FieldLabel
                          htmlFor={field.name}
                          className="text-xs  text-foreground"
                        >
                          Twitter Profile URL
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="https://twitter.com/seuperfil"
                        />
                      </Field>
                    )}
                  />

                  <form.Field
                    name="githubProfile"
                    children={(field) => (
                      <Field>
                        <FieldLabel
                          htmlFor={field.name}
                          className="text-xs  text-foreground"
                        >
                          GitHub Profile URL
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="https://github.com/seuperfil"
                        />
                      </Field>
                    )}
                  />

                  <form.Field
                    name="linkedinProfile"
                    children={(field) => (
                      <Field>
                        <FieldLabel
                          htmlFor={field.name}
                          className="text-xs  text-foreground"
                        >
                          LinkedIn Profile URL
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="https://linkedin.com/in/seuperfil"
                        />
                      </Field>
                    )}
                  />

                  <div className="space-y-2">
                    <label className="text-xs  text-foreground">
                      RSS Feed URL
                    </label>
                    <div className="flex h-11 items-center rounded-xl border border-border bg-muted/20 px-5 text-sm font-mono font-bold text-muted-foreground">
                      /rss.xml
                    </div>
                    <p className="text-[10px] text-muted-foreground ">
                      Auto-generated for your readers
                    </p>
                  </div>
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
          <div className="border shadow-sm rounded-lg bg-muted/50 p-6 border-border/30">
            <h3 className=" tracking-tighter text-foreground mb-4 flex items-center gap-2">
              <Info size={18} className="text-primary" />
              Metadata Tip
            </h3>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              These settings affect your blog's public appearance in the header,
              footer, and SEO tags. Ensure your description is concise but
              descriptive to help with search engine rankings.
            </p>
          </div>
        </aside>
      </div>
    </DashboardPageContainer>
  );
}
