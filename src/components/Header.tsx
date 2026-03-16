import { Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import BetterAuthHeader from "../integrations/better-auth/header-user.tsx";
import { Menu, X } from "lucide-react";

import { Button } from "#/components/ui/button";
import { LuminaLogo } from "./LuminaLogo";
import type { GlobalSiteData } from "#/types/system";

export default function Header() {
  const router = useRouter();
  const settings = router.state.matches.find((m) => m.routeId === "__root__")
    ?.loaderData as GlobalSiteData | undefined;
  const blogName = settings?.blogName || "Lumina";
  const blogLogo = settings?.blogLogo || "";
  const primaryMenu = settings?.primaryMenu ?? [];

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 px-2 py-4 sm:px-4">
      <nav className="page-wrap bg-card border shadow-sm rounded-md px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between w-full lg:w-auto">
            <Link
              to="/"
              className="inline-flex items-center gap-2 no-underline shrink-0"
            >
              {blogLogo ? (
                <img
                  src={blogLogo}
                  alt={blogName}
                  className="h-10 w-auto object-contain sm:h-12"
                />
              ) : (
                <LuminaLogo className="h-10 w-10 sm:h-12 sm:w-12" />
              )}
              <span className="display-title text-2xl font-bold text-foreground whitespace-nowrap sm:text-3xl">
                {blogName}
              </span>
            </Link>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X size={20} strokeWidth={3} />
              ) : (
                <Menu size={20} strokeWidth={3} />
              )}
            </Button>
          </div>

          <div
            className={`flex flex-col gap-4 lg:flex lg:flex-row lg:items-center lg:gap-6 ${
              isMenuOpen ? "flex" : "hidden"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              {(primaryMenu.length > 0
                ? primaryMenu
                : [
                    { id: 0, label: "Home", href: "/", kind: "internal" as const },
                    { id: 1, label: "Stories", href: "/blog", kind: "internal" as const },
                    { id: 2, label: "About", href: "/about", kind: "internal" as const },
                    { id: 3, label: "Contact", href: "/contact", kind: "internal" as const },
                  ]
              ).map((item) => (
                <Button
                  key={item.id}
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-auto px-4 py-2 shadow-sm"
                >
                  <a
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    target={item.kind === "external" ? "_blank" : undefined}
                    rel={item.kind === "external" ? "noopener noreferrer" : undefined}
                  >
                    {item.label}
                  </a>
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2 border-t border-border pt-4 lg:border-none lg:pt-0">
              <BetterAuthHeader />
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
