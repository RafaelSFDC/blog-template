import { usePostHog } from "@posthog/react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { CreditCard, Download, LogOut, Save, Shield, Trash2, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { Field, FieldError, FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { captureClientEvent } from "#/lib/analytics-client";
import { authClient } from "#/lib/auth-client";
import { captureClientException, setClientSentryUser } from "#/lib/sentry-client";
import { getCurrentAuthorProfile, updateCurrentAuthorProfile } from "#/server/author-profile-actions";
import { getCurrentSubscriptionSummary } from "#/server/membership-actions";
import { deleteCurrentUserData, exportCurrentUserData } from "#/server/security/privacy";
import { checkAuthenticatedUserAccess } from "#/server/system/dashboard-access";

export const Route = createFileRoute("/_public/account")({
  beforeLoad: async () => {
    const result = await checkAuthenticatedUserAccess();
    if (!result.ok) {
      throw redirect({ to: "/auth/login" });
    }
  },
  loader: () => getCurrentSubscriptionSummary(),
  component: AccountPage,
});

function formatDate(value?: Date | string | null) {
  if (!value) return "Not available";
  return new Date(value).toLocaleDateString();
}

function formatMoney(amount?: number | null, currency = "usd") {
  if (!amount) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function getMembershipTimeline(input: {
  effectiveStatus?: string | null;
  currentPeriodEnd?: Date | string | null;
  gracePeriodEndsAt?: Date | string | null;
}) {
  if (input.effectiveStatus === "past_due" && input.gracePeriodEndsAt) {
    return {
      label: "Resolve by",
      value: formatDate(input.gracePeriodEndsAt),
    };
  }

  if ((input.effectiveStatus === "active" || input.effectiveStatus === "canceled") && input.currentPeriodEnd) {
    return {
      label: input.effectiveStatus === "canceled" ? "Access ends" : "Renews on",
      value: formatDate(input.currentPeriodEnd),
    };
  }

  if (input.effectiveStatus === "expired") {
    return {
      label: "Status",
      value: "Premium access has ended",
    };
  }

  return {
    label: "Status",
    value: "Upgrade whenever the publication proves valuable",
  };
}

function AccountPage() {
  const { data: session } = authClient.useSession();
  const { subscription, plans, retention, hasBillingPortal } = Route.useLoaderData();
  type PricingPlan = (typeof plans)[number];
  const posthog = usePostHog();
  const [savingAuthorProfile, setSavingAuthorProfile] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const authorProfileForm = useForm({
    defaultValues: {
      publicAuthorSlug: session?.user?.name ? session.user.name.toLowerCase().replace(/\s+/g, "-") : "",
      authorHeadline: "",
      authorBio: "",
      authorSeoTitle: "",
      authorSeoDescription: "",
    },
    onSubmit: async ({ value }) => {
      try {
        setSavingAuthorProfile(true);
        await updateCurrentAuthorProfile({ data: value });
        toast.success("Public author profile updated.");
      } catch (error) {
        captureClientException(error, {
          tags: {
            area: "account",
            flow: "author-profile-update",
          },
        });
        toast.error(error instanceof Error ? error.message : "Failed to update public author profile.");
      } finally {
        setSavingAuthorProfile(false);
      }
    },
  });

  useEffect(() => {
    void getCurrentAuthorProfile().then((profile) => {
      authorProfileForm.setFieldValue("publicAuthorSlug", profile.publicAuthorSlug || "");
      authorProfileForm.setFieldValue("authorHeadline", profile.authorHeadline || "");
      authorProfileForm.setFieldValue("authorBio", profile.authorBio || "");
      authorProfileForm.setFieldValue("authorSeoTitle", profile.authorSeoTitle || "");
      authorProfileForm.setFieldValue("authorSeoDescription", profile.authorSeoDescription || "");
    }).catch(() => undefined);
  }, [authorProfileForm]);

  const profileForm = useForm({
    defaultValues: {
      name: session?.user?.name || "",
    },
    onSubmit: async ({ value }) => {
      try {
        await authClient.updateUser({
          name: value.name,
        });
        toast.success("Profile updated successfully!");
      } catch (error) {
        captureClientException(error, {
          tags: {
            area: "account",
            flow: "profile-update",
          },
        });
        toast.error("Failed to update profile.");
      }
    },
  });

  const passwordForm = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await authClient.changePassword({
          newPassword: value.newPassword,
          currentPassword: value.currentPassword,
          revokeOtherSessions: true,
        });
        toast.success("Password updated successfully!");
        passwordForm.reset();
      } catch (error) {
        captureClientException(error, {
          tags: {
            area: "account",
            flow: "password-change",
          },
        });
        const message = error instanceof Error ? error.message : "Failed to update password.";
        toast.error(message);
      }
    },
  });

  const handleLogout = async () => {
    setClientSentryUser(null);
    posthog.reset();
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/";
        },
      },
    });
  };

  async function openBillingPortal() {
    try {
      const response = await fetch("/api/stripe/billing-portal", {
        method: "POST",
        headers: {
          "X-Retention-State": retention.key,
        },
      });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Could not open billing portal");
      }

      window.location.href = data.url;
    } catch (error) {
      captureClientException(error, {
        tags: {
          area: "account",
          flow: "billing-portal",
        },
      });
      toast.error(error instanceof Error ? error.message : "Could not open billing portal.");
    }
  }

  async function handleExportData() {
    try {
      setExportingData(true);
      const payload = await exportCurrentUserData();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lumina-account-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Your account export is ready.");
    } catch (error) {
      captureClientException(error, {
        tags: {
          area: "account",
          flow: "privacy-export",
        },
      });
      toast.error(error instanceof Error ? error.message : "Could not export your data.");
    } finally {
      setExportingData(false);
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "This permanently deletes your account. Continue only if you are sure.",
    );
    if (!confirmed) return;

    try {
      setDeletingAccount(true);
      await deleteCurrentUserData();
      toast.success("Your account has been deleted.");
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/";
          },
        },
      });
    } catch (error) {
      captureClientException(error, {
        tags: {
          area: "account",
          flow: "privacy-delete",
        },
      });
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not delete your account.",
      );
    } finally {
      setDeletingAccount(false);
    }
  }

  const activePlan =
    subscription?.membershipPlan ?? plans.find((plan: PricingPlan) => plan.isDefault) ?? null;
  const activePrice = activePlan ? formatMoney(activePlan.priceCents, activePlan.currency) : null;
  const membershipTimeline = getMembershipTimeline({
    effectiveStatus: subscription?.effectiveStatus,
    currentPeriodEnd: subscription?.currentPeriodEnd,
    gracePeriodEndsAt: subscription?.gracePeriodEndsAt,
  });
  const showBillingPortal = hasBillingPortal;

  async function handleRetentionPrimaryAction() {
    captureClientEvent(posthog, "account_upgrade_prompt_clicked", {
      surface: "public_site",
      path: "/account",
      plan_slug: activePlan?.slug,
      source: retention.primaryAction.trackingSource,
      account_retention_state: retention.key,
    });

    if (retention.primaryAction.kind === "billing_portal") {
      await openBillingPortal();
      return;
    }

    if (retention.primaryAction.kind === "read") {
      window.location.href = "/blog";
      return;
    }

    const search = new URLSearchParams({
      source: retention.primaryAction.trackingSource,
    });
    if (activePlan?.slug) {
      search.set("plan", activePlan.slug);
    }
    window.location.href = `/pricing?${search.toString()}`;
  }

  return (
    <div className="page-wrap space-y-10 py-10 pb-20">
      <header className="rounded-md border bg-card p-8 shadow-sm sm:p-12">
        <div className="mb-4 flex items-center gap-2 text-primary">
          <User size={20} strokeWidth={3} />
          <p className="mb-0 font-black text-primary/80">Account</p>
        </div>
        <h1 className="display-title text-5xl text-foreground sm:text-7xl">
          Profile Settings
        </h1>
        <p className="mt-4 max-w-2xl text-lg font-medium leading-relaxed text-muted-foreground">
          Manage your personal identity, security credentials, and premium subscription.
        </p>
      </header>

      <section className="rounded-md border border-primary/20 bg-primary/5 p-8 shadow-sm sm:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-primary">
              Membership health
            </p>
            <h2 className="text-3xl font-black tracking-tight text-foreground">
              {retention.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              {retention.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full border border-primary/20 bg-card px-3 py-1 font-black text-primary">
                {retention.statusLabel}
              </span>
              <span className="rounded-full border border-border/70 bg-card px-3 py-1 font-medium text-muted-foreground">
                {membershipTimeline.label}: <span className="text-foreground">{membershipTimeline.value}</span>
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={() => void handleRetentionPrimaryAction()}>
              {retention.primaryAction.label}
            </Button>
            {retention.secondaryAction ? (
              <Button variant="outline" size="lg" asChild>
                <Link to={retention.secondaryAction.href}>{retention.secondaryAction.label}</Link>
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {retention.valueBullets.map((bullet) => (
            <div key={bullet} className="rounded-xl border border-border/60 bg-card px-4 py-4 text-sm font-medium text-foreground">
              {bullet}
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section className="rounded-md border bg-card p-6 shadow-sm sm:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                  Membership snapshot
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground">
                  {activePlan?.name || "Free Tier"}
                </h2>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
                  {retention.description}
                </p>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                  Recommended next move
                </p>
                <p className="mt-2 text-lg font-black text-foreground">
                  {retention.primaryAction.label}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                  Current status
                </p>
                <p className="mt-3 text-2xl font-black tracking-tight text-foreground">
                  {retention.statusLabel}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                  {membershipTimeline.label}
                </p>
                <p className="mt-3 text-2xl font-black tracking-tight text-foreground">
                  {membershipTimeline.value}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                  Plan value
                </p>
                <p className="mt-3 text-2xl font-black tracking-tight text-foreground">
                  {activePrice ? `${activePrice} / ${activePlan?.interval === "year" ? "year" : "month"}` : "Newsletter first"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-md border bg-card p-6 shadow-sm sm:p-10">
            <h2 className="mb-8 flex items-center gap-2 text-xl font-black text-foreground">
              <User size={20} className="text-primary" strokeWidth={3} />
              Personal Info
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                profileForm.handleSubmit();
              }}
              className="space-y-8"
            >
              <profileForm.Field
                name="name"
                validators={{
                  onChange: ({ value }) =>
                    !value
                      ? "Name is required"
                      : value.length < 2
                        ? "Name must be at least 2 characters"
                        : undefined,
                }}
              >
                {(field) => {
                  const isInvalid = !!field.state.meta.errors.length;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name} className="text-xs text-foreground">
                        Display Name
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Your full name"
                      />
                      {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                    </Field>
                  );
                }}
              </profileForm.Field>

              <Field className="opacity-90">
                <FieldLabel className="text-xs text-foreground">Email Address</FieldLabel>
                <Input value={session?.user?.email || ""} disabled />
                <p className="text-xs font-medium text-muted-foreground">
                  Email changes are handled through verification.
                </p>
              </Field>

              <div className="pt-4">
                <profileForm.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                  {([canSubmit, isSubmitting]) => (
                    <Button type="submit" variant="default" size="lg" disabled={!canSubmit || isSubmitting}>
                      <Save size={20} className="mr-3" strokeWidth={3} />
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                  )}
                </profileForm.Subscribe>
              </div>
            </form>
          </section>

          <section className="rounded-md border bg-card p-6 shadow-sm sm:p-10">
            <h2 className="mb-8 flex items-center gap-2 text-xl font-black text-foreground">
              <Shield size={20} className="text-primary" strokeWidth={3} />
              Security
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                passwordForm.handleSubmit();
              }}
              className="space-y-6"
            >
              <passwordForm.Field
                name="currentPassword"
                validators={{
                  onChange: ({ value }) => (!value ? "Current password is required" : undefined),
                }}
              >
                {(field) => {
                  const isInvalid = !!field.state.meta.errors.length;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name} className="text-xs text-foreground">
                        Current Password
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="••••••••"
                      />
                      {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                    </Field>
                  );
                }}
              </passwordForm.Field>

              <div className="grid gap-6 sm:grid-cols-2">
                <passwordForm.Field
                  name="newPassword"
                  validators={{
                    onChange: ({ value }) =>
                      !value
                        ? "New password is required"
                        : value.length < 8
                          ? "Min 8 characters"
                          : undefined,
                  }}
                >
                  {(field) => {
                    const isInvalid = !!field.state.meta.errors.length;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name} className="text-xs text-foreground">
                          New Password
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="password"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="••••••••"
                        />
                        {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                      </Field>
                    );
                  }}
                </passwordForm.Field>
                <passwordForm.Field
                  name="confirmPassword"
                  validators={{
                    onChange: ({ value, fieldApi }) => {
                      if (!value) return "Confirm your password";
                      if (value !== fieldApi.form.getFieldValue("newPassword")) {
                        return "Passwords do not match";
                      }
                      return undefined;
                    },
                  }}
                >
                  {(field) => {
                    const isInvalid = !!field.state.meta.errors.length;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name} className="text-xs text-foreground">
                          Confirm Password
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="password"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="••••••••"
                        />
                        {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                      </Field>
                    );
                  }}
                </passwordForm.Field>
              </div>

              <div className="pt-4">
                <passwordForm.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                  {([canSubmit, isSubmitting]) => (
                    <Button type="submit" variant="default" size="lg" disabled={!canSubmit || isSubmitting}>
                      <Save size={20} className="mr-3" strokeWidth={3} />
                      {isSubmitting ? "Updating..." : "Update Password"}
                    </Button>
                  )}
                </passwordForm.Subscribe>
              </div>
            </form>
          </section>

          <section className="rounded-md border bg-card p-6 shadow-sm sm:p-10">
            <h2 className="mb-8 flex items-center gap-2 text-xl font-black text-foreground">
              <Shield size={20} className="text-primary" strokeWidth={3} />
              Access Level
            </h2>
            <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/20 p-6">
              <div>
                <p className="mb-1 text-xs font-black text-muted-foreground">Authenticated As</p>
                <p className="text-2xl font-black tracking-tight text-foreground">
                  {session?.user?.role || "Reader"}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                <Shield size={24} />
              </div>
            </div>
          </section>

          <section className="rounded-md border bg-card p-6 shadow-sm sm:p-10">
            <h2 className="mb-8 flex items-center gap-2 text-xl font-black text-foreground">
              <User size={20} className="text-primary" strokeWidth={3} />
              Public Author Profile
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                authorProfileForm.handleSubmit();
              }}
              className="space-y-6"
            >
              <authorProfileForm.Field name="publicAuthorSlug">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name} className="text-xs text-foreground">
                      Public author slug
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="your-name"
                    />
                  </Field>
                )}
              </authorProfileForm.Field>

              <authorProfileForm.Field name="authorHeadline">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name} className="text-xs text-foreground">
                      Headline
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Reporter, editor, essayist"
                    />
                  </Field>
                )}
              </authorProfileForm.Field>

              <authorProfileForm.Field name="authorBio">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name} className="text-xs text-foreground">
                      Bio
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Short bio for your public archive page"
                    />
                  </Field>
                )}
              </authorProfileForm.Field>

              <authorProfileForm.Field name="authorSeoTitle">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name} className="text-xs text-foreground">
                      Author SEO title
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Optional override for the author page title"
                    />
                  </Field>
                )}
              </authorProfileForm.Field>

              <authorProfileForm.Field name="authorSeoDescription">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name} className="text-xs text-foreground">
                      Author SEO description
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Optional override for the author page description"
                    />
                  </Field>
                )}
              </authorProfileForm.Field>

              <Button type="submit" variant="outline" size="lg" disabled={savingAuthorProfile}>
                <Save size={20} className="mr-3" strokeWidth={3} />
                {savingAuthorProfile ? "Saving..." : "Save Author Profile"}
              </Button>
            </form>
          </section>
        </div>

        <aside className="space-y-8">
          <section className="rounded-md border border-secondary/20 bg-secondary/10 p-8 shadow-sm">
            <h3 className="mb-6 flex items-center gap-2 text-sm font-black text-foreground">
              <CreditCard size={18} className="text-primary" strokeWidth={3} />
              Membership
            </h3>
            <div className="mb-5">
              <p className="mb-1 text-sm font-bold tracking-wider text-muted-foreground">
                Current Plan
              </p>
              <p className="text-3xl font-black tracking-tighter text-foreground">
                {activePlan?.name || "Free Tier"}
              </p>
              {activePrice ? (
                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  {activePrice} / {activePlan?.interval === "year" ? "year" : "month"}
                </p>
              ) : null}
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Status: <span className="font-semibold text-foreground">{retention.statusLabel}</span></p>
              <p>{membershipTimeline.label}: <span className="font-semibold text-foreground">{membershipTimeline.value}</span></p>
            </div>
            <p className="mb-8 mt-6 text-sm font-medium leading-relaxed text-muted-foreground/80">
              Full-site entitlement unlocks every premium post and premium page.
            </p>
            <div className="space-y-3">
              <Button variant="default" className="w-full" onClick={() => void handleRetentionPrimaryAction()}>
                {retention.primaryAction.label}
              </Button>
              {retention.secondaryAction ? (
                <Button variant="outline" className="w-full" asChild>
                  <Link to={retention.secondaryAction.href}>{retention.secondaryAction.label}</Link>
                </Button>
              ) : null}
              {showBillingPortal && retention.primaryAction.kind !== "billing_portal" ? (
                <Button variant="ghost" className="w-full" onClick={() => void openBillingPortal()}>
                  Manage billing details
                </Button>
              ) : null}
            </div>
          </section>

          <section className="rounded-md border border-destructive/30 bg-destructive/10 p-8 shadow-sm">
            <h3 className="mb-6 text-sm font-black text-destructive">Session Management</h3>
            <Button
              variant="destructive"
              className="w-full justify-center gap-3"
              onClick={handleLogout}
            >
              <LogOut size={20} />
              Sign Out
            </Button>
          </section>

          <section className="rounded-md border bg-card p-8 shadow-sm">
            <h3 className="mb-6 text-sm font-black text-foreground">Privacy & Data</h3>
            <p className="mb-6 text-sm font-medium leading-relaxed text-muted-foreground">
              Export your account data as JSON or request immediate deletion if this account does not own editorial content.
            </p>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-center gap-3"
                onClick={() => void handleExportData()}
                disabled={exportingData}
              >
                <Download size={18} />
                {exportingData ? "Preparing export..." : "Export My Data"}
              </Button>
              <Button
                variant="destructive"
                className="w-full justify-center gap-3"
                onClick={() => void handleDeleteAccount()}
                disabled={deletingAccount}
              >
                <Trash2 size={18} />
                {deletingAccount ? "Deleting..." : "Delete My Account"}
              </Button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
