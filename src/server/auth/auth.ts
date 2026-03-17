import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin as adminPlugin } from "better-auth/plugins";
import { db } from "#/server/db/index";
import * as schema from "#/server/db/schema";
import {
  ac,
  reader,
  author,
  editor,
  moderator,
  admin,
  superAdmin,
} from "#/lib/permissions";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Check if any user already exists
          const existingUser = await db
            .select({ id: schema.user.id })
            .from(schema.user)
            .limit(1);
          const isFirstUser = existingUser.length === 0;

          return {
            data: {
              ...user,
              role: isFirstUser ? "admin" : "reader",
            },
          };
        },
      },
      update: {
        before: async (user) => {
          // Prevent users from performing critical actions on themselves
          const { getAuthSession } = await import("#/server/auth/session");
          const session = await getAuthSession();
          const requestedRole = typeof user.role === "string" ? user.role : null;
          const requestedBan = user.banned === true;

          if (session?.user && session.user.id === user.id) {
            // Prevent self-role modification
            if (requestedRole) {
              const currentRole = session.user.role ?? null;
              if (currentRole && currentRole !== requestedRole) {
                throw new Error("You cannot change your own role");
              }
            }

            // Prevent self-banning
            if (requestedBan) {
              const isCurrentlyBanned = session.user.banned === true;
              if (!isCurrentlyBanned) {
                throw new Error("You cannot ban yourself");
              }
            }
          }
          return { data: user };
        },
      },
      delete: {
        before: async (user: { id: string }) => {
          const { getAuthSession } = await import("#/server/auth/session");
          const session = await getAuthSession();

          if (session?.user?.id === user.id) {
            throw new Error("You cannot delete your own account");
          }
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ user, url }) {
      const { resend: defaultResend } = await import(
        "#/server/integrations/resend"
      );
      const { Resend } = await import("resend");
      const { appSettings } = await import("#/server/db/schema");

      // Fetch settings for Resend
      const settings = await db.select().from(appSettings);
      const settingsObj: Record<string, string> = {};
      settings.forEach((s: { key: string; value: string }) => {
        settingsObj[s.key] = s.value;
      });

      const apiKey = settingsObj["resendApiKey"];
      const senderEmail =
        settingsObj["newsletterSenderEmail"] || "no-reply@resend.dev";
      const blogName = settingsObj["blogName"] || "Lumina";

      const resendClient = apiKey ? new Resend(apiKey) : defaultResend;

      await resendClient.emails.send({
        from: `${blogName} <${senderEmail}>`,
        to: user.email,
        subject: `Reset your password for ${blogName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 10px;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hi ${user.name || "there"},</p>
            <p>We received a request to reset your password for your <strong>${blogName}</strong> account.</p>
            <p>Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${url}" style="background-color: var(--primary); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
            <p style="color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              ${blogName} Team
            </p>
          </div>
        `,
      });
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  plugins: [
    tanstackStartCookies(),
    adminPlugin({
      ac,
      roles: {
        reader,
        author,
        editor,
        moderator,
        admin,
        superAdmin,
      },
    }),
  ],
});

