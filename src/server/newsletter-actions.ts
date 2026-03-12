import { createServerFn } from "@tanstack/react-start";
import { db } from "#/db/index";
import { subscribers } from "#/db/schema";
import { eq } from "drizzle-orm";
import { newsletterSubscribeSchema } from "#/lib/cms-schema";

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => newsletterSubscribeSchema.parse(input))
  .handler(async ({ data }) => {
    const email = data.email.toLowerCase();
    try {
      // Check if already subscribed
      const existing = await db.query.subscribers.findFirst({
        where: eq(subscribers.email, email),
      });

      if (existing) {
        if (existing.status === 'active') {
          return { success: true, message: "You're already subscribed!" };
        } else {
          // Reactivate
          await db.update(subscribers)
            .set({ status: 'active' })
            .where(eq(subscribers.id, existing.id));
          return { success: true, message: "Welcome back! Reactivated." };
        }
      }

      await db.insert(subscribers).values({
        email,
        status: "active",
      });

      return { success: true, message: "Thanks for joining the tribe!" };
    } catch (err) {
      console.error(err);
      return { success: false, message: "Subscription failed. Try again later." };
    }
  });
