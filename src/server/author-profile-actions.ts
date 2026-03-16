import { createServerFn } from "@tanstack/react-start";
import { and, eq, ne } from "drizzle-orm";
import { db } from "#/db/index";
import { user } from "#/db/schema";
import { requireRoleAccess } from "#/lib/editorial-access";
import { authorProfileSchema, slugify } from "#/lib/cms-schema";

export const getCurrentAuthorProfile = createServerFn({ method: "GET" }).handler(async () => {
  const session = await requireRoleAccess(["author", "editor", "admin", "super-admin"]);
  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: {
      id: true,
      name: true,
      publicAuthorSlug: true,
      authorBio: true,
      authorHeadline: true,
      authorSeoTitle: true,
      authorSeoDescription: true,
    },
  });

  if (!currentUser) {
    throw new Error("User not found");
  }

  return currentUser;
});

export const updateCurrentAuthorProfile = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => authorProfileSchema.parse(input))
  .handler(async ({ data }) => {
    const session = await requireRoleAccess(["author", "editor", "admin", "super-admin"]);
    const nextSlug = data.publicAuthorSlug ? slugify(data.publicAuthorSlug) : slugify(session.user.name || "");

    if (nextSlug) {
      const existing = await db.query.user.findFirst({
        where: and(eq(user.publicAuthorSlug, nextSlug), ne(user.id, session.user.id)),
        columns: {
          id: true,
        },
      });

      if (existing) {
        throw new Error("Author slug already in use");
      }
    }

    await db
      .update(user)
      .set({
        publicAuthorSlug: nextSlug || null,
        authorBio: data.authorBio || null,
        authorHeadline: data.authorHeadline || null,
        authorSeoTitle: data.authorSeoTitle || null,
        authorSeoDescription: data.authorSeoDescription || null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id));

    return { ok: true as const, publicAuthorSlug: nextSlug || null };
  });
