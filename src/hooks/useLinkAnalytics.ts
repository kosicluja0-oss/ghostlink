import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { parsePlacement } from '@/components/analytics/PlacementBadge';

interface DailyClickPoint {
  date: string;
  clicks: number;
}

interface PlacementData {
  platform: string;
  placement: string;
  count: number;
  percentage: number;
}

interface CountryData {
  code: string;
  count: number;
  percentage: number;
}

interface FunnelStats {
  totalClicks: number;
  totalLeads: number;
  totalSales: number;
  epc: number;
  conversionRate: number;
}

interface LinkAnalyticsResult {
  dailyClicks: DailyClickPoint[];
  placements: PlacementData[];
  countries: CountryData[];
  funnel: FunnelStats;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetches 30-day analytics for a single link.
 * 2 DB queries max: clicks + conversions.
 */
export function useLinkAnalytics(linkId: string | null): LinkAnalyticsResult {
  const { user } = useAuth();

  const cutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString();
  }, []);

  // Query 1: clicks for this link (last 30 days)
  const {
    data: clicks,
    isLoading: clicksLoading,
    error: clicksError,
  } = useQuery({
    queryKey: ['link-analytics-clicks', linkId, user?.id],
    queryFn: async () => {
      if (!linkId || !user?.id) return [];
      const { data, error } = await supabase
        .from('clicks')
        .select('id, created_at, source, country')
        .eq('link_id', linkId)
        .gte('created_at', cutoff)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!linkId && !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Query 2: conversions for clicks belonging to this link
  const clickIds = useMemo(() => (clicks ?? []).map((c) => c.id), [clicks]);

  const {
    data: conversions,
    isLoading: conversionsLoading,
    error: conversionsError,
  } = useQuery({
    queryKey: ['link-analytics-conversions', linkId, clickIds.length, user?.id],
    queryFn: async () => {
      if (!user?.id || clickIds.length === 0) return [];
      // Batch in chunks of 200 to stay under Supabase filter limits
      const all: { type: string; value: number }[] = [];
      for (let i = 0; i < clickIds.length; i += 200) {
        const chunk = clickIds.slice(i, i + 200);
        const { data, error } = await supabase
          .from('conversions')
          .select('type, value')
          .in('click_id', chunk);
        if (error) throw error;
        if (data) all.push(...data);
      }
      return all;
    },
    enabled: !!user?.id && clickIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  // Compute derived data
  const dailyClicks = useMemo((): DailyClickPoint[] => {
    const map = new Map<string, number>();
    // Pre-fill 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map.set(key, 0);
    }
    (clicks ?? []).forEach((c) => {
      const key = c.created_at.slice(0, 10);
      if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([date, count]) => ({
      date,
      clicks: count,
    }));
  }, [clicks]);

  const placements = useMemo((): PlacementData[] => {
    const countMap = new Map<string, { platform: string; placement: string; count: number }>();
    const total = (clicks ?? []).length || 1;
    (clicks ?? []).forEach((c) => {
      const parsed = parsePlacement(c.source);
      const key = parsed
        ? `${parsed.platform}:${parsed.placement}`
        : 'direct:Direct';
      const existing = countMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        countMap.set(key, {
          platform: parsed?.platform ?? 'direct',
          placement: parsed?.placement ?? 'Direct',
          count: 1,
        });
      }
    });
    return Array.from(countMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((p) => ({
        ...p,
        percentage: Math.round((p.count / total) * 100),
      }));
  }, [clicks]);

  const countries = useMemo((): CountryData[] => {
    const countMap = new Map<string, number>();
    const total = (clicks ?? []).length || 1;
    (clicks ?? []).forEach((c) => {
      const code = c.country?.toUpperCase() || 'UNKNOWN';
      countMap.set(code, (countMap.get(code) || 0) + 1);
    });
    return Array.from(countMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([code, count]) => ({
        code,
        count,
        percentage: Math.round((count / total) * 100),
      }));
  }, [clicks]);

  const funnel = useMemo((): FunnelStats => {
    const totalClicks = (clicks ?? []).length;
    const leads = (conversions ?? []).filter((c) => c.type === 'lead').length;
    const sales = (conversions ?? []).filter((c) => c.type === 'sale').length;
    const totalRevenue = (conversions ?? [])
      .filter((c) => c.type === 'sale')
      .reduce((sum, c) => sum + Number(c.value), 0);
    return {
      totalClicks,
      totalLeads: leads,
      totalSales: sales,
      epc: totalClicks > 0 ? totalRevenue / totalClicks : 0,
      conversionRate: totalClicks > 0 ? (leads / totalClicks) * 100 : 0,
    };
  }, [clicks, conversions]);

  return {
    dailyClicks,
    placements,
    countries,
    funnel,
    isLoading: clicksLoading || conversionsLoading,
    error: (clicksError ?? conversionsError) as Error | null,
  };
}
