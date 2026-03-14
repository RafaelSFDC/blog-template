import { useState } from "react";
import { authClient } from "#/lib/auth-client";
import { Button } from "#/components/ui/button";
import { Github } from "lucide-react";
import { cn } from "#/lib/utils";
import { toast } from "sonner";
import { usePostHog } from "@posthog/react";
import { captureClientException } from "#/lib/sentry-client";

interface SocialLoginProps {
  callbackURL?: string;
  className?: string;
}

export function SocialLogin({
  callbackURL = "/dashboard",
  className,
}: SocialLoginProps) {
  const [error, setError] = useState("");

  const posthog = usePostHog();
  const handleSocialLogin = async (provider: "github" | "google") => {
    try {
      await authClient.signIn.social({
        provider,
        callbackURL,
      });
      posthog.capture("user_signed_in", { method: provider });
    } catch (error) {
      captureClientException(error, {
        tags: {
          area: "auth",
          flow: "social-login",
          provider,
        },
      });
      setError(`Failed to sign in with ${provider}.`);
      toast.error(`Failed to sign in with ${provider}. Please try again.`);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          onClick={() => handleSocialLogin("github")}
          className="rounded-md h-12 flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
        >
          <Github size={20} />
          <span className="font-bold">GitHub</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSocialLogin("google")}
          className="rounded-md h-12 flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span className="font-bold">Google</span>
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold animate-in fade-in slide-in-from-top-1">
          {error}
        </div>
      )}
    </div>
  );
}
