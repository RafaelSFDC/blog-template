import { createServerFn } from "@tanstack/react-start";
import { db } from "#/server/db/index";
import { redirects } from "#/server/db/schema";
import { requireAdminSession } from "#/server/auth/session";
import { getFriendlyDbError, recordIdSchema, redirectSchema } from "#/schemas/system";
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

function isInternalPath(path: string) {
  return path.startsWith("/");
}

async function assertRedirectIsValid(input: {
  id?: number;
  sourcePath: string;
  destinationPath: string;
}) {
  if (input.sourcePath === input.destinationPath) {
    throw new Error("Redirect source and destination cannot be the same");
  }

  if (!isInternalPath(input.destinationPath)) {
    return;
  }

  const destinationRedirect = await db.query.redirects.findFirst({
    where: eq(redirects.sourcePath, input.destinationPath),
  });

  if (destinationRedirect && destinationRedirect.destinationPath === input.sourcePath) {
    throw new Error("This redirect would create a loop");
  }

  if (destinationRedirect && destinationRedirect.id === input.id) {
    throw new Error("Redirect source and destination cannot be the same");
  }
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

    await assertRedirectIsValid({
      id: data.id,
      sourcePath: values.sourcePath,
      destinationPath: values.destinationPath,
    });

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

