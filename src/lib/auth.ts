import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin as adminPlugin } from 'better-auth/plugins'
import { db } from '../db/index'
import * as schema from '../db/schema'
import { ac, reader, author, editor, moderator, admin, superAdmin } from './permissions'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema,
  }),
  databaseHooks: {
    user: {
      create: {
        before: async (user: any) => {
          const users = await db.query.user.findFirst();
          return {
            ...user,
            role: users ? 'reader' : 'admin',
          } as any;
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ user, url }: { user: any; url: string }) {
      const { resend: defaultResend } = await import('./resend');
      const { Resend } = await import('resend');
      const { appSettings } = await import('../db/schema');
      
      // Fetch settings for Resend
      const settings = await db.select().from(appSettings);
      const settingsObj: Record<string, string> = {};
      settings.forEach((s: { key: string; value: string }) => {
        settingsObj[s.key] = s.value;
      });

      const apiKey = settingsObj['resendApiKey'];
      const senderEmail = settingsObj['newsletterSenderEmail'] || 'no-reply@resend.dev';
      const blogName = settingsObj['blogName'] || 'VibeZine';
      
      const resendClient = apiKey ? new Resend(apiKey) : defaultResend;

      await resendClient.emails.send({
        from: `${blogName} <${senderEmail}>`,
        to: user.email,
        subject: `Reset your password for ${blogName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 10px;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hi ${user.name || 'there'},</p>
            <p>We received a request to reset your password for your <strong>${blogName}</strong> account.</p>
            <p>Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${url}" style="background-color: #ff5c00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
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
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
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
})
