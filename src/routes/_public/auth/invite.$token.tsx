import { createFileRoute, Link } from "@tanstack/react-router";
import { authClient } from "#/lib/auth-client";
import { acceptInvitation, getInvitationByToken } from "#/server/invitation-actions";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Field, FieldContent, FieldError, FieldLabel } from "#/components/ui/field";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_public/auth/invite/$token")({
  loader: ({ params }) => getInvitationByToken({ data: { token: params.token } }),
  component: AcceptInvitationPage,
});

function AcceptInvitationPage() {
  const invitation = Route.useLoaderData();
  const { token } = Route.useParams();
  const { data: session } = authClient.useSession();
  const [accepting, setAccepting] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      email: invitation.email,
      password: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await authClient.signUp.email({
          email: invitation.email,
          password: value.password,
          name: value.name,
          callbackURL: window.location.href,
        });
        toast.success("Account created. You can accept the invitation now.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not create account");
      }
    },
  });

  async function handleAccept() {
    try {
      setAccepting(true);
      await acceptInvitation({ data: { token } });
      toast.success("Invitation accepted. Your role has been updated.");
      window.location.href = "/dashboard";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not accept invitation");
    } finally {
      setAccepting(false);
    }
  }

  if (invitation.revokedAt) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-black text-foreground">Invitation revoked</h2>
        <p className="text-muted-foreground">This invitation is no longer valid.</p>
      </div>
    );
  }

  if (invitation.acceptedAt) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-black text-foreground">Invitation already used</h2>
        <p className="text-muted-foreground">This invitation has already been accepted.</p>
        <Button asChild>
          <Link to="/auth/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  if (invitation.isExpired) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-black text-foreground">Invitation expired</h2>
        <p className="text-muted-foreground">Ask an administrator to send a new invitation.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-black tracking-tight text-foreground">
          Join the Lumina team
        </h2>
        <p className="text-muted-foreground">
          This invitation is for <strong>{invitation.email}</strong> as{" "}
          <strong>{invitation.role}</strong>.
        </p>
      </div>

      {session?.user ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            Signed in as <strong>{session.user.email}</strong>.
          </div>
          <Button
            type="button"
            className="w-full"
            disabled={accepting}
            onClick={() => void handleAccept()}
          >
            {accepting ? "Accepting..." : "Accept Invitation"}
          </Button>
          {session.user.email.toLowerCase() !== invitation.email.toLowerCase() ? (
            <p className="text-sm text-destructive">
              Sign in with the invited email to complete onboarding.
            </p>
          ) : null}
        </div>
      ) : (
        <>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              form.handleSubmit();
            }}
          >
            <form.Field name="name">
              {(field) => (
                <Field>
                  <FieldLabel>Full Name</FieldLabel>
                  <FieldContent>
                    <Input
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      placeholder="Your name"
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </FieldContent>
                </Field>
              )}
            </form.Field>

            <form.Field name="email">
              {(field) => (
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <FieldContent>
                    <Input value={field.state.value} disabled />
                  </FieldContent>
                </Field>
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <Field>
                  <FieldLabel>Password</FieldLabel>
                  <FieldContent>
                    <Input
                      value={field.state.value}
                      type="password"
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      minLength={8}
                      placeholder="At least 8 characters"
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </FieldContent>
                </Field>
              )}
            </form.Field>

            <Button type="submit" className="w-full">
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a
              href={
                typeof window !== "undefined"
                  ? `/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`
                  : "/auth/login"
              }
              className="font-bold text-primary hover:underline"
            >
              Sign in instead
            </a>
          </p>
        </>
      )}
    </div>
  );
}
