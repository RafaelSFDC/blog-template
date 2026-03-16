import { createServerFn } from "@tanstack/react-start";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "#/db/index";
import { media as mediaTable } from "#/db/schema";
import { requireMediaAccess, requireMediaReadAccess } from "#/lib/editorial-access";
import { deleteObject, putObject, sanitizeMediaFilename } from "#/lib/storage";
import { bulkMediaDeleteSchema, mediaUploadSchema } from "#/schemas/system";
import { captureServerException } from "#/server/sentry";
import { logActivity } from "#/server/activity-log";

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

    for (const item of items) {
      const { item: scopedItem } = await requireMediaAccess("delete", item.id);
      await deleteObject(scopedItem.filename);
    }

    await db.delete(mediaTable).where(inArray(mediaTable.id, items.map((item) => item.id)));

    await logActivity({
      actorUserId: session.user.id,
      entityType: "media",
      entityId: data.ids.join(","),
      action: "media.bulk_delete",
      summary: `${items.length} media items deleted`,
      metadata: {
        ids: items.map((item) => item.id),
      },
    });

    return { success: true, count: items.length };
  });
