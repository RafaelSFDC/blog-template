import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { authClient } from "#/lib/auth-client";
import { isRegistrationLocked } from "#/lib/registration";
import { Button } from "#/components/ui/button";
import { Mail, User, Lock } from "lucide-react";
import { SocialLogin } from "#/components/auth/social-login";
import { toast } from "sonner";

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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (locked) return;

    setIsPending(true);
    setError("");

    try {
      await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: "/dashboard",
      });
      setSuccess(true);
    } catch (err: any) {
      const msg = err.message || "Failed to create account. Please try again.";
      toast.error(msg);
      setError(msg);
    } finally {
      setIsPending(false);
    }
  };

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
          Join PlayfulPulse
        </h2>
        <p className="text-muted-foreground">
          Start your journey today with a new account
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

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-black uppercase tracking-wider text-muted-foreground ml-1">
            Full Name
          </label>
          <div className="relative">
            <User
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"
              size={18}
            />
            <input
              type="text"
              placeholder="John Doe"
              className="w-full bg-muted/30 border border-border rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-black uppercase tracking-wider text-muted-foreground ml-1">
            Email
          </label>
          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"
              size={18}
            />
            <input
              type="email"
              placeholder="name@example.com"
              className="w-full bg-muted/30 border border-border rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-black uppercase tracking-wider text-muted-foreground ml-1">
            Password
          </label>
          <input
            type="password"
            placeholder="Min. 8 characters"
            className="w-full bg-muted/30 border border-border rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="default"
          className="w-full h-12 rounded-xl text-lg font-black shadow-sm hover:shadow-md active:shadow-none transition-all mt-2"
          disabled={isPending}
        >
          {isPending ? "Creating Account..." : "Create Account"}
        </Button>
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
