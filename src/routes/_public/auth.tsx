import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "#/components/ui/button";

export const Route = createFileRoute("/_public/auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 ">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Button asChild size="sm" className="mb-6 rounded-full group ">
            <Link
              to="/"
              className="flex items-center gap-2 no-underline text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft
                size={16}
                className="transition-transform group-hover:-translate-x-1"
              />
              Back to Home
            </Link>
          </Button>
        </div>

        <div className="island-shell rounded-4xl p-8 sm:p-10 shadow-zine-xl border-3 border-border bg-card relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <Outlet />
          </div>
        </div>
      </div>
    </main>
  );
}
