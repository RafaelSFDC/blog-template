import { createServerFn } from "@tanstack/react-start";
import { isRegistrationLocked } from "#/lib/registration";

export const getCurrentAuthSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getAuthSession } = await import("#/lib/admin-auth");
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
