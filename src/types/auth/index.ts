export interface AppSessionUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  role?: string | null;
  banned?: boolean | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  stripeCurrentPeriodEnd?: Date | null;
}

export interface AppAuthSession {
  user: AppSessionUser;
  session: Record<string, object>;
}
