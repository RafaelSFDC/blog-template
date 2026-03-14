import { lazy, Suspense, type ReactNode } from "react";
import { useHydrated } from "#/hooks/use-hydrated";

const LazyObservabilityProviderImpl = lazy(() =>
  import("./observability-provider").then((module) => ({
    default: module.ObservabilityProvider,
  })),
);

export function LazyPostHogProvider({ children }: { children: ReactNode }) {
  const isHydrated = useHydrated();

  if (
    !isHydrated ||
    (!import.meta.env.VITE_PUBLIC_POSTHOG_KEY &&
      !import.meta.env.VITE_PUBLIC_SENTRY_DSN)
  ) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={<>{children}</>}>
      <LazyObservabilityProviderImpl>{children}</LazyObservabilityProviderImpl>
    </Suspense>
  );
}
