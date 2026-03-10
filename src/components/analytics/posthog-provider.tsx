import { PostHogProvider as PHProvider } from "@posthog/react";
import type { ReactNode } from "react";

export function PostHogProvider({ children }: { children: ReactNode }) {
  return (
    <PHProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY!}
      options={{
        api_host: "/ingest",
        ui_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || "https://us.posthog.com",
        defaults: "2025-05-24",
        capture_exceptions: true,
        person_profiles: "identified_only",
        debug: import.meta.env.DEV,
      }}
    >
      {children}
    </PHProvider>
  );
}
