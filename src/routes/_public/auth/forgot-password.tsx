import { createFileRoute, Link } from "@tanstack/react-router";
import { authClient } from "#/lib/auth-client";
import { Button } from "#/components/ui/button";
import { Mail, ArrowLeft, KeyRound, Lock } from "lucide-react";
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

export const Route = createFileRoute("/_public/auth/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const form = useForm({
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await authClient.requestPasswordReset({
          email: value.email,
          redirectTo: window.location.origin + "/auth/reset-password",
        });
        setSubmittedEmail(value.email);
        setSuccess(true);
      } catch (err: any) {
        const msg =
          err.message || "Failed to send reset email. Please try again.";
        toast.error(msg);
      }
    },
  });

  if (success) {
    return (
      <div className="space-y-6 text-center animate-in fade-in zoom-in duration-500">
        <IconBox icon={Lock} />
        <h2 className="text-3xl font-black tracking-tight text-foreground">
          Check your email
        </h2>
        <p className="text-muted-foreground">
          We have sent a password reset link to{" "}
          <span className="font-bold text-foreground">{submittedEmail}</span>.
          Please check your inbox and spam folder.
        </p>
        <Button
          asChild
          variant="outline"
          className="w-full h-12 rounded-xl mt-4"
        >
          <Link to="/auth/login" className="no-underline">
            Return to Sign In
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
          Forgot Password?
        </h2>
        <p className="text-muted-foreground">
          No worries, we'll send you reset instructions.
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
          name="email"
          children={(field) => (
            <Field>
              <FieldLabel className="ml-1">Email</FieldLabel>
              <FieldContent>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"
                    size={18}
                  />
                  <Input
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10 h-12"
                    required
                  />
                </div>
                <FieldError errors={field.state.meta.errors} />
              </FieldContent>
            </Field>
          )}
        />

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              variant="default"
              size={"lg"}
              className="w-full rounded-md text-lg shadow-sm hover:shadow-md active:shadow-none transition-all mt-2"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Reset Password"}
            </Button>
          )}
        />
      </form>

      <div className="text-center pt-2">
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
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
