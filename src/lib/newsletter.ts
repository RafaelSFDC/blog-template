import { db } from '#/db/index';
import { subscribers, newsletters, newsletterLogs, appSettings } from '#/db/schema';
import { resend as defaultResend } from './resend';
import { eq } from 'drizzle-orm';
import { captureServerException } from '#/server/sentry';

export async function sendNewsletter(newsletterId: number) {
  const { Resend } = await import('resend');
  const newsletter = await db.query.newsletters.findFirst({
    where: eq(newsletters.id, newsletterId),
  });

  if (!newsletter) throw new Error('Newsletter not found');
  if (newsletter.status === 'sent') throw new Error('Newsletter already sent');

  const activeSubscribers = await db.query.subscribers.findMany({
    where: eq(subscribers.status, 'active'),
  });

  // Fetch settings for Resend
  const settings = await db.select().from(appSettings);
  const settingsObj: Record<string, string> = {};
  settings.forEach((s: { key: string; value: string }) => {
    settingsObj[s.key] = s.value;
  });

  const apiKey = settingsObj['resendApiKey'];
  const senderEmail = settingsObj['newsletterSenderEmail'] || 'newsletter@resend.dev';
  
  // Use dynamic resend client if API key is provided in settings, otherwise fallback to env-based one
  const resendClient = apiKey ? new Resend(apiKey) : defaultResend;

  if (activeSubscribers.length === 0) {
    return { count: 0, message: 'No active subscribers found' };
  }

  // Update status to sending
  await db.update(newsletters)
    .set({ status: 'sending' })
    .where(eq(newsletters.id, newsletterId));

  let successCount = 0;
  let failCount = 0;

  // Ideally this would be a background job or use Resend's batching
  // For now, simplicity:
  for (const subscriber of activeSubscribers) {
    try {
      await resendClient.emails.send({
        from: `Blog <${senderEmail}>`, // Use configured sender email
        to: subscriber.email,
        subject: newsletter.subject,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            ${newsletter.content}
            <hr style="margin-top: 40px; border: 0; border-top: 1px solid #eee;" />
            <p style="font-size: 12px; color: #666; text-align: center;">
              You received this because you are subscribed to our newsletter. 
              <a href="${process.env.APP_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(subscriber.email)}&token=${subscriber.id}">Unsubscribe</a>
            </p>
          </div>
        `,
      });

      await db.insert(newsletterLogs).values({
        newsletterId,
        subscriberEmail: subscriber.email,
        status: 'sent',
      });
      successCount++;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      captureServerException(error, {
        tags: {
          area: 'server',
          flow: 'newsletter-send',
        },
        extras: {
          newsletterId,
          subscriberEmail: subscriber.email,
        },
      });
      console.error(`Failed to send newsletter to ${subscriber.email}:`, error);
      await db.insert(newsletterLogs).values({
        newsletterId,
        subscriberEmail: subscriber.email,
        status: 'failed',
        error: errorMessage,
      });
      failCount++;
    }
  }

  // Update status to sent
  await db.update(newsletters)
    .set({ 
      status: 'sent',
      sentAt: new Date(),
    })
    .where(eq(newsletters.id, newsletterId));

  return { successCount, failCount };
}

export async function unsubscribeSubscriber(email: string, token: string) {
  // Simple verification: token is the subscriber ID for now
  const subscriber = await db.query.subscribers.findFirst({
    where: eq(subscribers.email, email),
  });

  if (!subscriber || String(subscriber.id) !== token) {
    throw new Error('Invalid unsubscribe request');
  }

  await db.update(subscribers)
    .set({ status: 'unsubscribed' })
    .where(eq(subscribers.id, subscriber.id));

  return { success: true };
}
