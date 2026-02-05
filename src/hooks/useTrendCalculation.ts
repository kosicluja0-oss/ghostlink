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
    // If previous is 0 but current has value, show +100%
    return { value: 100, isPositive: true };
  }
  
  const percentChange = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(Math.round(percentChange * 10) / 10), // Round to 1 decimal
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
  conversionTrend: TrendResult | null;
  epcTrend: TrendResult | null;
  isLoading: boolean;
}

/**
 * Hook to calculate real trends by comparing current period vs previous period.
 * Period length defaults to 7 days.
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

      // Fetch user's links first
      const { data: links } = await supabase
        .from('links')
        .select('id')
        .eq('user_id', user.id);

      const linkIds = links?.map((l) => l.id) || [];

      if (linkIds.length === 0) {
        return { current: emptyStats(), previous: emptyStats() };
      }

      // Fetch clicks for both periods
      const [currentClicksResult, previousClicksResult] = await Promise.all([
        supabase
          .from('clicks')
          .select('id, link_id, created_at')
          .in('link_id', linkIds)
          .gte('created_at', currentPeriodStart.toISOString()),
        supabase
          .from('clicks')
          .select('id, link_id, created_at')
          .in('link_id', linkIds)
          .gte('created_at', previousPeriodStart.toISOString())
          .lt('created_at', currentPeriodStart.toISOString()),
      ]);

      const currentClicks = currentClicksResult.data || [];
      const previousClicks = previousClicksResult.data || [];

      // Fetch conversions for both periods
      const currentClickIds = currentClicks.map((c) => c.id);
      const previousClickIds = previousClicks.map((c) => c.id);

      const [currentConversionsResult, previousConversionsResult] = await Promise.all([
        currentClickIds.length > 0
          ? supabase
              .from('conversions')
              .select('type, value')
              .in('click_id', currentClickIds)
          : Promise.resolve({ data: [] }),
        previousClickIds.length > 0
          ? supabase
              .from('conversions')
              .select('type, value')
              .in('click_id', previousClickIds)
          : Promise.resolve({ data: [] }),
      ]);

      const currentConversions = currentConversionsResult.data || [];
      const previousConversions = previousConversionsResult.data || [];

      const currentStats = calculatePeriodStats(currentClicks.length, currentConversions);
      const previousStats = calculatePeriodStats(previousClicks.length, previousConversions);

      return { current: currentStats, previous: previousStats };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5,
  });

  const trends = useMemo((): Omit<UseTrendsResult, 'isLoading'> => {
    if (!data) {
      return {
        clicksTrend: null,
        leadsTrend: null,
        salesTrend: null,
        conversionTrend: null,
        epcTrend: null,
      };
    }

    const { current, previous } = data;

    // Calculate conversion rates
    const currentConversionRate =
      current.clicks > 0 ? ((current.leads + current.sales) / current.clicks) * 100 : 0;
    const previousConversionRate =
      previous.clicks > 0 ? ((previous.leads + previous.sales) / previous.clicks) * 100 : 0;

    // Calculate EPC
    const currentEPC = current.clicks > 0 ? current.earnings / current.clicks : 0;
    const previousEPC = previous.clicks > 0 ? previous.earnings / previous.clicks : 0;

    return {
      clicksTrend: calculateTrend(current.clicks, previous.clicks),
      leadsTrend: calculateTrend(current.leads, previous.leads),
      salesTrend: calculateTrend(current.sales, previous.sales),
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

function calculatePeriodStats(
  clickCount: number,
  conversions: Array<{ type: string; value: number }>
): PeriodStats {
  let leads = 0;
  let sales = 0;
  let earnings = 0;

  conversions.forEach((conv) => {
    if (conv.type === 'lead') {
      leads++;
    } else if (conv.type === 'sale') {
      sales++;
      earnings += Number(conv.value) || 0;
    }
  });

  return { clicks: clickCount, leads, sales, earnings };
}
