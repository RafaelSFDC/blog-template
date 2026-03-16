import {
  queueNewsletterCampaign,
  unsubscribeNewsletterToken,
} from "#/server/newsletter-campaigns";

export async function sendNewsletter(newsletterId: number) {
  return queueNewsletterCampaign(newsletterId);
}

export async function unsubscribeSubscriber(_email: string, token: string) {
  await unsubscribeNewsletterToken(token);
  return { success: true };
}
