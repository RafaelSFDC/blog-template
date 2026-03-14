import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { authClient } from "#/lib/auth-client";
import { isRegistrationLocked } from "#/lib/registration";
import { Button } from "#/components/ui/button";
import { Mail, User, Lock } from "lucide-react";
import { SocialLogin } from "#/components/auth/social-login";
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
import { usePostHog } from "@posthog/react";

const getRegistrationStatus = createServerFn({ method: "GET" }).handler(
  async () => {
    return {
      locked: await isRegistrationLocked(),
    };
  },
);

const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const { getAuthSession } = await import("#/lib/admin-auth");
  return await getAuthSession();
});

export const Route = createFileRoute("/_public/auth/register")({
  beforeLoad: async () => {
    const session = await getSession();
    if (session) {
      throw redirect({ to: "/dashboard" });
    }
  },
  loader: () => getRegistrationStatus(),
  component: RegisterPage,
});

function RegisterPage() {
  const { locked } = Route.useLoaderData();
  const [success, setSuccess] = useState(false);
  const posthog = usePostHog();

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      if (locked) return;
      try {
        await authClient.signUp.email({
          email: value.email,
          password: value.password,
          name: value.name,
          callbackURL: "/dashboard",
        });
        posthog.identify(value.email, { email: value.email, name: value.name });
        posthog.capture("user_signed_up", { method: "email" });
        setSuccess(true);
      } catch (err) {
        posthog.captureException(err);
        const msg =
          err instanceof Error ? err.message : "Failed to create account. Please try again.";
        toast.error(msg);
      }
    },
  });

  if (locked) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
          <Lock size={32} className="text-muted-foreground" />
        </div>
        <h2 className="text-3xl font-black tracking-tight text-foreground">
          Registration Closed
        </h2>
        <p className="text-muted-foreground">
          New registrations are currently disabled by the administrator. If you
          already have an account, please sign in.
        </p>
        <Button
          asChild
          variant="default"
          className="w-full h-12 rounded-xl mt-4"
        >
          <Link to="/auth/login" className="no-underline">
            Sign In Instead
          </Link>
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="mx-auto w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mb-4">
          <div className="text-secondary text-2xl font-black">✓</div>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-foreground">
          Account Created!
        </h2>
        <p className="text-muted-foreground">
          Your account has been successfully created. Redirecting you to the
          dashboard...
        </p>
        <Button
          asChild
          variant="default"
          className="w-full h-12 rounded-xl mt-4"
        >
          <Link to="/dashboard" className="no-underline">
            Go to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-foreground">
          Create your Lumina account
        </h2>
        <p className="text-muted-foreground">
          Start publishing, managing, and growing your editorial workflow.
        </p>
      </div>

      <SocialLogin />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground font-bold tracking-widest">
            Or sign up with email
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
          name="name"
        >
          {(field) => (
            <Field>
              <FieldLabel className="ml-1">Full Name</FieldLabel>
              <FieldContent>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"
                    size={18}
                  />
                  <Input
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    type="text"
                    placeholder="John Doe"
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
              <FieldLabel className="ml-1">Password</FieldLabel>
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

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              variant="default"
              size={"lg"}
              className="w-full  rounded-md text-lg shadow-sm hover:shadow-md active:shadow-none transition-all mt-2"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="text-center pt-2">
        <p className="text-sm text-muted-foreground font-medium">
          Already have an account?{" "}
          <Link
            to="/auth/login"
            className="text-primary font-black hover:underline decoration-2 underline-offset-4"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
