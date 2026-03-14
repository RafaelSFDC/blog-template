import { useEffect, type ReactNode } from "react";
import { authClient } from "#/lib/auth-client";
import {
  initClientSentry,
  setClientSentryUser,
} from "#/lib/sentry-client";

export function SentryProvider({ children }: { children: ReactNode }) {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  initClientSentry();

  useEffect(() => {
    setClientSentryUser(
      user
        ? {
            id: user.id,
            email: user.email,
            username: user.name || undefined,
          }
        : null,
    );
  }, [user]);

  return <>{children}</>;
}
