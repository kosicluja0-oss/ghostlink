import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface TrendResult {
  value: number;
  isPositive: boolean;
}

/**
 * Calculate trend percentage comparing current period to previous period.
 * Returns null if there's not enough data to calculate.
 */
export function calculateTrend(current: number, previous: number): TrendResult | null {
  if (previous === 0 && current === 0) return null;
  
  if (previous === 0) {
    return { value: 100, isPositive: true };
  }
  
  const percentChange = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(Math.round(percentChange * 10) / 10),
    isPositive: percentChange >= 0,
  };
}

interface PeriodStats {
  clicks: number;
  leads: number;
  sales: number;
  earnings: number;
}

interface UseTrendsResult {
  clicksTrend: TrendResult | null;
  leadsTrend: TrendResult | null;
  salesTrend: TrendResult | null;
  earningsTrend: TrendResult | null;
  conversionTrend: TrendResult | null;
  epcTrend: TrendResult | null;
  isLoading: boolean;
}

/**
 * Hook to calculate real trends using server-side aggregation.
 * Uses get_period_stats RPC to avoid downloading all clicks (fixes 1000-row limit).
 */
export function useTrends(periodDays = 7): UseTrendsResult {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['trends', periodDays, user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return { current: emptyStats(), previous: emptyStats() };
      }

      const now = new Date();
      const currentPeriodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
      const previousPeriodStart = new Date(now.getTime() - periodDays * 2 * 24 * 60 * 60 * 1000);

      // Use server-side aggregation instead of fetching all clicks
      const [currentResult, previousResult] = await Promise.all([
        supabase.rpc('get_period_stats', {
          p_user_id: user.id,
          p_start: currentPeriodStart.toISOString(),
          p_end: now.toISOString(),
        }),
        supabase.rpc('get_period_stats', {
          p_user_id: user.id,
          p_start: previousPeriodStart.toISOString(),
          p_end: currentPeriodStart.toISOString(),
        }),
      ]);

      if (currentResult.error) {
        console.error('Error fetching current period stats:', currentResult.error);
        return { current: emptyStats(), previous: emptyStats() };
      }
      if (previousResult.error) {
        console.error('Error fetching previous period stats:', previousResult.error);
        return { current: emptyStats(), previous: emptyStats() };
      }

      const current = currentResult.data as unknown as PeriodStats;
      const previous = previousResult.data as unknown as PeriodStats;

      return {
        current: {
          clicks: Number(current.clicks),
          leads: Number(current.leads),
          sales: Number(current.sales),
          earnings: Number(current.earnings),
        },
        previous: {
          clicks: Number(previous.clicks),
          leads: Number(previous.leads),
          sales: Number(previous.sales),
          earnings: Number(previous.earnings),
        },
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  });

  const trends = useMemo((): Omit<UseTrendsResult, 'isLoading'> => {
    if (!data) {
      return {
        clicksTrend: null,
        leadsTrend: null,
        salesTrend: null,
        earningsTrend: null,
        conversionTrend: null,
        epcTrend: null,
      };
    }

    const { current, previous } = data;

    const currentConversionRate =
      current.clicks > 0 ? ((current.leads + current.sales) / current.clicks) * 100 : 0;
    const previousConversionRate =
      previous.clicks > 0 ? ((previous.leads + previous.sales) / previous.clicks) * 100 : 0;

    const currentEPC = current.clicks > 0 ? current.earnings / current.clicks : 0;
    const previousEPC = previous.clicks > 0 ? previous.earnings / previous.clicks : 0;

    return {
      clicksTrend: calculateTrend(current.clicks, previous.clicks),
      leadsTrend: calculateTrend(current.leads, previous.leads),
      salesTrend: calculateTrend(current.sales, previous.sales),
      earningsTrend: calculateTrend(current.earnings, previous.earnings),
      conversionTrend: calculateTrend(currentConversionRate, previousConversionRate),
      epcTrend: calculateTrend(currentEPC, previousEPC),
    };
  }, [data]);

  return {
    ...trends,
    isLoading,
  };
}

function emptyStats(): PeriodStats {
  return { clicks: 0, leads: 0, sales: 0, earnings: 0 };
}
