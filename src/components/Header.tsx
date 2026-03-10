import { Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import BetterAuthHeader from "../integrations/better-auth/header-user.tsx";
import { Menu, X } from "lucide-react";

import { Button } from "#/components/ui/button";
import { LuminaLogo } from "./LuminaLogo";

export default function Header() {
  const router = useRouter();
  const settings = router.state.matches.find((m) => m.routeId === "__root__")
    ?.loaderData as any;
  const blogName = settings?.blogName || "Lumina";
  const blogLogo = settings?.blogLogo || "";

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
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-auto py-2 px-4 shadow-sm"
              >
                <Link to="/" onClick={() => setIsMenuOpen(false)}>
                  Home
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-auto py-2 px-4 shadow-sm"
              >
                <Link
                  to="/blog"
                  search={{ q: "", category: "" }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Stories
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-auto py-2 px-4 shadow-sm"
              >
                <Link to="/about" onClick={() => setIsMenuOpen(false)}>
                  About
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-auto py-2 px-4 shadow-sm"
              >
                <Link to="/contact" onClick={() => setIsMenuOpen(false)}>
                  Contact
                </Link>
              </Button>
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
