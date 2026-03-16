import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Lock, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { TurnstileField } from "#/components/security/turnstile-field";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { buildPaywallCopy, type PaywallVariantKey } from "#/lib/conversion";
import { captureClientException } from "#/lib/sentry-client";
import { subscribeNewsletter } from "#/server/newsletter-actions";

interface PaywallProps {
  onSubscribe?: () => void;
  isLoading?: boolean;
  ctaHref?: string;
  ctaLabel?: string;
  variant: PaywallVariantKey;
  blogName: string;
  readerEmail?: string | null;
  isAuthenticated?: boolean;
  planSlug?: string;
  onTrackedEvent?: (input: {
    action: "newsletter_subscribed" | "paywall_cta_clicked";
    properties: Record<string, unknown>;
  }) => void;
}

export function Paywall({
  onSubscribe,
  isLoading,
  ctaHref = "/pricing",
  ctaLabel = "See plans",
  variant,
  blogName,
  readerEmail,
  isAuthenticated = false,
  planSlug,
  onTrackedEvent,
}: PaywallProps) {
  const [email, setEmail] = useState(readerEmail ?? "");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [newsletterState, setNewsletterState] = useState<
    "idle" | "pending_confirmation" | "active"
  >("idle");

  const copy = buildPaywallCopy({ variant, blogName });

  async function handleNewsletterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmittingEmail(true);
      const result = await subscribeNewsletter({
        data: {
          email,
          source: "paywall_capture",
          turnstileToken,
        },
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setNewsletterState(result.state);
      setTurnstileToken("");
      toast.success(result.message);
      onTrackedEvent?.({
        action: "newsletter_subscribed",
        properties: {
          email,
          source: "paywall",
          paywall_variant: variant,
          pricing_interval: planSlug,
        },
      });
    } catch (error) {
      captureClientException(error, {
        tags: {
          area: "public",
          flow: "paywall-newsletter-subscribe",
        },
        extras: {
          paywallVariant: variant,
        },
      });
      toast.error("Could not capture your email right now. Please try again.");
    } finally {
      setIsSubmittingEmail(false);
    }
  }

  return (
    <div className="relative mt-8">
      <div className="absolute inset-0 z-10 h-64 -top-64 bg-linear-to-t from-background via-background/80 to-transparent" />

      <div className="relative z-20 mx-auto max-w-3xl space-y-5">
        <div className="rounded-2xl border border-primary/15 bg-primary/5 p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                Email first
              </p>
              <h3 className="text-2xl font-black tracking-tight text-foreground">
                {copy.newsletterTitle}
              </h3>
            </div>
          </div>

          <p className="mb-6 text-base leading-relaxed text-muted-foreground">
            {copy.newsletterDescription}
          </p>

          <form className="space-y-4" onSubmit={(event) => void handleNewsletterSubmit(event)}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  required
                  value={email}
                  disabled={isSubmittingEmail}
                  onChange={(inputEvent) => setEmail(inputEvent.target.value)}
                  placeholder={isAuthenticated ? "Confirm your email" : "name@example.com"}
                  className="pl-10"
                />
              </div>
              <Button type="submit" size="lg" disabled={isSubmittingEmail || !email.trim()}>
                {isSubmittingEmail
                  ? "Saving..."
                  : newsletterState === "idle"
                    ? "Get free updates"
                    : "Saved"}
              </Button>
            </div>

            <TurnstileField
              action="newsletter_subscribe"
              value={turnstileToken}
              onTokenChange={setTurnstileToken}
            />
          </form>

          <p className="mt-4 text-xs font-medium text-muted-foreground">
            {newsletterState === "pending_confirmation"
              ? "Check your inbox to confirm the free briefing, then continue to membership when ready."
              : newsletterState === "active"
                ? "You are on the free path now. Upgrade whenever you want full archive access."
                : "Start with free editorial notes before committing to the paid archive."}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-8 text-center shadow-xl">
          <div className="mb-5 flex justify-center">
            <div className="rounded-full bg-primary/10 p-4 text-primary">
              <Lock className="h-10 w-10" />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
              Premium membership
            </p>
            <h3 className="text-3xl font-black tracking-tight text-foreground">
              {copy.title}
            </h3>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              {copy.description}
            </p>
          </div>

          <div className="mx-auto mt-6 grid max-w-2xl gap-3 text-left sm:grid-cols-3">
            {copy.benefits.map((benefit) => (
              <div
                key={benefit}
                className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm font-medium text-foreground"
              >
                <Sparkles className="mb-3 h-4 w-4 text-primary" />
                {benefit}
              </div>
            ))}
          </div>

          <div className="flex flex-col justify-center gap-4 pt-8 sm:flex-row">
            <Button
              size="lg"
              className="px-8 text-lg font-semibold"
              onClick={() => {
                onTrackedEvent?.({
                  action: "paywall_cta_clicked",
                  properties: {
                    paywall_variant: variant,
                    cta_position: "primary",
                    pricing_interval: planSlug,
                  },
                });
                onSubscribe?.();
              }}
              disabled={isLoading}
            >
              {isLoading ? "Please wait..." : "Unlock full access"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
            >
              <Link to={ctaHref}>{ctaLabel}</Link>
            </Button>
          </div>

          <p className="mt-5 text-xs text-muted-foreground">
            Cancel anytime. Billing stays self-serve through Stripe.
          </p>
        </div>
      </div>
    </div>
  );
}
