import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { Button } from "#/components/ui/button";
import { DashboardHeader } from "#/components/dashboard/Header";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { SetupIncompleteNotice } from "#/components/dashboard/setup-incomplete-notice";
import {
  Settings as SettingsIcon,
  Save,
  Info,
  Trash2,
  Plus,
} from "lucide-react";
import { getAvailableThemes, applyThemeClasses } from "#/lib/theme-utils";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { Switch } from "#/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "#/components/ui/select";
import { toast } from "sonner";
import {
  normalizeSettingsFormValues,
  settingsFormSchema,
} from "#/lib/settings-form";
import {
  getDashboardSettings,
  updateDashboardSettings,
} from "#/server/system/settings";
import { getSetupStatusForDashboard } from "#/server/setup-actions";
import type { SetupStatus } from "#/types/system";

export const Route = createFileRoute("/dashboard/settings")({
  loader: async () => {
    const [settingsData, setup] = await Promise.all([
      getDashboardSettings(),
      getSetupStatusForDashboard(),
    ]);
    return {
      ...settingsData,
      setup,
    };
  },
  component: SettingsPage,
});

function SettingsPage() {
  const { settings: initialSettings, securityAudit, setup } = Route.useLoaderData() as Awaited<
    ReturnType<typeof getDashboardSettings>
  > & {
    setup: SetupStatus | null;
  };
  const [saving, setSaving] = useState(false);

  const form = useForm({
    defaultValues: {
      blogName: initialSettings.blogName,
      blogDescription: initialSettings.blogDescription,
      blogLogo: initialSettings.blogLogo,
      fontFamily: initialSettings.fontFamily,
      themeVariant: initialSettings.themeVariant,
      siteUrl: initialSettings.siteUrl,
      defaultMetaTitle: initialSettings.defaultMetaTitle,
      defaultMetaDescription: initialSettings.defaultMetaDescription,
      defaultOgImage: initialSettings.defaultOgImage,
      twitterHandle: initialSettings.twitterHandle,
      stripeMonthlyPriceId: initialSettings.stripeMonthlyPriceId,
      stripeAnnualPriceId: initialSettings.stripeAnnualPriceId,
      newsletterSenderEmail: initialSettings.newsletterSenderEmail,
      doubleOptInEnabled: initialSettings.doubleOptInEnabled,
      membershipGracePeriodDays: initialSettings.membershipGracePeriodDays,
      robotsIndexingEnabled: initialSettings.robotsIndexingEnabled,
      socialLinks: initialSettings.socialLinks,
    },
    validators: {
      onChange: settingsFormSchema,
    },
    onSubmit: async ({ value }) => {
      setSaving(true);

      try {
        await updateDashboardSettings({
          data: normalizeSettingsFormValues(value),
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

      <SetupIncompleteNotice setup={setup} area="settings" />

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
                  SEO & Discovery
                </h3>

                <div className="grid gap-6">
                  <form.Field name="siteUrl">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name} className="text-xs text-foreground">
                          Public Site URL
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="https://blog.example.com"
                        />
                        {field.state.meta.errors.length > 0 && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="defaultMetaTitle">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name} className="text-xs text-foreground">
                          Default Meta Title
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Optional default title for public pages"
                        />
                        {field.state.meta.errors.length > 0 && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="defaultMetaDescription">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name} className="text-xs text-foreground">
                          Default Meta Description
                        </FieldLabel>
                        <Textarea
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Default description for RSS, sitemap metadata and public pages."
                        />
                        {field.state.meta.errors.length > 0 && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )}
                  </form.Field>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <form.Field name="defaultOgImage">
                      {(field) => (
                        <Field>
                          <FieldLabel htmlFor={field.name} className="text-xs text-foreground">
                            Default OG Image
                          </FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="https://media.example.com/default-og.jpg"
                          />
                          {field.state.meta.errors.length > 0 && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      )}
                    </form.Field>

                    <form.Field name="twitterHandle">
                      {(field) => (
                        <Field>
                          <FieldLabel htmlFor={field.name} className="text-xs text-foreground">
                            Twitter / X Handle
                          </FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="@lumina"
                          />
                          {field.state.meta.errors.length > 0 && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      )}
                    </form.Field>
                  </div>

                  <form.Field name="robotsIndexingEnabled">
                    {(field) => (
                      <div className="flex items-center space-x-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                        <Switch
                          id={field.name}
                          checked={field.state.value}
                          onCheckedChange={(checked) => field.handleChange(checked === true)}
                        />
                        <label htmlFor={field.name} className="flex cursor-pointer flex-col">
                          <span className="text-sm font-bold text-foreground">
                            Allow search engine indexing
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Disable this for staging or private launches to output `noindex, nofollow`.
                          </span>
                        </label>
                      </div>
                    )}
                  </form.Field>
                </div>
              </div>

              <div className="pt-6 border-t border-border/10">
                <h3 className="text-sm font-black text-primary mb-6">
                  Membership Billing
                </h3>

                <div className="grid gap-6 sm:grid-cols-2">
                  <form.Field name="stripeMonthlyPriceId">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name} className="text-xs text-foreground">
                          Stripe Monthly Price ID
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="price_monthly_..."
                        />
                        {field.state.meta.errors.length > 0 ? (
                          <FieldError errors={field.state.meta.errors} />
                        ) : null}
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="stripeAnnualPriceId">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name} className="text-xs text-foreground">
                          Stripe Annual Price ID
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="price_annual_..."
                        />
                        {field.state.meta.errors.length > 0 ? (
                          <FieldError errors={field.state.meta.errors} />
                        ) : null}
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="membershipGracePeriodDays">
                    {(field) => (
                      <Field className="sm:col-span-2">
                        <FieldLabel htmlFor={field.name} className="text-xs text-foreground">
                          Grace Period (days)
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          min={0}
                          max={30}
                          value={String(field.state.value)}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(Number(e.target.value || 0))}
                          placeholder="3"
                        />
                        <p className="text-xs font-medium text-muted-foreground">
                          Members in `past_due` keep access until this window ends.
                        </p>
                        {field.state.meta.errors.length > 0 ? (
                          <FieldError errors={field.state.meta.errors} />
                        ) : null}
                      </Field>
                    )}
                  </form.Field>
                </div>
              </div>

              <div className="pt-6 border-t border-border/10">
                <h3 className="text-sm font-black text-primary mb-6">
                  Newsletter Delivery
                </h3>

                <div className="grid gap-6 sm:grid-cols-2">
                  <form.Field name="newsletterSenderEmail">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name} className="text-xs text-foreground">
                          Sender Email
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="newsletter@example.com"
                        />
                        {field.state.meta.errors.length > 0 ? (
                          <FieldError errors={field.state.meta.errors} />
                        ) : null}
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="doubleOptInEnabled">
                    {(field) => (
                      <div className="flex items-center space-x-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                        <Switch
                          id={field.name}
                          checked={field.state.value}
                          onCheckedChange={(checked) => field.handleChange(checked === true)}
                        />
                        <label htmlFor={field.name} className="flex cursor-pointer flex-col">
                          <span className="text-sm font-bold text-foreground">
                            Enable double opt-in
                          </span>
                          <span className="text-xs text-muted-foreground">
                            New subscribers confirm by email before entering the active segment.
                          </span>
                        </label>
                      </div>
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
          {!securityAudit.turnstileConfigured ? (
            <div className="border shadow-sm rounded-md bg-destructive/10 p-6 border-destructive/30">
              <h3 className="tracking-tighter text-destructive mb-4 flex items-center gap-2">
                <Info size={18} />
                Security Setup Required
              </h3>
              <p className="text-sm font-medium leading-relaxed text-destructive/90">
                Set both <code>TURNSTILE_SITE_KEY</code> and <code>TURNSTILE_SECRET_KEY</code>
                {" "}in the environment to protect public auth, contact, comment and newsletter flows.
              </p>
            </div>
          ) : null}
          {!securityAudit.securityContactConfigured ? (
            <div className="border shadow-sm rounded-md bg-amber-500/10 p-6 border-amber-500/30">
              <h3 className="tracking-tighter text-amber-700 mb-4 flex items-center gap-2">
                <Info size={18} />
                Recommended Security Contact
              </h3>
              <p className="text-sm font-medium leading-relaxed text-amber-800">
                Add <code>SECURITY_CONTACT_EMAIL</code> to your environment so the team has a clear
                incident contact for abuse and compliance requests.
              </p>
            </div>
          ) : null}
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
