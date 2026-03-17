import { useEffect, useState } from "react";
import { getPublicSecurityConfig } from "#/server/actions/security/config";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          action?: string;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
    };
  }
}

let turnstileScriptPromise: Promise<void> | null = null;

function ensureTurnstileScript() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.turnstile) {
    return Promise.resolve();
  }

  if (turnstileScriptPromise) {
    return turnstileScriptPromise;
  }

  turnstileScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-turnstile-script="true"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Turnstile")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.turnstileScript = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Turnstile"));
    document.head.appendChild(script);
  });

  return turnstileScriptPromise;
}

export function useTurnstileConfig() {
  const [config, setConfig] = useState({
    turnstileEnabled: false,
    turnstileSiteKey: "",
    loading: true,
  });

  useEffect(() => {
    let active = true;
    void getPublicSecurityConfig()
      .then((data) => {
        if (!active) return;
        setConfig({
          turnstileEnabled: data.turnstileEnabled,
          turnstileSiteKey: data.turnstileSiteKey,
          loading: false,
        });
      })
      .catch(() => {
        if (!active) return;
        setConfig({
          turnstileEnabled: false,
          turnstileSiteKey: "",
          loading: false,
        });
      });

    return () => {
      active = false;
    };
  }, []);

  return config;
}

export function useTurnstileScript(enabled: boolean) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    void ensureTurnstileScript()
      .then(() => {
        if (active) setLoaded(true);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load security challenge");
      });

    return () => {
      active = false;
    };
  }, [enabled]);

  return { loaded, error };
}

