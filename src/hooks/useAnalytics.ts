import { useState, useEffect } from 'react';
import type { AnalyticsData, DashboardStats, GhostLink } from '@/types';

// Mock data generator for demo - generates 6 months of growing data
const generateMockAnalytics = (): AnalyticsData[] => {
  const data: AnalyticsData[] = [];
  const now = new Date();
  
  // Generate daily data for the past 6 months (180 days) with exponential growth
  for (let i = 180; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Exponential growth: starts low, accelerates toward today
    const progressFactor = (180 - i) / 180; // 0 at start → 1 today
    const growthMultiplier = 0.1 + Math.pow(progressFactor, 2) * 3; // Hockey stick curve
    const weekdayFactor = date.getDay() === 0 || date.getDay() === 6 ? 0.7 : 1;
    const randomVariation = 0.7 + Math.random() * 0.6; // 70-130% variation
    
    const baseClicks = Math.floor((20 + 380 * growthMultiplier) * weekdayFactor * randomVariation);
    const leads = Math.floor(baseClicks * (Math.random() * 0.1 + 0.08));
    const sales = Math.floor(leads * (Math.random() * 0.2 + 0.15));
    
    data.push({
      date: date.toISOString(),
      clicks: baseClicks,
      leads,
      sales,
    });
  }
  
  // Add more granular data for recent hours
  for (let i = 47; i >= 0; i--) {
    const date = new Date(now);
    date.setHours(date.getHours() - i);
    
    const hourFactor = date.getHours() >= 9 && date.getHours() <= 21 ? 1 : 0.4;
    const baseClicks = Math.floor((Math.random() * 30 + 10) * hourFactor);
    const leads = Math.floor(baseClicks * (Math.random() * 0.15 + 0.05));
    const sales = Math.floor(leads * (Math.random() * 0.3 + 0.1));
    
    data.push({
      date: date.toISOString(),
      clicks: baseClicks,
      leads,
      sales,
    });
  }
  
  return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const generateMockLinks = (): GhostLink[] => [
  {
    id: '1',
    alias: 'summer-sale',
    targetUrl: 'https://example.com/products/summer-collection?ref=affiliate123',
    hasBridgePage: true,
    bridgePageConfig: {
      headline: 'Exclusive Summer Deals',
      description: 'Get 40% off all summer items',
      ctaText: 'Claim Your Discount',
      delaySeconds: 3,
    },
    clicks: 2847,
    leads: 342,
    sales: 89,
    earnings: 1247.50,
    status: 'active',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    alias: 'tech-deals',
    targetUrl: 'https://techstore.com/deals?aff=ghost',
    hasBridgePage: false,
    clicks: 1523,
    leads: 198,
    sales: 45,
    earnings: 892.30,
    status: 'active',
    createdAt: new Date('2024-02-01'),
  },
  {
    id: '3',
    alias: 'fitness-guide',
    targetUrl: 'https://fitness.com/ebook?partner=ghostlink',
    hasBridgePage: true,
    bridgePageConfig: {
      headline: 'Transform Your Body',
      description: 'Free fitness guide for new subscribers',
      ctaText: 'Get Free Guide',
      delaySeconds: 5,
    },
    clicks: 956,
    leads: 287,
    sales: 62,
    earnings: 558.00,
    status: 'active',
    createdAt: new Date('2024-02-10'),
  },
  {
    id: '4',
    alias: 'old-promo',
    targetUrl: 'https://expired-deal.com/promo',
    hasBridgePage: false,
    clicks: 234,
    leads: 12,
    sales: 2,
    earnings: 45.00,
    status: 'archived',
    createdAt: new Date('2023-12-01'),
  },
];

export function useAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [links, setLinks] = useState<GhostLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setAnalyticsData(generateMockAnalytics());
      setLinks(generateMockLinks());
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const stats: DashboardStats = {
    totalClicks: analyticsData.reduce((sum, d) => sum + d.clicks, 0),
    totalLeads: analyticsData.reduce((sum, d) => sum + d.leads, 0),
    totalSales: analyticsData.reduce((sum, d) => sum + d.sales, 0),
    conversionRate: 0,
    earningsPerClick: 0,
  };

  if (stats.totalClicks > 0) {
    stats.conversionRate = ((stats.totalLeads + stats.totalSales) / stats.totalClicks) * 100;
    const totalEarnings = links.reduce((sum, l) => sum + l.earnings, 0);
    stats.earningsPerClick = totalEarnings / stats.totalClicks;
  }

  const addLink = (link: Omit<GhostLink, 'id' | 'clicks' | 'leads' | 'sales' | 'earnings' | 'createdAt'>) => {
    const newLink: GhostLink = {
      ...link,
      id: Date.now().toString(),
      clicks: 0,
      leads: 0,
      sales: 0,
      earnings: 0,
      createdAt: new Date(),
    };
    setLinks(prev => [newLink, ...prev]);
  };

  const archiveLink = (id: string) => {
    setLinks(prev => prev.map(link => 
      link.id === id ? { ...link, status: 'archived' as const } : link
    ));
  };

  const restoreLink = (id: string) => {
    setLinks(prev => prev.map(link => 
      link.id === id ? { ...link, status: 'active' as const } : link
    ));
  };

  return {
    analyticsData,
    links,
    stats,
    isLoading,
    addLink,
    archiveLink,
    restoreLink,
  };
}
