import { db } from '#/db/index';
import { subscribers, newsletters, newsletterLogs } from '#/db/schema';
import { resend } from './resend';
import { eq } from 'drizzle-orm';

export async function sendNewsletter(newsletterId: number) {
  const newsletter = await db.query.newsletters.findFirst({
    where: eq(newsletters.id, newsletterId),
  });

  if (!newsletter) throw new Error('Newsletter not found');
  if (newsletter.status === 'sent') throw new Error('Newsletter already sent');

  const activeSubscribers = await db.query.subscribers.findMany({
    where: eq(subscribers.status, 'active'),
  });

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
      await resend.emails.send({
        from: 'Blog <newsletter@resend.dev>', // Default testing domain or change to verified domain
        to: subscriber.email,
        subject: newsletter.subject,
        html: newsletter.content, // Assuming content is HTML for now
      });

      await db.insert(newsletterLogs).values({
        newsletterId,
        subscriberEmail: subscriber.email,
        status: 'sent',
      });
      successCount++;
    } catch (error: any) {
      console.error(`Failed to send newsletter to ${subscriber.email}:`, error);
      await db.insert(newsletterLogs).values({
        newsletterId,
        subscriberEmail: subscriber.email,
        status: 'failed',
        error: error.message,
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
