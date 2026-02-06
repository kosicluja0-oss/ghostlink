import { useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { AnalyticsData, DashboardStats } from '@/types';

export interface ActivityEvent {
  id: string;
  event_type: 'click' | 'lead' | 'sale';
  link_id: string;
  link_alias: string;
  source: string | null;
  country: string | null;
  value: number;
  created_at: string;
}

interface UseDashboardDataOptions {
  activityLimit?: number;
}

/**
 * Server-side aggregated dashboard data hook.
 * Replaces useClicksRealtime to avoid the 1000-row Supabase limit.
 * All aggregation happens via PostgreSQL RPC functions.
 */
export function useDashboardData(options?: UseDashboardDataOptions) {
  const { activityLimit = 200 } = options || {};
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // 1. Aggregated stats (total clicks, leads, sales, earnings)
  const statsQuery = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_stats', { p_user_id: user!.id });
      if (error) {
        console.error('Error fetching stats:', error);
        return null;
      }
      return data as {
        total_clicks: number;
        total_leads: number;
        total_sales: number;
        total_earnings: number;
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60,
  });

  // 2. Daily analytics for chart (grouped by date + link)
  const chartQuery = useQuery({
    queryKey: ['dashboard-chart', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_daily_analytics', {
        p_user_id: user!.id,
        p_days: 180,
      });
      if (error) {
        console.error('Error fetching chart data:', error);
        return [];
      }
      return ((data as any[]) || []).map((d: any) => ({
        date: d.date + 'T12:00:00.000Z',
        clicks: d.clicks,
        leads: d.leads,
        sales: d.sales,
        earnings: Number(d.earnings ?? 0),
        linkId: d.linkId,
      })) as AnalyticsData[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60,
  });

  // 3. Recent activity (paginated, server-side)
  const activityQuery = useQuery({
    queryKey: ['dashboard-activity', user?.id, activityLimit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_recent_activity', {
        p_user_id: user!.id,
        p_limit: activityLimit,
        p_offset: 0,
      });
      if (error) {
        console.error('Error fetching activity:', error);
        return { events: [] as ActivityEvent[], total_count: 0 };
      }
      return data as unknown as { events: ActivityEvent[]; total_count: number };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });

  // 4. Traffic distribution (placements + countries, aggregated)
  const distributionQuery = useQuery({
    queryKey: ['dashboard-distribution', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_traffic_distribution', {
        p_user_id: user!.id,
      });
      if (error) {
        console.error('Error fetching distribution:', error);
        return {
          sources: [] as { source: string; count: number }[],
          countries: [] as { country: string; count: number }[],
        };
      }
      return data as {
        sources: { source: string; count: number }[];
        countries: { country: string; count: number }[];
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  });

  // Debounced cache invalidation on realtime events (3s debounce for bursts)
  const invalidateAll = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-chart'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-activity'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-distribution'] });
    }, 3000);
  }, [queryClient]);

  // Realtime subscriptions — trigger cache invalidation, not local state
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clicks' }, () =>
        invalidateAll()
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversions' }, () =>
        invalidateAll()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [user?.id, invalidateAll]);

  // Build DashboardStats from aggregated data
  const raw = statsQuery.data;
  const stats: DashboardStats = {
    totalClicks: raw?.total_clicks ?? 0,
    totalLeads: raw?.total_leads ?? 0,
    totalSales: raw?.total_sales ?? 0,
    totalEarnings: Number(raw?.total_earnings ?? 0),
    conversionRate:
      raw && raw.total_clicks > 0
        ? ((raw.total_leads + raw.total_sales) / raw.total_clicks) * 100
        : 0,
    earningsPerClick:
      raw && raw.total_clicks > 0 ? Number(raw.total_earnings) / raw.total_clicks : 0,
  };

  return {
    stats,
    chartData: chartQuery.data || [],
    recentActivity: activityQuery.data?.events || [],
    activityTotalCount: activityQuery.data?.total_count || 0,
    placementDistribution: distributionQuery.data?.sources || [],
    countryDistribution: distributionQuery.data?.countries || [],
    hasClicks: stats.totalClicks > 0,
    isLoading: statsQuery.isLoading || chartQuery.isLoading,
  };
}
