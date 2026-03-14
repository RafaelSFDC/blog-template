import React, { useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Mail } from "lucide-react";
import { cn } from "#/lib/utils";
import { subscribeNewsletter } from "#/server/newsletter-actions";
import { toast } from "sonner";
import { usePostHog } from "@posthog/react";
import { captureClientException } from "#/lib/sentry-client";

interface NewsletterProps {
  title?: string;
  description?: string;
  buttonText?: string;
  placeholder?: string;
  onSubscribe?: (email: string) => void;
  variant?: "default" | "compact";
  className?: string;
}

export function Newsletter({
  title = "JOIN THE CIRCLE!",
  description = "No noise. Just premium design drops and creative insights every Sunday.",
  buttonText = "Subscribe!",
  placeholder = "your@elegant.email",
  onSubscribe,
  variant = "default",
  className,
}: NewsletterProps) {
  const [email, setEmail] = useState("");
  const posthog = usePostHog();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubscribe) {
      onSubscribe(email);
    } else {
      try {
        const res = await subscribeNewsletter({ data: { email } });
        if (res.success) {
          posthog.capture("newsletter_subscribed", { email });
          toast.success(res.message);
          setEmail("");
        } else {
          toast.error(res.message);
        }
      } catch (err) {
        captureClientException(err, {
          tags: {
            area: "public",
            flow: "newsletter-subscribe",
          },
          extras: {
            email,
          },
        });
        toast.error("An error occurred. Please try again.");
      }
    }
  };

  if (variant === "compact") {
    return (
      <form
        onSubmit={handleSubmit}
        className={cn("flex flex-col sm:flex-row gap-3 max-w-md", className)}
      >
        <div className="relative flex-1">
          <Mail
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            required
            className="pl-11 pr-4"
          />
        </div>
        <Button type="submit" variant="default">
          {buttonText === "Subscribe!" ? "Join" : buttonText}
        </Button>
      </form>
    );
  }

  return (
    <section
      className={cn(
        "bg-card border shadow-sm rounded-md px-4 py-8 sm:px-6 text-center border-border",
        className,
      )}
    >
      <div className="mx-auto max-w-2xl text-foreground">
        <h3 className="display-title mb-6 text-4xl font-extrabold uppercase italic tracking-tighter sm:text-6xl text-foreground">
          {title}
        </h3>
        <p className="mb-10 text-lg font-bold sm:text-xl text-muted-foreground">
          {description}
        </p>

        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-md flex-col gap-4 sm:flex-row sm:gap-3 items-center"
        >
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            required
            className="flex-1"
          />
          <Button type="submit" variant="default" size="default">
            {buttonText}
          </Button>
        </form>
      </div>
    </section>
  );
}
