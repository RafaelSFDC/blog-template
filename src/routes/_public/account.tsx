import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { authClient } from "#/lib/auth-client";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { User, Shield, CreditCard, LogOut, Save } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { usePostHog } from "@posthog/react";

const checkAuth = createServerFn({ method: "GET" }).handler(async () => {
  const { getAuthSession } = await import("#/lib/admin-auth");
  const session = await getAuthSession();
  if (!session?.user) {
    return { ok: false as const };
  }
  return { ok: true as const };
});

export const Route = createFileRoute("/_public/account")({
  beforeLoad: async () => {
    const result = await checkAuth();
    if (!result.ok) {
      throw redirect({ to: "/auth/login" });
    }
  },
  component: AccountPage,
});

import { Field, FieldError, FieldLabel } from "#/components/ui/field";

function AccountPage() {
  const { data: session } = authClient.useSession();
  const posthog = usePostHog();

  const profileForm = useForm({
    defaultValues: {
      name: session?.user?.name || "",
    },
    onSubmit: async ({ value }) => {
      try {
        await authClient.updateUser({
          name: value.name,
        });
        posthog.capture("profile_updated", { name: value.name });
        toast.success("Profile updated successfully!");
      } catch (error) {
        posthog.captureException(error);
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
        posthog.capture("password_changed");
        toast.success("Password updated successfully!");
        passwordForm.reset();
      } catch (error: any) {
        posthog.captureException(error);
        toast.error(error.message || "Failed to update password.");
      }
    },
  });

  const handleLogout = async () => {
    posthog.capture("user_signed_out");
    posthog.reset();
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/";
        },
      },
    });
  };

  return (
    <div className="page-wrap space-y-10 py-10 pb-20">
      <header className="bg-card border shadow-sm rounded-md p-8 sm:p-12">
        <div className="mb-4 flex items-center gap-2 text-primary">
          <User size={20} strokeWidth={3} />
          <p className="island-kicker mb-0 font-black  text-primary/80">
            Account
          </p>
        </div>
        <h1 className="display-title text-5xl text-foreground sm:text-7xl">
          Profile Settings
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground font-medium leading-relaxed">
          Manage your personal identity, security credentials, and premium
          subscription.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Section */}
          <section className="bg-card border shadow-sm rounded-md p-6 sm:p-10">
            <h2 className="text-xl font-black  text-foreground mb-8 flex items-center gap-2">
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
                children={(field) => {
                  const isInvalid = !!field.state.meta.errors.length;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel
                        htmlFor={field.name}
                        className="text-xs text-foreground"
                      >
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
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors as any} />
                      )}
                    </Field>
                  );
                }}
              />

              <Field className="opacity-90">
                <FieldLabel className="text-xs text-foreground">
                  Email Address
                </FieldLabel>
                <Input value={session?.user?.email || ""} disabled />
                <p className="text-xs text-muted-foreground font-medium">
                  Note: Email updates are handled via security verification
                </p>
              </Field>

              <div className="pt-4">
                <profileForm.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                  children={([canSubmit, isSubmitting]) => (
                    <Button
                      type="submit"
                      variant="default"
                      size="lg"
                      disabled={!canSubmit || isSubmitting}
                    >
                      <Save size={20} className="mr-3" strokeWidth={3} />
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                  )}
                />
              </div>
            </form>
          </section>

          {/* Security / Password Section */}
          <section className="bg-card border shadow-sm rounded-md p-6 sm:p-10">
            <h2 className="text-xl font-black  text-foreground mb-8 flex items-center gap-2">
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
                  onChange: ({ value }) =>
                    !value ? "Current password is required" : undefined,
                }}
                children={(field) => {
                  const isInvalid = !!field.state.meta.errors.length;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel
                        htmlFor={field.name}
                        className="text-xs text-foreground"
                      >
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
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors as any} />
                      )}
                    </Field>
                  );
                }}
              />

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
                  children={(field) => {
                    const isInvalid = !!field.state.meta.errors.length;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel
                          htmlFor={field.name}
                          className="text-xs text-foreground"
                        >
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
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors as any} />
                        )}
                      </Field>
                    );
                  }}
                />
                <passwordForm.Field
                  name="confirmPassword"
                  validators={{
                    onChange: ({ value, fieldApi }) => {
                      if (!value) return "Confirm your password";
                      if (value !== fieldApi.form.getFieldValue("newPassword"))
                        return "Passwords do not match";
                      return undefined;
                    },
                  }}
                  children={(field) => {
                    const isInvalid = !!field.state.meta.errors.length;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel
                          htmlFor={field.name}
                          className="text-xs text-foreground"
                        >
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
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors as any} />
                        )}
                      </Field>
                    );
                  }}
                />
              </div>

              <div className="pt-4">
                <passwordForm.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                  children={([canSubmit, isSubmitting]) => (
                    <Button
                      type="submit"
                      variant="default"
                      size="lg"
                      disabled={!canSubmit || isSubmitting}
                    >
                      <Save size={20} className="mr-3" strokeWidth={3} />
                      {isSubmitting ? "Updating..." : "Update Password"}
                    </Button>
                  )}
                />
              </div>
            </form>
          </section>

          {/* Security / Role Section */}
          <section className="bg-card border shadow-sm rounded-md p-6 sm:p-10">
            <h2 className="text-xl font-black  text-foreground mb-8 flex items-center gap-2">
              <Shield size={20} className="text-primary" strokeWidth={3} />
              Access Level
            </h2>
            <div className="flex items-center justify-between p-6 rounded-2xl border border-border bg-muted/20">
              <div>
                <p className="text-xs font-black  text-muted-foreground mb-1">
                  Authenticated As
                </p>
                <p className="text-2xl font-black text-foreground tracking-tight">
                  {session?.user?.role || "Reader"}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Shield size={24} />
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          {/* Subscription Section */}
          <section className="border shadow-sm rounded-md p-8 bg-secondary/10 border-secondary/20">
            <h3 className="font-black  text-foreground mb-6 flex items-center gap-2 text-sm">
              <CreditCard size={18} className="text-primary" strokeWidth={3} />
              Subscription
            </h3>
            <div className="mb-8">
              <p className="text-sm font-bold text-muted-foreground mb-1 tracking-wider">
                Current Plan
              </p>
              <p className="text-3xl font-black text-foreground tracking-tighter">
                Free Tier
              </p>
            </div>
            <p className="text-sm font-medium text-muted-foreground/80 mb-8 leading-relaxed">
              Unlock exclusive deep-dives, early access stories, and a premium
              ad-free experience.
            </p>
            <Button variant="outline" className="w-full">
              Upgrade Now
            </Button>
          </section>

          {/* Danger Zone */}
          <section className="border shadow-sm rounded-md p-8 border-destructive/30 bg-destructive/10">
            <h3 className="font-black  text-destructive mb-6 text-sm">
              Session Management
            </h3>
            <Button
              variant="destructive"
              className="w-full justify-center gap-3"
              onClick={handleLogout}
            >
              <LogOut size={20} />
              Sign Out
            </Button>
          </section>
        </aside>
      </div>
    </div>
  );
}
