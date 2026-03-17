import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "#/db/index";
import { media as mediaTable, posts } from "#/db/schema";
import { requireMediaAccess, requireMediaReadAccess } from "#/server/editorial/access";
import { deleteObject, putObject, sanitizeMediaFilename } from "#/server/system/storage";
import { bulkMediaDeleteSchema, mediaUploadSchema } from "#/schemas/system";
import { captureServerException } from "#/server/sentry";
import { logActivity } from "#/server/activity-log";
import { logSecurityEvent } from "#/server/security/events";
import { getCurrentSecurityRequestMetadata } from "#/server/security/request";

const MIME_EXTENSION_ALLOWLIST: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
  "video/mp4": [".mp4"],
  "audio/mpeg": [".mp3"],
  "application/pdf": [".pdf"],
};

function getFileExtension(filename: string) {
  const match = /\.([a-z0-9]+)$/i.exec(filename);
  return match ? `.${match[1].toLowerCase()}` : "";
}

function getMaxUploadSize(mimeType: string) {
  if (mimeType.startsWith("image/")) return 8 * 1024 * 1024;
  if (mimeType.startsWith("video/")) return 25 * 1024 * 1024;
  if (mimeType.startsWith("audio/")) return 15 * 1024 * 1024;
  return 10 * 1024 * 1024;
}

export const getMediaItems = createServerFn({ method: "GET" }).handler(async () => {
  const { session, canReadAll } = await requireMediaReadAccess();

  const query = db.select().from(mediaTable);
  const rows = canReadAll
    ? await query.orderBy(desc(mediaTable.createdAt))
    : await query
        .where(eq(mediaTable.ownerId, session.user.id))
        .orderBy(desc(mediaTable.createdAt));

  return rows;
});

export const uploadMedia = createServerFn({ method: "POST" })
  .inputValidator((data: FormData) => data)
  .handler(async ({ data }: { data: FormData }) => {
    const { session } = await requireMediaAccess("create");

    const file = data.get("file") as File;
    const altText = data.get("altText") as string | null;

    try {
      if (!file) {
        throw new Error("No file provided");
      }

      mediaUploadSchema.parse({
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        altText: altText ?? undefined,
      });

      const filename = sanitizeMediaFilename(file.name);
      const fileExtension = getFileExtension(file.name);
      const expectedExtensions = MIME_EXTENSION_ALLOWLIST[file.type] ?? [];
      const requestMetadata = getCurrentSecurityRequestMetadata();

      if (!filename || !/\.[a-z0-9]+$/i.test(filename)) {
        throw new Error("Invalid file name after sanitization");
      }

      if (expectedExtensions.length === 0 || !expectedExtensions.includes(fileExtension)) {
        await logSecurityEvent({
          type: "upload.invalid",
          scope: "media.upload",
          ipHash: requestMetadata?.ipHash ?? null,
          userAgent: requestMetadata?.userAgentShort ?? null,
          metadata: {
            fileName: file.name,
            mimeType: file.type,
            reason: "extension_mismatch",
          },
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        throw new Error("File extension does not match the uploaded file type");
      }

      if (file.size > getMaxUploadSize(file.type)) {
        await logSecurityEvent({
          type: "upload.invalid",
          scope: "media.upload",
          ipHash: requestMetadata?.ipHash ?? null,
          userAgent: requestMetadata?.userAgentShort ?? null,
          metadata: {
            fileName: file.name,
            mimeType: file.type,
            size: file.size,
            reason: "file_too_large",
          },
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        throw new Error("This file is larger than the allowed limit for its type");
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const stored = await putObject({
        filename,
        body: buffer,
        contentType: file.type,
      });

      const [created] = await db
        .insert(mediaTable)
        .values({
          url: stored.publicUrl,
          filename,
          altText: altText?.trim() || null,
          mimeType: file.type,
          size: file.size,
          ownerId: session.user.id,
        })
        .returning();

      return created;
    } catch (error) {
      captureServerException(error, {
        tags: {
          area: "server",
          flow: "media-upload",
        },
        extras: {
          fileName: file?.name,
          fileType: file?.type,
        },
      });
      throw error;
    }
  });

export const deleteMediaItem = createServerFn({ method: "POST" })
  .inputValidator((data: { id: number; filename: string }) => data)
  .handler(async ({ data }) => {
    const { session, item } = await requireMediaAccess("delete", data.id);
    if (!item) {
      throw new Error("Media not found");
    }
    await deleteObject(data.filename);
    await db.delete(mediaTable).where(eq(mediaTable.id, data.id));

    await logActivity({
      actorUserId: session.user.id,
      entityType: "media",
      entityId: data.id,
      action: "media.delete",
      summary: `Media "${item.filename}" deleted`,
      metadata: {
        filename: item.filename,
      },
    });

    return { success: true };
  });

export const bulkDeleteMedia = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => bulkMediaDeleteSchema.parse(input))
  .handler(async ({ data }) => {
    const { session } = await requireMediaAccess("delete");
    const items = await db.query.media.findMany({
      where: inArray(mediaTable.id, data.ids),
      columns: {
        id: true,
        filename: true,
      },
    });
    type MediaRow = (typeof items)[number];

    for (const item of items as MediaRow[]) {
      const { item: scopedItem } = await requireMediaAccess("delete", item.id);
      if (!scopedItem) {
        continue;
      }
      await deleteObject(scopedItem.filename);
    }

    await db.delete(mediaTable).where(
      inArray(mediaTable.id, items.map((item: MediaRow) => item.id)),
    );

    await logActivity({
      actorUserId: session.user.id,
      entityType: "media",
      entityId: data.ids.join(","),
      action: "media.bulk_delete",
      summary: `${items.length} media items deleted`,
      metadata: {
        ids: items.map((item: MediaRow) => item.id),
      },
    });

    return { success: true, count: items.length };
  });

export const cleanupOrphanedMedia = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const parsed = (input ?? {}) as { dryRun?: boolean; limit?: number };
    return {
      dryRun: parsed.dryRun ?? false,
      limit: Math.min(Math.max(parsed.limit ?? 100, 1), 500),
    };
  })
  .handler(async ({ data }) => {
    const { session } = await requireMediaAccess("delete");

    const orphanRows = await db
      .select({
        id: mediaTable.id,
        filename: mediaTable.filename,
      })
      .from(mediaTable)
      .leftJoin(posts, eq(mediaTable.id, posts.featuredImageId))
      .where(and(isNull(posts.id), isNull(mediaTable.ownerId)))
      .orderBy(desc(mediaTable.createdAt))
      .limit(data.limit);

    if (data.dryRun || orphanRows.length === 0) {
      return {
        success: true as const,
        dryRun: data.dryRun,
        count: orphanRows.length,
        mediaIds: orphanRows.map((item) => item.id),
      };
    }

    for (const row of orphanRows) {
      await deleteObject(row.filename);
    }

    await db.delete(mediaTable).where(
      inArray(
        mediaTable.id,
        orphanRows.map((row) => row.id),
      ),
    );

    await logActivity({
      actorUserId: session.user.id,
      entityType: "media",
      entityId: orphanRows.map((row) => row.id).join(","),
      action: "media.cleanup_orphans",
      summary: `${orphanRows.length} orphaned media items cleaned`,
      metadata: {
        ids: orphanRows.map((row) => row.id),
      },
    });

    return {
      success: true as const,
      dryRun: false,
      count: orphanRows.length,
      mediaIds: orphanRows.map((item) => item.id),
    };
  });
