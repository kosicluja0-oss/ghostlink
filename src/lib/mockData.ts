/**
 * Mock Data Configuration
 * ========================
 * Set USE_MOCK_DATA to `false` to disable all mock data and use real database values.
 */
export const USE_MOCK_DATA = false;

import type { GhostLink, AnalyticsData, DashboardStats } from '@/types';

// ============================================================================
// LINK DEFINITIONS WITH DAILY HISTORY
// ============================================================================

interface LinkProfile {
  id: string;
  alias: string;
  targetUrl: string;
  hasBridgePage: boolean;
  bridgePageConfig?: {
    headline: string;
    description: string;
    ctaText: string;
    delaySeconds: number;
  };
  status: 'active' | 'archived';
  daysActive: number;
  // Traffic profile
  avgDailyClicks: number;
  clickVariance: number;
  leadRate: number; // percentage of clicks that become leads
  saleRate: number; // percentage of clicks that become sales
  avgSaleValue: number;
}

// Define our mock links with their traffic profiles
const LINK_PROFILES: LinkProfile[] = [
  {
    id: 'mock-youtube',
    alias: 'my-youtube-channel',
    targetUrl: 'https://www.youtube.com/c/mychannel',
    hasBridgePage: false,
    status: 'active',
    daysActive: 25,
    avgDailyClicks: 22,
    clickVariance: 8,
    leadRate: 0.03,
    saleRate: 0.01,
    avgSaleValue: 29,
  },
  {
    id: 'mock-ebook',
    alias: 'summer-ebook-promo',
    targetUrl: 'https://gumroad.com/l/my-ebook',
    hasBridgePage: true,
    bridgePageConfig: {
      headline: 'Get Your Free E-book!',
      description: 'Learn the secrets to success',
      ctaText: 'Download Now',
      delaySeconds: 3,
    },
    status: 'active',
    daysActive: 20,
    avgDailyClicks: 18,
    clickVariance: 6,
    leadRate: 0.08,
    saleRate: 0.05,
    avgSaleValue: 28,
  },
  {
    id: 'mock-newsletter',
    alias: 'newsletter-signup',
    targetUrl: 'https://newsletter.example.com/signup',
    hasBridgePage: true,
    bridgePageConfig: {
      headline: 'Join 10,000+ Subscribers',
      description: 'Weekly insights delivered to your inbox',
      ctaText: 'Subscribe Free',
      delaySeconds: 2,
    },
    status: 'active',
    daysActive: 15,
    avgDailyClicks: 20,
    clickVariance: 7,
    leadRate: 0.15,
    saleRate: 0.01,
    avgSaleValue: 28,
  },
  {
    id: 'mock-affiliate',
    alias: 'affiliate-product-x',
    targetUrl: 'https://affiliatesite.com/product-x?ref=ghost',
    hasBridgePage: false,
    status: 'active',
    daysActive: 10,
    avgDailyClicks: 15,
    clickVariance: 5,
    leadRate: 0.04,
    saleRate: 0.02,
    avgSaleValue: 29,
  },
  {
    id: 'mock-old-campaign',
    alias: 'old-promo-archived',
    targetUrl: 'https://oldpromo.example.com',
    hasBridgePage: false,
    status: 'archived',
    daysActive: 45,
    avgDailyClicks: 3,
    clickVariance: 2,
    leadRate: 0.02,
    saleRate: 0.00,
    avgSaleValue: 0,
  },
];

// ============================================================================
// DAILY HISTORY GENERATION (Bottom-Up Approach)
// ============================================================================

// ============================================================================
// DAILY HISTORY GENERATION (Bottom-Up Approach)
// ============================================================================

interface DailyLinkStats {
  date: string;
  linkId: string;
  clicks: number;
  leads: number;
  sales: number;
  earnings: number;
}

// Generate organic wavy data with natural variance
const generateOrganicValue = (
  baseValue: number,
  variance: number,
  dayIndex: number,
  seed: number
): number => {
  const wave = Math.sin((dayIndex + seed) * 0.3) * (variance * 0.5);
  const noise = (Math.random() - 0.5) * variance;
  const value = Math.max(0, Math.round(baseValue + wave + noise));
  return value;
};

/**
 * Generate daily history for all links
 * This is the SOURCE OF TRUTH for all mock data
 */
const generateDailyHistory = (): DailyLinkStats[] => {
  const history: DailyLinkStats[] = [];
  const now = new Date();
  
  LINK_PROFILES.forEach((profile, profileIndex) => {
    // Generate data for each day the link was active
    for (let dayOffset = profile.daysActive - 1; dayOffset >= 0; dayOffset--) {
      const date = new Date(now);
      date.setDate(date.getDate() - dayOffset);
      date.setHours(12, 0, 0, 0);
      
      // Generate organic clicks with variance
      const clicks = generateOrganicValue(
        profile.avgDailyClicks,
        profile.clickVariance,
        dayOffset,
        profileIndex + 1
      );
      
      // Calculate conversions based on clicks (probabilistic)
      let leads = 0;
      let sales = 0;
      
      for (let i = 0; i < clicks; i++) {
        if (Math.random() < profile.leadRate) leads++;
        if (Math.random() < profile.saleRate) sales++;
      }
      
      const earnings = sales * profile.avgSaleValue;
      
      history.push({
        date: date.toISOString(),
        linkId: profile.id,
        clicks,
        leads,
        sales,
        earnings,
      });
    }
  });
  
  return history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// ============================================================================
// AGGREGATION FUNCTIONS
// ============================================================================

/**
 * Aggregate daily history into GhostLink[] with totals
 */
const aggregateLinksFromHistory = (history: DailyLinkStats[]): GhostLink[] => {
  const now = new Date();
  
  return LINK_PROFILES.map((profile) => {
    // Get all history entries for this link
    const linkHistory = history.filter((h) => h.linkId === profile.id);
    
    // Calculate totals from daily history
    const totalClicks = linkHistory.reduce((sum, h) => sum + h.clicks, 0);
    const totalLeads = linkHistory.reduce((sum, h) => sum + h.leads, 0);
    const totalSales = linkHistory.reduce((sum, h) => sum + h.sales, 0);
    const totalEarnings = linkHistory.reduce((sum, h) => sum + h.earnings, 0);
    
    const createdAt = new Date(now.getTime() - profile.daysActive * 24 * 60 * 60 * 1000);
    
    return {
      id: profile.id,
      alias: profile.alias,
      targetUrl: profile.targetUrl,
      hasBridgePage: profile.hasBridgePage,
      bridgePageConfig: profile.bridgePageConfig,
      clicks: totalClicks,
      leads: totalLeads,
      sales: totalSales,
      earnings: totalEarnings,
      status: profile.status,
      createdAt,
    };
  });
};

/**
 * Aggregate daily history into AnalyticsData[] for the chart
 * This merges all links' daily data into the format the chart expects
 */
const aggregateAnalyticsFromHistory = (history: DailyLinkStats[]): AnalyticsData[] => {
  return history.map((h) => ({
    date: h.date,
    clicks: h.clicks,
    leads: h.leads,
    sales: h.sales,
    linkId: h.linkId,
  }));
};

/**
 * Calculate dashboard stats by summing link totals
 */
const aggregateStatsFromLinks = (links: GhostLink[]): DashboardStats => {
  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);
  const totalLeads = links.reduce((sum, l) => sum + l.leads, 0);
  const totalSales = links.reduce((sum, l) => sum + l.sales, 0);
  const totalEarnings = links.reduce((sum, l) => sum + l.earnings, 0);
  
  const conversionRate = totalClicks > 0 
    ? ((totalLeads + totalSales) / totalClicks) * 100 
    : 0;
  const earningsPerClick = totalClicks > 0 ? totalEarnings / totalClicks : 0;
  
  return {
    totalClicks,
    totalLeads,
    totalSales,
    totalEarnings,
    conversionRate,
    earningsPerClick,
  };
};

// ============================================================================
// CACHED DATA INSTANCES (Single Source of Truth)
// ============================================================================

let cachedDailyHistory: DailyLinkStats[] | null = null;
let cachedLinks: GhostLink[] | null = null;
let cachedAnalyticsData: AnalyticsData[] | null = null;
let cachedStats: DashboardStats | null = null;

/**
 * Get or generate the daily history (source of truth)
 */
const getDailyHistory = (): DailyLinkStats[] => {
  if (!cachedDailyHistory) {
    cachedDailyHistory = generateDailyHistory();
  }
  return cachedDailyHistory;
};

/**
 * Get mock links with stats aggregated from daily history
 */
export const getMockLinks = (): GhostLink[] => {
  if (!cachedLinks) {
    cachedLinks = aggregateLinksFromHistory(getDailyHistory());
  }
  return cachedLinks;
};

/**
 * Get mock analytics data aggregated from daily history
 */
export const getMockAnalyticsData = (): AnalyticsData[] => {
  if (!cachedAnalyticsData) {
    cachedAnalyticsData = aggregateAnalyticsFromHistory(getDailyHistory());
  }
  return cachedAnalyticsData;
};

/**
 * Get mock stats aggregated from links
 */
export const getMockStats = (): DashboardStats => {
  if (!cachedStats) {
    cachedStats = aggregateStatsFromLinks(getMockLinks());
  }
  return cachedStats;
};

/**
 * Reset all cached data (useful for testing)
 */
export const resetMockDataCache = (): void => {
  cachedDailyHistory = null;
  cachedLinks = null;
  cachedAnalyticsData = null;
  cachedStats = null;
};

// Legacy exports for backwards compatibility
export const generateMockAnalyticsData = getMockAnalyticsData;
export const calculateMockStats = () => getMockStats();
export const generateMockLinks = getMockLinks;
