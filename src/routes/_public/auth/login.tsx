import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { authClient } from "#/lib/auth-client";
import { Button } from "#/components/ui/button";
import { Mail } from "lucide-react";
import { SocialLogin } from "#/components/auth/social-login";
import { toast } from "sonner";
import { createServerFn } from "@tanstack/react-start";
import { useForm } from "@tanstack/react-form";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { usePostHog } from "@posthog/react";
import { captureClientException } from "#/lib/sentry-client";

const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const { getAuthSession } = await import("#/lib/admin-auth");
  return await getAuthSession();
});

export const Route = createFileRoute("/_public/auth/login")({
  beforeLoad: async () => {
    const session = await getSession();
    if (session) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const posthog = usePostHog();
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await authClient.signIn.email({
          email: value.email,
          password: value.password,
          callbackURL: "/dashboard",
        });
        posthog.identify(value.email, { email: value.email });
        posthog.capture("user_signed_in", { method: "email" });
      } catch (_err) {
        captureClientException(_err, {
          tags: {
            area: "auth",
            flow: "login",
          },
        });
        toast.error("Invalid email or password. Please try again.");
      }
    },
  });

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-foreground">
          Welcome Back
        </h2>
        <p className="text-muted-foreground">
          Enter your credentials to access your account
        </p>
      </div>

      <SocialLogin />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground font-bold tracking-widest">
            Or continue with
          </span>
        </div>
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
        >
          {(field) => (
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
        </form.Field>

        <form.Field
          name="password"
        >
          {(field) => (
            <Field>
              <div className="flex items-center justify-between ml-1">
                <FieldLabel>Password</FieldLabel>
                <Link
                  to="/auth/forgot-password"
                  className="text-xs font-bold text-primary hover:underline decoration-2 underline-offset-4"
                >
                  Forgot password?
                </Link>
              </div>
              <FieldContent>
                <Input
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  className="h-12"
                  required
                />
                <FieldError errors={field.state.meta.errors} />
              </FieldContent>
            </Field>
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              variant="default"
              size="lg"
              className="w-full rounded-md text-lg shadow-sm hover:shadow-md active:shadow-none transition-all"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="text-center pt-2">
        <p className="text-sm text-muted-foreground font-medium">
          Don&apos;t have an account?{" "}
          <Link
            to="/auth/register"
            className="text-primary font-black hover:underline decoration-2 underline-offset-4"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
