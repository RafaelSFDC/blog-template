import { createServerFn } from "@tanstack/react-start";
import { db } from "#/db/index";
import { redirects } from "#/db/schema";
import { requireAdminSession } from "#/lib/admin-auth";
import { getFriendlyDbError, recordIdSchema, redirectSchema } from "#/lib/cms-schema";
import { asc, eq } from "drizzle-orm";

function normalizeRedirectPath(path: string) {
  const trimmed = path.trim();
  if (trimmed === "/") {
    return "/";
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  const normalized = `/${trimmed.replace(/^\/+/, "")}`;
  return normalized.replace(/\/+$/, "");
}

function normalizeSourcePath(path: string) {
  return normalizeRedirectPath(path);
}

function normalizeDestinationPath(path: string) {
  return normalizeRedirectPath(path);
}

export const getRedirects = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession();
  return db.select().from(redirects).orderBy(asc(redirects.sourcePath));
});

export const saveRedirect = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => redirectSchema.parse(input))
  .handler(async ({ data }) => {
    await requireAdminSession();

    const values = {
      sourcePath: normalizeSourcePath(data.sourcePath),
      destinationPath: normalizeDestinationPath(data.destinationPath),
      statusCode: data.statusCode,
      updatedAt: new Date(),
    };

    try {
      if (data.id) {
        const [updated] = await db
          .update(redirects)
          .set(values)
          .where(eq(redirects.id, data.id))
          .returning();
        return updated;
      }

      const [created] = await db
        .insert(redirects)
        .values({
          ...values,
          createdAt: new Date(),
        })
        .returning();
      return created;
    } catch (error) {
      throw new Error(getFriendlyDbError(error, "Redirect") || "Could not save redirect");
    }
  });

export const deleteRedirect = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => recordIdSchema.parse({ id: input }))
  .handler(async ({ data }) => {
    await requireAdminSession();
    await db.delete(redirects).where(eq(redirects.id, data.id));
    return { ok: true as const };
  });

export async function getRedirectByPath(pathname: string) {
  const normalizedPath = normalizeSourcePath(pathname || "/");
  return db.query.redirects.findFirst({
    where: eq(redirects.sourcePath, normalizedPath),
  });
}
