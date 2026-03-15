import { Link } from "@tanstack/react-router";
import { Button } from "../ui/button";
import { Lock } from "lucide-react";

interface PaywallProps {
  onSubscribe?: () => void;
  isLoading?: boolean;
  ctaHref?: string;
  ctaLabel?: string;
}

export function Paywall({
  onSubscribe,
  isLoading,
  ctaHref = "/pricing",
  ctaLabel = "See plans",
}: PaywallProps) {
  return (
    <div className="relative mt-8">
      <div className="absolute inset-0 bg-linear-to-t from-background via-background/80 to-transparent z-10 h-64 -top-64" />

      <div className="relative z-20 bg-card border rounded-2xl p-8 text-center shadow-xl space-y-6 max-w-2xl mx-auto">
        <div className="flex justify-center">
          <div className="bg-primary/10 p-4 rounded-full">
            <Lock className="w-10 h-10 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight">
            This content is exclusive
          </h3>
          <p className="text-muted-foreground text-lg">
            Subscribe to our premium plan to unlock this full article and the
            rest of our members-only archive.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button
            size="lg"
            className="text-lg px-8 font-semibold"
            onClick={onSubscribe}
            disabled={isLoading}
          >
            {isLoading ? "Please wait..." : "Subscribe now"}
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to={ctaHref}>{ctaLabel}</Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Cancel anytime. Priority support included.
        </p>
      </div>
    </div>
  );
}
