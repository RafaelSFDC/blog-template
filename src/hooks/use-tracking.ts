import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";

export function useTracking() {
  const location = useLocation();

  useEffect(() => {
    const track = async () => {
      // Don't track dashboard paths (except maybe the main overview if desired,
      // but usually analytics is for public traffic)
      if (
        location.pathname.startsWith("/dashboard") ||
        location.pathname.startsWith("/auth")
      ) {
        return;
      }

      // Basic browser/OS/Device detection
      const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
      if (!ua) return;

      let browser = "Other";
      if (ua.includes("Firefox")) browser = "Firefox";
      else if (ua.includes("SamsungBrowser")) browser = "Samsung Browser";
      else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
      else if (ua.includes("Trident")) browser = "Internet Explorer";
      else if (ua.includes("Edge")) browser = "Edge";
      else if (ua.includes("Chrome")) browser = "Chrome";
      else if (ua.includes("Safari")) browser = "Safari";

      let os = "Other";
      if (ua.includes("Win")) os = "Windows";
      else if (ua.includes("Mac")) os = "MacOS";
      else if (ua.includes("X11")) os = "UNIX";
      else if (ua.includes("Linux")) os = "Linux";
      else if (ua.includes("Android")) os = "Android";
      else if (ua.includes("iPhone")) os = "iOS";

      let device = "desktop";
      if (/Mobi|Android/i.test(ua)) device = "mobile";
      else if (/Tablet|iPad/i.test(ua)) device = "tablet";

      try {
        // Use PostHog if available
        const key = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
        if (key) {
          const { default: posthog } = await import("posthog-js");
          posthog.capture("$pageview", {
            url: window.location.href,
            pathname: location.pathname,
            referrer: document.referrer || null,
            browser,
            os,
            device,
          });

          // Custom event for granular blog post tracking
          if (
            location.pathname.startsWith("/blog") &&
            location.pathname !== "/blog"
          ) {
            const slug = location.pathname.split("/").pop();
            posthog.capture("blog_post_view", {
              slug,
              url: window.location.href,
              pathname: location.pathname,
            });
          }
        }
      } catch {
        // Silently fail analytics
      }
    };

    void track();

    const startTime = Date.now();
    return () => {
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      const key = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
      if (key && durationSeconds > 0) {
        // Send page_leave event but use dynamic import to avoid blocking cleanup
        import("posthog-js").then(({ default: posthog }) => {
          posthog.capture("page_leave", {
            url: window.location.href,
            pathname: location.pathname,
            duration_seconds: durationSeconds,
          });
        });
      }
    };
  }, [location.pathname]);
}
