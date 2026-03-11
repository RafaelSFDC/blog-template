import { lazy, Suspense, type ReactNode } from "react";
import { useHydrated } from "#/hooks/use-hydrated";

const LazyPostHogProviderImpl = lazy(() =>
  import("./posthog-provider").then((module) => ({
    default: module.PostHogProvider,
  })),
);

export function LazyPostHogProvider({ children }: { children: ReactNode }) {
  const isHydrated = useHydrated();

  if (!isHydrated || !import.meta.env.VITE_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={<>{children}</>}>
      <LazyPostHogProviderImpl>{children}</LazyPostHogProviderImpl>
    </Suspense>
  );
}
