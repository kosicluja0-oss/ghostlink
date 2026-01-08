import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AnalyticsData, DashboardStats } from '@/types';

interface DbClick {
  id: string;
  link_id: string;
  created_at: string;
}

export function useClicksRealtime() {
  const [clicks, setClicks] = useState<DbClick[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial clicks
  useEffect(() => {
    const fetchClicks = async () => {
      try {
        const { data, error } = await supabase
          .from('clicks')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching clicks:', error);
          return;
        }

        setClicks(data ?? []);
      } catch (error) {
        console.error('Error in fetchClicks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClicks();
  }, []);

  // Subscribe to real-time click inserts
  useEffect(() => {
    const channel = supabase
      .channel('clicks-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clicks',
        },
        (payload) => {
          const newClick = payload.new as DbClick;
          console.log('Real-time click received:', newClick);
          setClicks((prev) => [...prev, newClick]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Transform clicks to analytics data format
  const analyticsData = useMemo<AnalyticsData[]>(() => {
    // Group clicks by date and link
    const clicksByDateAndLink = new Map<string, Map<string, number>>();

    clicks.forEach((click) => {
      const date = new Date(click.created_at);
      // Round to minute for recent data, to day for older data
      const now = new Date();
      const hoursDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      let dateKey: string;
      if (hoursDiff < 24) {
        // Last 24 hours: minute-level granularity
        date.setSeconds(0, 0);
        dateKey = date.toISOString();
      } else {
        // Older: daily granularity
        date.setHours(12, 0, 0, 0);
        dateKey = date.toISOString();
      }

      if (!clicksByDateAndLink.has(dateKey)) {
        clicksByDateAndLink.set(dateKey, new Map());
      }
      const linkMap = clicksByDateAndLink.get(dateKey)!;
      linkMap.set(click.link_id, (linkMap.get(click.link_id) ?? 0) + 1);
    });

    // Convert to AnalyticsData format
    const result: AnalyticsData[] = [];

    clicksByDateAndLink.forEach((linkMap, dateKey) => {
      linkMap.forEach((clickCount, linkId) => {
        result.push({
          date: dateKey,
          clicks: clickCount,
          leads: 0, // Will be implemented later
          sales: 0, // Will be implemented later
          linkId,
        });
      });
    });

    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [clicks]);

  // Calculate dashboard stats
  const stats = useMemo<DashboardStats>(() => {
    const totalClicks = clicks.length;
    return {
      totalClicks,
      totalLeads: 0, // Will be implemented later
      totalSales: 0, // Will be implemented later
      conversionRate: 0,
      earningsPerClick: 0,
    };
  }, [clicks]);

  return {
    clicks,
    analyticsData,
    stats,
    isLoading,
  };
}
