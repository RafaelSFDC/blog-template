import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";
import { db } from "#/db/index";
import { comments } from "#/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminSession } from "#/lib/admin-auth";
import { commentStatusUpdateSchema, recordIdSchema } from "#/lib/cms-schema";

export const Route = createFileRoute("/api/comments/$id")({
  server: {
    handlers: {
      PATCH: async ({ params, request }) => {
        try {
          await requireAdminSession();

          const body = await request.json();
          const parsed = commentStatusUpdateSchema.parse({
            id: Number(params.id),
            status: body?.status,
          });

          const [updatedComment] = await db
            .update(comments)
            .set({ status: parsed.status })
            .where(eq(comments.id, parsed.id))
            .returning();

          if (!updatedComment) {
            return new Response("Comment not found", { status: 404 });
          }

          return Response.json(updatedComment);
        } catch (error: unknown) {
          if (error instanceof ZodError) {
            return new Response(error.issues[0]?.message || "Invalid comment update", {
              status: 400,
            });
          }

          console.error("Error updating comment:", error);
          const err = error as { message?: string; status?: number };
          if (err.message === "Unauthorized" || err.status === 401) {
            return new Response("Unauthorized", { status: 401 });
          }
          return new Response(err.message || "Internal Server Error", { status: 500 });
        }
      },
      DELETE: async ({ params }) => {
        try {
          await requireAdminSession();

          const parsed = recordIdSchema.parse({
            id: Number(params.id),
          });

          const [deletedComment] = await db
            .delete(comments)
            .where(eq(comments.id, parsed.id))
            .returning();

          if (!deletedComment) {
            return new Response("Comment not found", { status: 404 });
          }

          return Response.json({ message: "Comment deleted successfully" });
        } catch (error: unknown) {
          if (error instanceof ZodError) {
            return new Response(error.issues[0]?.message || "Invalid comment id", {
              status: 400,
            });
          }

          console.error("Error deleting comment:", error);
          const err = error as { message?: string; status?: number };
          if (err.message === "Unauthorized" || err.status === 401) {
            return new Response("Unauthorized", { status: 401 });
          }
          return new Response(err.message || "Internal Server Error", { status: 500 });
        }
      },
    }
  },
});
