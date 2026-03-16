import { createServerFn } from "@tanstack/react-start";

export const checkDashboardAccess = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getDashboardSession } = await import("#/server/auth/session");
    return getDashboardSession();
  },
);

export const checkAuthenticatedUserAccess = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getAuthSession } = await import("#/server/auth/session");
    const session = await getAuthSession();
    if (!session?.user) {
      return { ok: false as const };
    }

    return { ok: true as const };
  },
);

export const checkAdminAccess = createServerFn({ method: "GET" }).handler(
  async () => {
    const { requireAdminSession } = await import("#/server/auth/session");
    await requireAdminSession();
    return { ok: true as const };
  },
);
