import { useState, useEffect } from 'react';
import type { AnalyticsData, DashboardStats, GhostLink } from '@/types';

// Link IDs for mock data
const LINK_IDS = ['1', '2', '3', '4'];

// Mock data generator for demo - generates 6 months of growing data with minute-level precision
const generateMockAnalytics = (): AnalyticsData[] => {
  const data: AnalyticsData[] = [];
  const now = new Date();
  
  // Generate daily data for the past 6 months (180 days) with exponential growth
  for (let i = 180; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(12, 0, 0, 0); // Normalize to noon for daily data
    
    // Generate data for each link
    LINK_IDS.forEach((linkId, linkIndex) => {
      // Different growth patterns for each link
      const progressFactor = (180 - i) / 180;
      const linkWeight = linkIndex === 0 ? 1.5 : linkIndex === 1 ? 1.0 : linkIndex === 2 ? 0.6 : 0.2;
      const growthMultiplier = 0.1 + Math.pow(progressFactor, 2) * 3 * linkWeight;
      const weekdayFactor = date.getDay() === 0 || date.getDay() === 6 ? 0.7 : 1;
      const randomVariation = 0.7 + Math.random() * 0.6;
      
      const baseClicks = Math.floor((10 + 100 * growthMultiplier) * weekdayFactor * randomVariation);
      const leads = Math.floor(baseClicks * (Math.random() * 0.1 + 0.08));
      const sales = Math.floor(leads * (Math.random() * 0.2 + 0.15));
      
      data.push({
        date: date.toISOString(),
        clicks: baseClicks,
        leads,
        sales,
        linkId,
      });
    });
  }
  
  // Generate minute-level data for the last 24 hours (1440 minutes)
  for (let i = 1440; i >= 0; i--) {
    const date = new Date(now);
    date.setMinutes(date.getMinutes() - i);
    date.setSeconds(0, 0);
    
    const hour = date.getHours();
    const hourFactor = hour >= 9 && hour <= 21 ? 1 : 0.3;
    
    // Generate data for each link
    LINK_IDS.forEach((linkId, linkIndex) => {
      const linkWeight = linkIndex === 0 ? 1.2 : linkIndex === 1 ? 0.8 : linkIndex === 2 ? 0.5 : 0.1;
      const minuteVariation = 0.5 + Math.random() * 1;
      
      const baseClicks = Math.floor((Math.random() * 2 + 0.5) * hourFactor * minuteVariation * linkWeight);
      const leads = Math.random() < 0.1 ? Math.floor(Math.random() * 2) : 0;
      const sales = Math.random() < 0.03 ? 1 : 0;
      
      data.push({
        date: date.toISOString(),
        clicks: baseClicks,
        leads,
        sales,
        linkId,
      });
    });
  }
  
  return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const generateMockLinks = (): GhostLink[] => [
  {
    id: '1',
    alias: 'summer-sale',
    targetUrl: 'https://example.com/products/summer-collection?ref=affiliate123',
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

  const totalEarnings = links.reduce((sum, l) => sum + l.earnings, 0);
  
  const stats: DashboardStats = {
    totalClicks: analyticsData.reduce((sum, d) => sum + d.clicks, 0),
    totalLeads: analyticsData.reduce((sum, d) => sum + d.leads, 0),
    totalSales: analyticsData.reduce((sum, d) => sum + d.sales, 0),
    totalEarnings,
    conversionRate: 0,
    earningsPerClick: 0,
  };

  if (stats.totalClicks > 0) {
    stats.conversionRate = ((stats.totalLeads + stats.totalSales) / stats.totalClicks) * 100;
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
