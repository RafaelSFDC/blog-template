import { createServerFn } from "@tanstack/react-start";
import { desc } from "drizzle-orm";
import { format } from "date-fns";
import { db } from "#/db/index";
import { subscribers } from "#/db/schema";
import { requireAdminSession } from "#/lib/admin-auth";

export const getDashboardSubscribers = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireAdminSession();
    return db.query.subscribers.findMany({
      orderBy: [desc(subscribers.createdAt)],
    });
  },
);

export const exportDashboardSubscribersCsv = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireAdminSession();
    const allSubscribers = await db.query.subscribers.findMany({
      orderBy: [desc(subscribers.createdAt)],
    });

    if (allSubscribers.length === 0) {
      return { data: null, error: "No subscribers found" };
    }

    const headers = ["Email", "Status", "Subscribed At"];
    const rows = allSubscribers.map((subscriber) => [
      subscriber.email,
      subscriber.status,
      subscriber.createdAt
        ? typeof subscriber.createdAt === "string"
          ? subscriber.createdAt
          : subscriber.createdAt.toISOString()
        : "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    return {
      data: csvContent,
      count: allSubscribers.length,
      filename: `lumina-subscribers-${format(new Date(), "yyyy-MM-dd")}.csv`,
    };
  },
);
