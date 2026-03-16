export interface SettingsFormValues {
  blogName: string;
  blogDescription: string;
  blogLogo: string;
  fontFamily: string;
  themeVariant: string;
  siteUrl: string;
  defaultMetaTitle: string;
  defaultMetaDescription: string;
  defaultOgImage: string;
  twitterHandle: string;
  stripeMonthlyPriceId: string;
  stripeAnnualPriceId: string;
  newsletterSenderEmail: string;
  doubleOptInEnabled: boolean;
  membershipGracePeriodDays: number;
  robotsIndexingEnabled: boolean;
  socialLinks: Array<{
    platform: string;
    url: string;
  }>;
}

export interface NewsletterCampaignFormValues {
  subject: string;
  preheader: string;
  content: string;
  postId?: number;
  segment: "all_active" | "premium_members" | "free_subscribers";
  scheduledAt: string;
}

export interface WebhookFormValues {
  name: string;
  url: string;
  event: "post.published";
  secret: string;
}
