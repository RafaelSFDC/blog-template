import { useEffect, useRef } from "react";
import { useTurnstileConfig, useTurnstileScript } from "#/hooks/use-turnstile";

interface TurnstileFieldProps {
  action: string;
  value: string;
  onTokenChange: (token: string) => void;
}

export function TurnstileField({
  action,
  value,
  onTokenChange,
}: TurnstileFieldProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const config = useTurnstileConfig();
  const script = useTurnstileScript(config.turnstileEnabled);

  useEffect(() => {
    if (
      !config.turnstileEnabled ||
      !config.turnstileSiteKey ||
      !script.loaded ||
      !containerRef.current ||
      !window.turnstile ||
      widgetIdRef.current
    ) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: config.turnstileSiteKey,
      action,
      callback: (token) => onTokenChange(token),
      "expired-callback": () => onTokenChange(""),
      "error-callback": () => onTokenChange(""),
      theme: "auto",
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [action, config.turnstileEnabled, config.turnstileSiteKey, onTokenChange, script.loaded]);

  if (config.loading) {
    return <p className="text-xs text-muted-foreground">Loading security check…</p>;
  }

  if (!config.turnstileEnabled) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div ref={containerRef} />
      {!value ? (
        <p className="text-xs text-muted-foreground">
          Complete the security check before submitting.
        </p>
      ) : null}
      {script.error ? <p className="text-xs text-destructive">{script.error}</p> : null}
    </div>
  );
}
