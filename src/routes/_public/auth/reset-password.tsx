import { createFileRoute, Link } from "@tanstack/react-router";
import { authClient } from "#/lib/auth-client";
import { Button } from "#/components/ui/button";
import { TurnstileField } from "#/components/security/turnstile-field";
import { KeyRound, Lock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "@tanstack/react-form";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { useState } from "react";
import { IconBox } from "#/components/IconBox";

export const Route = createFileRoute("/_public/auth/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || "",
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const [success, setSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      if (!token) {
        toast.error("Invalid or missing reset token.");
        return;
      }
      if (value.password !== value.confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }

      try {
        await authClient.resetPassword({
          newPassword: value.password,
          token: token,
          fetchOptions: {
            headers: {
              "x-turnstile-token": turnstileToken,
            },
          },
        } as Parameters<typeof authClient.resetPassword>[0]);
        setSuccess(true);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to reset password. The link may have expired.";
        toast.error(msg);
      }
    },
  });

  if (success) {
    return (
      <div className="space-y-6 text-center animate-in fade-in zoom-in duration-500">
        <IconBox icon={Lock} />
        <h2 className="text-3xl font-black tracking-tight text-foreground">
          Password Reset
        </h2>
        <p className="text-muted-foreground">
          Your password has been successfully reset. You can now sign in with
          your new password.
        </p>
        <Button
          asChild
          variant="default"
          className="w-full h-12 rounded-xl mt-4"
        >
          <Link to="/auth/login" className="no-underline">
            Go to Sign In
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2 text-primary">
          <KeyRound size={24} />
        </div>
        <h2 className="text-3xl font-black tracking-tight text-foreground">
          Set New Password
        </h2>
        <p className="text-muted-foreground">
          Choose a strong password for your account.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <form.Field
          name="password"
        >
          {(field) => (
            <Field>
              <FieldLabel className="ml-1">New Password</FieldLabel>
              <FieldContent>
                <Input
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="password"
                  placeholder="Min. 8 characters"
                  className="h-12"
                  required
                  minLength={8}
                />
                <FieldError errors={field.state.meta.errors} />
              </FieldContent>
            </Field>
          )}
        </form.Field>

        <form.Field
          name="confirmPassword"
        >
          {(field) => (
            <Field>
              <FieldLabel className="ml-1">Confirm New Password</FieldLabel>
              <FieldContent>
                <Input
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="password"
                  placeholder="Repeat new password"
                  className="h-12"
                  required
                  minLength={8}
                />
                <FieldError errors={field.state.meta.errors} />
              </FieldContent>
            </Field>
          )}
        </form.Field>

        <TurnstileField
          action="reset_password"
          value={turnstileToken}
          onTokenChange={setTurnstileToken}
        />

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              variant="default"
              className="w-full h-12 rounded-xl text-lg font-black shadow-sm hover:shadow-md active:shadow-none transition-all mt-2"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="text-center pt-2">
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-2 text-sm font-black text-muted-foreground hover:text-primary transition-colors group"
        >
          <ArrowLeft
            size={16}
            className="transition-transform group-hover:-translate-x-1"
          />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
