import { createServerFn } from "@tanstack/react-start";
import { isRegistrationLocked } from "#/server/auth/registration";

export const getCurrentAuthSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getAuthSession } = await import("#/server/auth/session");
    return await getAuthSession();
  },
);

export const getPublicRegistrationStatus = createServerFn({ method: "GET" }).handler(
  async () => {
    return {
      locked: await isRegistrationLocked(),
    };
  },
);
