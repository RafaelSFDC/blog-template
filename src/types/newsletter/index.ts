export type NewsletterTemplatePost = {
  id: number;
  title: string;
  excerpt: string | null;
  slug: string;
  publishedAt: string | Date | null;
};
