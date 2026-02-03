import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLinks } from '@/hooks/useLinks';
import { useClicksRealtime } from '@/hooks/useClicksRealtime';
import { PerformanceReport } from '@/components/analytics/PerformanceReport';
import { parsePlacement } from '@/components/analytics/PlacementBadge';
import { Loader2 } from 'lucide-react';

const Report = () => {
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { links, isLoading: linksLoading } = useLinks();
  const { clicks, conversions, isLoading: analyticsLoading } = useClicksRealtime();
  const [isReady, setIsReady] = useState(false);

  const period = searchParams.get('period') || '7d';
  
  const periodLabel = useMemo(() => {
    switch (period) {
      case '7d': return 'Last 7 days';
      case '30d': return 'Last 30 days';
      case '90d': return 'Last 90 days';
      case 'all': return 'All time';
      default: return 'Last 7 days';
    }
  }, [period]);

  // Filter data by period
  const filteredClicks = useMemo(() => {
    const now = new Date();
    let cutoffDate: Date | null = null;
    
    switch (period) {
      case '7d':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = null;
    }

    if (!cutoffDate) return clicks;
    return clicks.filter(c => new Date(c.created_at) >= cutoffDate!);
  }, [clicks, period]);

  const filteredConversions = useMemo(() => {
    const now = new Date();
    let cutoffDate: Date | null = null;
    
    switch (period) {
      case '7d':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = null;
    }

    if (!cutoffDate) return conversions;
    return conversions.filter(c => new Date(c.created_at) >= cutoffDate!);
  }, [conversions, period]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalClicks = filteredClicks.length;
    const totalLeads = filteredConversions.filter(c => c.type === 'lead').length;
    const totalSales = filteredConversions.filter(c => c.type === 'sale').length;
    const totalRevenue = filteredConversions
      .filter(c => c.type === 'sale')
      .reduce((sum, c) => sum + Number(c.value), 0);
    const conversionRate = totalClicks > 0 ? ((totalLeads + totalSales) / totalClicks) * 100 : 0;

    return {
      totalClicks,
      totalLeads,
      totalSales,
      totalRevenue,
      conversionRate,
    };
  }, [filteredClicks, filteredConversions]);

  // Calculate top links
  const topLinks = useMemo(() => {
    const linkMap = new Map(links.map(l => [l.id, l]));
    const linkStats: Record<string, { alias: string; clicks: number; revenue: number }> = {};

    filteredClicks.forEach(click => {
      const link = linkMap.get(click.link_id);
      if (link) {
        if (!linkStats[link.id]) {
          linkStats[link.id] = { alias: link.alias, clicks: 0, revenue: 0 };
        }
        linkStats[link.id].clicks++;
      }
    });

    filteredConversions.filter(c => c.type === 'sale').forEach(conv => {
      if (conv.link_id && linkStats[conv.link_id]) {
        linkStats[conv.link_id].revenue += Number(conv.value);
      }
    });

    return Object.values(linkStats).sort((a, b) => b.clicks - a.clicks);
  }, [filteredClicks, filteredConversions, links]);

  // Calculate top placements
  const topPlacements = useMemo(() => {
    const placementCounts: Record<string, { platform: string; placement: string; count: number }> = {};
    
    filteredClicks.forEach(click => {
      const placementInfo = parsePlacement(click.source);
      const key = placementInfo 
        ? `${placementInfo.platform}-${placementInfo.placement}` 
        : 'direct-Direct';
      
      if (!placementCounts[key]) {
        placementCounts[key] = {
          platform: placementInfo?.platform || 'direct',
          placement: placementInfo?.placement || 'Direct',
          count: 0,
        };
      }
      placementCounts[key].count++;
    });

    const total = filteredClicks.length;
    return Object.values(placementCounts)
      .map(p => ({
        ...p,
        percentage: total > 0 ? Math.round((p.count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredClicks]);

  // Calculate top countries
  const topCountries = useMemo(() => {
    const countryCounts: Record<string, number> = {};
    
    filteredClicks.forEach(click => {
      const country = click.country || 'Unknown';
      if (country !== 'Unknown') {
        if (!countryCounts[country]) {
          countryCounts[country] = 0;
        }
        countryCounts[country]++;
      }
    });

    const total = Object.values(countryCounts).reduce((a, b) => a + b, 0);
    return Object.entries(countryCounts)
      .map(([code, count]) => ({
        code,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredClicks]);

  // Build recent transactions
  const recentTransactions = useMemo(() => {
    const linkMap = new Map(links.map(l => [l.id, l.alias]));
    const transactions: Array<{
      id: string;
      date: Date;
      type: 'click' | 'lead' | 'sale';
      linkAlias: string;
      amount: number | null;
      placement?: string;
    }> = [];

    filteredClicks.forEach(click => {
      transactions.push({
        id: `click-${click.id}`,
        date: new Date(click.created_at),
        type: 'click',
        linkAlias: linkMap.get(click.link_id) || 'Unknown',
        amount: null,
        placement: click.source || undefined,
      });
    });

    filteredConversions.forEach(conv => {
      transactions.push({
        id: `conv-${conv.id}`,
        date: new Date(conv.created_at),
        type: conv.type as 'lead' | 'sale',
        linkAlias: conv.link_id ? linkMap.get(conv.link_id) || 'Unknown' : 'Unknown',
        amount: conv.type === 'sale' ? Number(conv.value) : null,
        placement: conv.source || undefined,
      });
    });

    return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [filteredClicks, filteredConversions, links]);

  // Wait for data to load
  useEffect(() => {
    if (!authLoading && !linksLoading && !analyticsLoading) {
      // Small delay to ensure all data is ready
      const timer = setTimeout(() => setIsReady(true), 500);
      return () => clearTimeout(timer);
    }
  }, [authLoading, linksLoading, analyticsLoading]);

  // Show loading state
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-gray-500">Generating report...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">Please log in to view this report.</p>
      </div>
    );
  }

  return (
    <PerformanceReport
      stats={stats}
      topLinks={topLinks}
      topPlacements={topPlacements}
      topCountries={topCountries}
      recentTransactions={recentTransactions}
      periodLabel={periodLabel}
    />
  );
};

export default Report;
