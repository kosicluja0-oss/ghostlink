import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { parsePlacement } from '@/components/analytics/PlacementBadge';

interface DailyClickPoint {
  date: string;
  clicks: number;
  leads: number;
  sales: number;
  earnings: number;
}

interface PlacementData {
  platform: string;
  placement: string;
  clicks: number;
  leads: number;
  sales: number;
  earnings: number;
}

interface CountryData {
  code: string;
  clicks: number;
  leads: number;
  sales: number;
  earnings: number;
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

const EMPTY_FUNNEL: FunnelStats = {
  totalClicks: 0,
  totalLeads: 0,
  totalSales: 0,
  epc: 0,
  conversionRate: 0,
};

/**
 * Fetches analytics for a single link using a server-side RPC function.
 * No row-count limits – aggregation happens in Postgres.
 */
export function useLinkAnalytics(linkId: string | null, days: number | null = 30): LinkAnalyticsResult {
  const { user } = useAuth();

  const {
    data: raw,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['link-analytics', linkId, days, user?.id],
    queryFn: async () => {
      if (!linkId || !user?.id) return null;
      const { data, error } = await supabase.rpc('get_link_analytics', {
        p_link_id: linkId,
        p_days: days,
      });
      if (error) throw error;
      return data as {
        daily_clicks: { date: string; clicks: number; leads: number; sales: number; earnings: number }[];
        placements: { source: string; clicks: number; leads: number; sales: number; earnings: number }[];
        countries: { code: string; clicks: number; leads: number; sales: number; earnings: number }[];
        funnel: {
          total_clicks: number;
          total_leads: number;
          total_sales: number;
          total_earnings: number;
          epc: number;
          conversion_rate: number;
        };
      };
    },
    enabled: !!linkId && !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Fill daily clicks for fixed-day ranges
  const dailyClicks = useMemo((): DailyClickPoint[] => {
    const serverDays = raw?.daily_clicks ?? [];
    if (days !== null) {
      const map = new Map<string, DailyClickPoint>();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        map.set(key, { date: key, clicks: 0, leads: 0, sales: 0, earnings: 0 });
      }
      serverDays.forEach((p) => map.set(p.date, { date: p.date, clicks: p.clicks, leads: p.leads, sales: p.sales, earnings: Number(p.earnings) }));
      return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    }
    return [...serverDays]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((p) => ({ date: p.date, clicks: p.clicks, leads: p.leads, sales: p.sales, earnings: Number(p.earnings) }));
  }, [raw, days]);

  const placements = useMemo((): PlacementData[] => {
    return (raw?.placements ?? []).map((p) => {
      const parsed = parsePlacement(p.source === 'direct' ? null : p.source);
      return {
        platform: parsed?.platform ?? 'direct',
        placement: parsed?.placement ?? 'Direct',
        clicks: p.clicks,
        leads: p.leads,
        sales: p.sales,
        earnings: Number(p.earnings),
      };
    });
  }, [raw]);

  const countries = useMemo((): CountryData[] => {
    return (raw?.countries ?? []).map((c) => ({
      code: c.code,
      clicks: c.clicks,
      leads: c.leads,
      sales: c.sales,
      earnings: Number(c.earnings),
    }));
  }, [raw]);

  const funnel = useMemo((): FunnelStats => {
    if (!raw?.funnel) return EMPTY_FUNNEL;
    const f = raw.funnel;
    return {
      totalClicks: f.total_clicks,
      totalLeads: f.total_leads,
      totalSales: f.total_sales,
      epc: Number(f.epc),
      conversionRate: Number(f.conversion_rate),
    };
  }, [raw]);

  return {
    dailyClicks,
    placements,
    countries,
    funnel,
    isLoading,
    error: error as Error | null,
  };
}
