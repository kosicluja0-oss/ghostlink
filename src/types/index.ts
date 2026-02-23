export type TierType = 'free' | 'pro' | 'business';

export interface UserTier {
  type: TierType;
  maxLinks: number;
  hasFullAnalytics: boolean;
  price: number | null;
}

export const TIERS: Record<TierType, UserTier> = {
  free: {
    type: 'free',
    maxLinks: 25,
    hasFullAnalytics: false,
    price: null,
  },
  pro: {
    type: 'pro',
    maxLinks: 100,
    hasFullAnalytics: true,
    price: 10,
  },
  business: {
    type: 'business',
    maxLinks: 175,
    hasFullAnalytics: true,
    price: 15,
  },
};

export interface GhostLink {
  id: string;
  alias: string;
  targetUrl: string;
  clicks: number;
  leads: number;
  sales: number;
  earnings: number;
  status: 'active' | 'archived';
  createdAt: Date;
}

export interface AnalyticsData {
  date: string;
  clicks: number;
  leads: number;
  sales: number;
  earnings: number;
  linkId?: string;
}

export interface DashboardStats {
  totalClicks: number;
  totalLeads: number;
  totalSales: number;
  totalEarnings: number;
  conversionRate: number;
  earningsPerClick: number;
}
