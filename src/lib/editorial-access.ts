import { and, eq } from "drizzle-orm";
import { redirect } from "@tanstack/react-router";
import { db } from "#/db/index";
import { comments, media, pages, posts } from "#/db/schema";
import { getAuthSession, requireDashboardAccess } from "#/lib/admin-auth";

export const DASHBOARD_CONTENT_ROLES = [
  "author",
  "editor",
  "moderator",
  "admin",
  "super-admin",
  "superAdmin",
] as const;

export type EditorialRole = (typeof DASHBOARD_CONTENT_ROLES)[number];
export type ContentAction = "create" | "read" | "update" | "delete" | "publish" | "restore";
export type ContentLockState = "acquired" | "held_by_other" | "expired";
export type RevisionSource = "manual" | "autosave" | "restore" | "publish";

export function normalizeRole(role?: string | null) {
  if (role === "superAdmin") {
    return "super-admin";
  }

  return role ?? null;
}

export function isAdminRole(role?: string | null) {
  const normalized = normalizeRole(role);
  return normalized === "admin" || normalized === "super-admin";
}

export function isEditorRole(role?: string | null) {
  const normalized = normalizeRole(role);
  return normalized === "editor" || isAdminRole(normalized);
}

export function isModeratorRole(role?: string | null) {
  const normalized = normalizeRole(role);
  return normalized === "moderator" || isEditorRole(normalized);
}

export function isAuthorRole(role?: string | null) {
  return normalizeRole(role) === "author";
}

export async function requireRoleAccess(roles: string[]) {
  const session = await requireDashboardAccess();
  const role = normalizeRole(session.user.role);

  if (!roles.includes(role ?? "")) {
    throw redirect({ to: "/dashboard" });
  }

  return session;
}

export async function requireCommentModerationAccess() {
  return requireRoleAccess(["moderator", "editor", "admin", "super-admin"]);
}

export async function requireTaxonomyAccess() {
  return requireRoleAccess(["editor", "admin", "super-admin"]);
}

export async function requirePageAccess() {
  return requireRoleAccess(["editor", "admin", "super-admin"]);
}

export async function requirePostCreateAccess() {
  return requireRoleAccess(["author", "editor", "admin", "super-admin"]);
}

export async function requirePostAccess(action: ContentAction, postId: number) {
  const session = await requireDashboardAccess();
  const role = normalizeRole(session.user.role);

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    columns: {
      id: true,
      authorId: true,
      status: true,
      publishedAt: true,
      slug: true,
      title: true,
    },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  if (isEditorRole(role)) {
    return { session, post };
  }

  if (!isAuthorRole(role) || post.authorId !== session.user.id) {
    throw new Error("You do not have permission to access this post");
  }

  if (action === "publish" || action === "restore") {
    throw new Error("Only editors can publish or restore posts");
  }

  if ((action === "update" || action === "delete") && post.status === "published") {
    throw new Error("Authors cannot modify posts after publication");
  }

  return { session, post };
}

export async function requireMediaReadAccess() {
  const session = await requireRoleAccess(["author", "editor", "admin", "super-admin"]);
  return {
    session,
    canReadAll: isEditorRole(session.user.role),
  };
}

export async function requireMediaAccess(action: ContentAction, mediaId?: number) {
  const session = await requireRoleAccess(["author", "editor", "admin", "super-admin"]);
  const role = normalizeRole(session.user.role);

  if (mediaId === undefined) {
    return { session };
  }

  const item = await db.query.media.findFirst({
    where: eq(media.id, mediaId),
    columns: {
      id: true,
      ownerId: true,
      filename: true,
      url: true,
    },
  });

  if (!item) {
    throw new Error("Media not found");
  }

  if (isEditorRole(role) || item.ownerId === session.user.id) {
    return { session, item };
  }

  if (action === "read") {
    throw new Error("You can only view media you uploaded");
  }

  throw new Error("You do not have permission to manage this media item");
}

export async function ensurePostTransitionAllowed(
  sessionRole: string | null | undefined,
  status: string,
) {
  const normalized = normalizeRole(sessionRole);

  if (status === "published" || status === "scheduled") {
    if (!isEditorRole(normalized)) {
      throw new Error("Only editors can publish or schedule posts");
    }
  }
}

export async function getEditablePostByIdForCurrentUser(postId: number) {
  const { post } = await requirePostAccess("update", postId);
  return post;
}

export async function getEditablePageByIdForCurrentUser(pageId: number) {
  await requirePageAccess();
  const page = await db.query.pages.findFirst({
    where: eq(pages.id, pageId),
  });

  if (!page) {
    throw new Error("Page not found");
  }

  return page;
}

export async function getDashboardSessionWithRole() {
  const session = await getAuthSession();
  const role = normalizeRole(session?.user?.role);
  return {
    session,
    role,
  };
}

export async function requireCommentOwnershipOrModeration(commentId: number) {
  const session = await requireDashboardAccess();
  const role = normalizeRole(session.user.role);

  if (isModeratorRole(role)) {
    return { session };
  }

  const comment = await db.query.comments.findFirst({
    where: and(eq(comments.id, commentId), eq(comments.authorId, session.user.id)),
  });

  if (!comment) {
    throw new Error("You do not have permission to access this comment");
  }

  return { session };
}
