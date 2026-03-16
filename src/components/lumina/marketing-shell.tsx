import { useEffect } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { usePostHog } from "@posthog/react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { LuminaLogo } from "#/components/LuminaLogo";
import { captureClientEvent } from "#/lib/analytics-client";
import {
  LUMINA_PRIMARY_CTA_HREF,
  LUMINA_SECONDARY_CTA_HREF,
  luminaMarketingNav,
} from "#/lib/lumina-marketing";
import { cn } from "#/lib/utils";

export function LuminaMarketingShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const posthog = usePostHog();

  useEffect(() => {
    captureClientEvent(posthog, "lumina_marketing_page_view", {
      path: location.pathname,
      source: "route_change",
      surface: "lumina_marketing",
    });
  }, [location.pathname, posthog]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(180,224,214,0.28),_transparent_45%),linear-gradient(180deg,_var(--background),_color-mix(in_srgb,var(--muted)_75%,white))]">
      <header className="sticky top-0 z-50 px-2 py-4 sm:px-4">
        <nav className="page-wrap rounded-md border bg-card/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link to="/lumina" className="inline-flex items-center gap-3">
              <LuminaLogo className="h-11 w-11" />
              <div>
                <p className="display-title text-2xl font-bold text-foreground">Lumina</p>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Publication OS
                </p>
              </div>
            </Link>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex flex-wrap items-center gap-2">
                {luminaMarketingNav.map((item) => (
                  <Button key={item.href} asChild size="sm" variant="ghost">
                    <Link
                      to={item.href}
                      onClick={() =>
                        captureClientEvent(posthog, "lumina_cta_clicked", {
                          cta_label: item.label,
                          cta_href: item.href,
                          path: location.pathname,
                          source: "marketing_nav",
                          surface: "lumina_marketing",
                        })
                      }
                    >
                      {item.label}
                    </Link>
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link
                    to={LUMINA_SECONDARY_CTA_HREF}
                    onClick={() =>
                      captureClientEvent(posthog, "lumina_cta_clicked", {
                        cta_label: "Pricing",
                        cta_href: LUMINA_SECONDARY_CTA_HREF,
                        path: location.pathname,
                        source: "marketing_header",
                        surface: "lumina_marketing",
                      })
                    }
                  >
                    Pricing
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link
                    to={LUMINA_PRIMARY_CTA_HREF}
                    onClick={() =>
                      captureClientEvent(posthog, "lumina_cta_clicked", {
                        cta_label: "Request beta",
                        cta_href: LUMINA_PRIMARY_CTA_HREF,
                        path: location.pathname,
                        source: "marketing_header",
                        surface: "lumina_marketing",
                      })
                    }
                  >
                    Request beta
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {children}

      <footer className="mt-24 border-t border-border/70 bg-card/70 px-4 py-12">
        <div className="page-wrap flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge variant="outline" className="mb-4">
              Lumina product surface
            </Badge>
            <h2 className="display-title text-3xl font-bold text-foreground sm:text-4xl">
              Publish, grow, and monetize from one calm operating layer.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Built for creators, journalists, and small publications that want a launch-ready stack without duct tape.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              `/lumina` explains and sells the Lumina product. Reader memberships for a publication built with Lumina stay on that publication's public pricing flow.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {luminaMarketingNav.map((item) => (
              <Button key={item.href} asChild variant="ghost" size="sm">
                <Link
                  to={item.href}
                  onClick={() =>
                    captureClientEvent(posthog, "lumina_cta_clicked", {
                      cta_label: item.label,
                      cta_href: item.href,
                      path: location.pathname,
                      source: "marketing_footer",
                      surface: "lumina_marketing",
                    })
                  }
                >
                  {item.label}
                </Link>
              </Button>
            ))}
            <Button asChild variant="default" size="sm">
              <Link
                to={LUMINA_PRIMARY_CTA_HREF}
                onClick={() =>
                  captureClientEvent(posthog, "lumina_cta_clicked", {
                    cta_label: "Request beta",
                    cta_href: LUMINA_PRIMARY_CTA_HREF,
                    path: location.pathname,
                    source: "marketing_footer",
                    surface: "lumina_marketing",
                  })
                }
              >
                Request beta
              </Link>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface LuminaHeroProps {
  badge: string;
  title: string;
  description: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  aside?: React.ReactNode;
}

export function LuminaHero({
  badge,
  title,
  description,
  primaryCtaLabel = "Request beta access",
  primaryCtaHref = LUMINA_PRIMARY_CTA_HREF,
  secondaryCtaLabel = "See pricing",
  secondaryCtaHref = LUMINA_SECONDARY_CTA_HREF,
  aside,
}: LuminaHeroProps) {
  const posthog = usePostHog();
  const location = useLocation();

  return (
    <section className="page-wrap grid gap-8 px-4 pb-8 pt-8 lg:grid-cols-12 lg:gap-10 lg:pt-14">
      <div className="rounded-md border bg-card p-8 shadow-sm sm:p-10 lg:col-span-7 lg:p-12">
        <Badge variant="default" className="mb-4">
          {badge}
        </Badge>
        <h1 className="display-title max-w-4xl text-4xl font-bold leading-tight tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mt-5 max-w-3xl text-lg font-semibold leading-relaxed text-muted-foreground sm:text-xl">
          {description}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="xl">
            <Link
              to={primaryCtaHref}
              onClick={() =>
                captureClientEvent(posthog, "lumina_cta_clicked", {
                  cta_label: primaryCtaLabel,
                  cta_href: primaryCtaHref,
                  path: location.pathname,
                  source: "hero_primary",
                  surface: "lumina_marketing",
                })
              }
            >
              {primaryCtaLabel}
              <ArrowRight size={16} />
            </Link>
          </Button>
          <Button asChild size="xl" variant="outline">
            <Link
              to={secondaryCtaHref}
              onClick={() =>
                captureClientEvent(posthog, "lumina_cta_clicked", {
                  cta_label: secondaryCtaLabel,
                  cta_href: secondaryCtaHref,
                  path: location.pathname,
                  source: "hero_secondary",
                  surface: "lumina_marketing",
                })
              }
            >
              {secondaryCtaLabel}
            </Link>
          </Button>
        </div>
      </div>

      <div className="lg:col-span-5">{aside}</div>
    </section>
  );
}

export function LuminaSection({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <section className={cn("page-wrap px-4 py-8", className)}>{children}</section>;
}

export function LuminaSectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8 max-w-3xl">
      <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h2 className="display-title text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-lg font-medium leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

export function LuminaBulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground sm:text-base">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function LuminaCtaBand({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const posthog = usePostHog();
  const location = useLocation();

  return (
    <LuminaSection className="pb-16">
      <div className="rounded-md border bg-card p-8 shadow-sm sm:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-primary">
              Ready for a clearer launch path?
            </p>
            <h2 className="display-title text-3xl font-bold text-foreground sm:text-4xl">
              {title}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">{description}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="xl">
              <Link
                to={LUMINA_PRIMARY_CTA_HREF}
                onClick={() =>
                  captureClientEvent(posthog, "lumina_cta_clicked", {
                    cta_label: "Request beta",
                    cta_href: LUMINA_PRIMARY_CTA_HREF,
                    path: location.pathname,
                    source: "cta_band_primary",
                    surface: "lumina_marketing",
                  })
                }
              >
                Request beta
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <Link
                to={LUMINA_SECONDARY_CTA_HREF}
                onClick={() =>
                  captureClientEvent(posthog, "lumina_cta_clicked", {
                    cta_label: "Review pricing",
                    cta_href: LUMINA_SECONDARY_CTA_HREF,
                    path: location.pathname,
                    source: "cta_band_secondary",
                    surface: "lumina_marketing",
                  })
                }
              >
                Review pricing
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </LuminaSection>
  );
}
