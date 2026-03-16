import { createServerFn } from "@tanstack/react-start";

export const checkDashboardAccess = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getDashboardSession } = await import("#/lib/admin-auth");
    return getDashboardSession();
  },
);

export const checkAuthenticatedUserAccess = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getAuthSession } = await import("#/lib/admin-auth");
    const session = await getAuthSession();
    if (!session?.user) {
      return { ok: false as const };
    }

    return { ok: true as const };
  },
);
