/**
 * Mock Data Configuration
 * ========================
 * Set USE_MOCK_DATA to `false` to disable all mock data and use real database values.
 */
export const USE_MOCK_DATA = true;

import type { GhostLink, AnalyticsData, DashboardStats } from '@/types';

// Helper to generate organic random variance
const randomInRange = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generate organic wavy data with natural variance
const generateOrganicValue = (
  baseValue: number,
  variance: number,
  dayIndex: number,
  seed: number
): number => {
  // Create a wave pattern using sine for organic feel
  const wave = Math.sin((dayIndex + seed) * 0.3) * (variance * 0.5);
  const noise = (Math.random() - 0.5) * variance;
  const value = Math.max(0, Math.round(baseValue + wave + noise));
  return value;
};

/**
 * Generate 30 days of "Starter Profile" analytics data
 * - Total revenue: $400-$950
 * - Traffic: 20-50 clicks per day with variance
 * - Realistic conversion ratios
 */
export const generateMockAnalyticsData = (): AnalyticsData[] => {
  const data: AnalyticsData[] = [];
  const now = new Date();
  
  // Link IDs for distribution
  const linkIds = [
    'mock-youtube',
    'mock-ebook',
    'mock-newsletter',
    'mock-affiliate',
  ];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(12, 0, 0, 0);
    
    // Generate data for each link with different characteristics
    linkIds.forEach((linkId, linkIndex) => {
      let clicks = 0;
      let leads = 0;
      let sales = 0;
      
      if (linkId === 'mock-youtube') {
        // High clicks, low sales
        clicks = generateOrganicValue(18, 10, i, 1);
        leads = Math.floor(clicks * 0.03); // 3% lead rate
        sales = Math.floor(clicks * 0.01); // 1% sale rate
      } else if (linkId === 'mock-ebook') {
        // Moderate clicks, high sales
        clicks = generateOrganicValue(12, 6, i, 2);
        leads = Math.floor(clicks * 0.08); // 8% lead rate
        sales = Math.floor(clicks * 0.05); // 5% sale rate
      } else if (linkId === 'mock-newsletter') {
        // High leads focus
        clicks = generateOrganicValue(10, 5, i, 3);
        leads = Math.floor(clicks * 0.15); // 15% lead rate
        sales = Math.floor(clicks * 0.01); // 1% sale rate
      } else if (linkId === 'mock-affiliate') {
        // Low traffic
        clicks = generateOrganicValue(5, 3, i, 4);
        leads = Math.floor(clicks * 0.04); // 4% lead rate
        sales = Math.floor(clicks * 0.02); // 2% sale rate
      }
      
      // Only add entries with some activity (but include zeros for continuity)
      data.push({
        date: date.toISOString(),
        clicks,
        leads,
        sales,
        linkId,
      });
    });
  }
  
  return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/**
 * Calculate mock dashboard stats from analytics data
 */
export const calculateMockStats = (analyticsData: AnalyticsData[]): DashboardStats => {
  const totalClicks = analyticsData.reduce((sum, d) => sum + d.clicks, 0);
  const totalLeads = analyticsData.reduce((sum, d) => sum + d.leads, 0);
  const totalSales = analyticsData.reduce((sum, d) => sum + d.sales, 0);
  
  // Calculate earnings: average $25-35 per sale to hit $400-$950 target
  // With ~20 sales expected, this gives us the right range
  const avgSaleValue = 28;
  const totalEarnings = totalSales * avgSaleValue;
  
  const conversionRate = totalClicks > 0 
    ? ((totalLeads + totalSales) / totalClicks) * 100 
    : 0;
  const earningsPerClick = totalClicks > 0 ? totalEarnings / totalClicks : 0;
  
  return {
    totalClicks,
    totalLeads,
    totalSales,
    conversionRate,
    earningsPerClick,
  };
};

/**
 * Generate mock links for the "Your Links" table
 */
export const generateMockLinks = (): GhostLink[] => {
  const now = new Date();
  
  const mockLinks: GhostLink[] = [
    {
      id: 'mock-youtube',
      alias: 'my-youtube-channel',
      targetUrl: 'https://www.youtube.com/c/mychannel',
      hasBridgePage: false,
      clicks: 542,
      leads: 16,
      sales: 5,
      earnings: 145,
      status: 'active',
      createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
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
      clicks: 360,
      leads: 29,
      sales: 18,
      earnings: 504,
      status: 'active',
      createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
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
      clicks: 298,
      leads: 45,
      sales: 3,
      earnings: 84,
      status: 'active',
      createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    },
    {
      id: 'mock-affiliate',
      alias: 'affiliate-product-x',
      targetUrl: 'https://affiliatesite.com/product-x?ref=ghost',
      hasBridgePage: false,
      clicks: 150,
      leads: 6,
      sales: 3,
      earnings: 87,
      status: 'active',
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    },
    {
      id: 'mock-old-campaign',
      alias: 'old-promo-archived',
      targetUrl: 'https://oldpromo.example.com',
      hasBridgePage: false,
      clicks: 89,
      leads: 2,
      sales: 0,
      earnings: 0,
      status: 'archived',
      createdAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
    },
  ];
  
  return mockLinks;
};

// Pre-generated mock data instances (cached for consistency)
let cachedAnalyticsData: AnalyticsData[] | null = null;
let cachedStats: DashboardStats | null = null;
let cachedLinks: GhostLink[] | null = null;

export const getMockAnalyticsData = (): AnalyticsData[] => {
  if (!cachedAnalyticsData) {
    cachedAnalyticsData = generateMockAnalyticsData();
  }
  return cachedAnalyticsData;
};

export const getMockStats = (): DashboardStats => {
  if (!cachedStats) {
    cachedStats = calculateMockStats(getMockAnalyticsData());
  }
  return cachedStats;
};

export const getMockLinks = (): GhostLink[] => {
  if (!cachedLinks) {
    cachedLinks = generateMockLinks();
  }
  return cachedLinks;
};
