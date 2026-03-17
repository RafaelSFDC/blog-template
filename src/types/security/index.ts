export type SecurityScope =
  | "auth.sign_in"
  | "auth.sign_up"
  | "auth.request_password_reset"
  | "auth.reset_password"
  | "comment.create"
  | "contact.submit"
  | "lumina.beta.submit"
  | "newsletter.subscribe";

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds: number;
}

export interface TurnstileVerificationResult {
  success: boolean;
  bypassed?: boolean;
  errors?: string[];
}

export type ConsentStatus = "subscribed" | "confirmed" | "unsubscribed";
