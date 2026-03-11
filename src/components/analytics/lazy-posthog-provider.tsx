import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";

const LazyPostHogProviderImpl = lazy(() =>
  import("./posthog-provider").then((module) => ({
    default: module.PostHogProvider,
  })),
);

export function LazyPostHogProvider({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !import.meta.env.VITE_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={<>{children}</>}>
      <LazyPostHogProviderImpl>{children}</LazyPostHogProviderImpl>
    </Suspense>
  );
}
