export type TierType = 'free' | 'pro' | 'business';

export interface UserTier {
  type: TierType;
  maxLinks: number;
  hasFullAnalytics: boolean;
  hasBridgePages: boolean;
  price: number | null;
}

export const TIERS: Record<TierType, UserTier> = {
  free: {
    type: 'free',
    maxLinks: 25,
    hasFullAnalytics: false,
    hasBridgePages: false,
    price: null,
  },
  pro: {
    type: 'pro',
    maxLinks: 100,
    hasFullAnalytics: true,
    hasBridgePages: true,
    price: 9.99,
  },
  business: {
    type: 'business',
    maxLinks: 175,
    hasFullAnalytics: true,
    hasBridgePages: true,
    price: 14.99,
  },
};

export interface GhostLink {
  id: string;
  alias: string;
  targetUrl: string;
  hasBridgePage: boolean;
  bridgePageConfig?: BridgePageConfig;
  clicks: number;
  leads: number;
  sales: number;
  earnings: number;
  status: 'active' | 'archived';
  createdAt: Date;
}

export interface BridgePageConfig {
  headline: string;
  description: string;
  ctaText: string;
  delaySeconds: number;
}

export interface AnalyticsData {
  date: string;
  clicks: number;
  leads: number;
  sales: number;
  linkId?: string; // Optional: for per-link filtering
}

export interface DashboardStats {
  totalClicks: number;
  totalLeads: number;
  totalSales: number;
  totalEarnings: number;
  conversionRate: number;
  earningsPerClick: number;
}
