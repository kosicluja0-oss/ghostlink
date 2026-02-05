import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useMemo } from 'react';

interface ClickHistoryPoint {
  timestamp: string;
  count: number;
}

interface UseClickHistoryOptions {
  linkId?: string;
  hours?: number; // Default 24 hours for sparklines
}

/**
 * Hook to fetch real click history data for sparklines.
 * Groups clicks by hour for the specified time range.
 */
export function useClickHistory({ linkId, hours = 24 }: UseClickHistoryOptions = {}) {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['click-history', linkId, hours, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);

      let query = supabase
        .from('clicks')
        .select('created_at, link_id')
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: true });

      // If linkId is provided, filter by it
      if (linkId) {
        query = query.eq('link_id', linkId);
      }

      const { data: clicks, error } = await query;

      if (error) {
        console.error('Error fetching click history:', error);
        return [];
      }

      return clicks || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });

  // Group clicks by hour for sparkline data
  const sparklineData = useMemo(() => {
    if (!data || data.length === 0) {
      // Return empty array of correct length for consistent sparkline
      return Array.from({ length: Math.min(hours, 12) }, () => 0);
    }

    const now = Date.now();
    const bucketCount = Math.min(hours, 12); // Max 12 data points for sparkline
    const bucketSize = (hours * 60 * 60 * 1000) / bucketCount;
    const buckets: number[] = Array(bucketCount).fill(0);

    data.forEach((click) => {
      const clickTime = new Date(click.created_at).getTime();
      const bucketIndex = Math.floor((now - clickTime) / bucketSize);
      if (bucketIndex >= 0 && bucketIndex < bucketCount) {
        // Reverse index so oldest is first
        buckets[bucketCount - 1 - bucketIndex]++;
      }
    });

    return buckets;
  }, [data, hours]);

  // Group by hour for detailed timeline
  const hourlyData = useMemo((): ClickHistoryPoint[] => {
    if (!data) return [];

    const hourMap = new Map<string, number>();

    data.forEach((click) => {
      const date = new Date(click.created_at);
      const hourKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:00`;
      hourMap.set(hourKey, (hourMap.get(hourKey) || 0) + 1);
    });

    return Array.from(hourMap.entries())
      .map(([timestamp, count]) => ({ timestamp, count }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }, [data]);

  const totalClicks = data?.length || 0;

  return {
    sparklineData,
    hourlyData,
    totalClicks,
    isLoading,
    error,
  };
}

/**
 * Hook to fetch click history for multiple links at once.
 * More efficient than calling useClickHistory multiple times.
 */
export function useMultipleLinksClickHistory(linkIds: string[], hours = 24) {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['click-history-multiple', linkIds.sort().join(','), hours, user?.id],
    queryFn: async () => {
      if (!user?.id || linkIds.length === 0) return {};

      const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);

      const { data: clicks, error } = await supabase
        .from('clicks')
        .select('created_at, link_id')
        .in('link_id', linkIds)
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching multiple click histories:', error);
        return {};
      }

      // Group clicks by link_id
      const byLink: Record<string, typeof clicks> = {};
      clicks?.forEach((click) => {
        if (!byLink[click.link_id]) {
          byLink[click.link_id] = [];
        }
        byLink[click.link_id].push(click);
      });

      return byLink;
    },
    enabled: !!user?.id && linkIds.length > 0,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  });

  // Calculate sparkline data for each link
  const sparklineDataByLink = useMemo(() => {
    const result: Record<string, number[]> = {};
    const now = Date.now();
    const bucketCount = Math.min(hours, 12);
    const bucketSize = (hours * 60 * 60 * 1000) / bucketCount;

    linkIds.forEach((linkId) => {
      const clicks = data?.[linkId] || [];
      const buckets: number[] = Array(bucketCount).fill(0);

      clicks.forEach((click) => {
        const clickTime = new Date(click.created_at).getTime();
        const bucketIndex = Math.floor((now - clickTime) / bucketSize);
        if (bucketIndex >= 0 && bucketIndex < bucketCount) {
          buckets[bucketCount - 1 - bucketIndex]++;
        }
      });

      result[linkId] = buckets;
    });

    return result;
  }, [data, linkIds, hours]);

  return {
    sparklineDataByLink,
    isLoading,
    error,
  };
}
