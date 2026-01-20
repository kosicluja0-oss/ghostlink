import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AnalyticsData, DashboardStats } from '@/types';
import { USE_MOCK_DATA, getMockAnalyticsData, getMockStats } from '@/lib/mockData';

interface DbClick {
  id: string;
  link_id: string;
  created_at: string;
  source?: string | null; // Tracking parameter from Smart Copy (e.g., 'ig-story', 'tt-bio')
}

interface DbConversion {
  id: string;
  click_id: string;
  type: 'lead' | 'sale';
  value: number;
  created_at: string;
  link_id?: string;
  source?: string | null; // Tracking parameter from the associated click
}

export function useClicksRealtime() {
  const [clicks, setClicks] = useState<DbClick[]>([]);
  const [conversions, setConversions] = useState<DbConversion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial clicks and conversions
  useEffect(() => {
    // If using mock data, skip database fetch
    if (USE_MOCK_DATA) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch clicks
        const { data: clicksData, error: clicksError } = await supabase
          .from('clicks')
          .select('*')
          .order('created_at', { ascending: true });

        if (clicksError) {
          console.error('Error fetching clicks:', clicksError);
        } else {
          setClicks(clicksData ?? []);
        }

        // Fetch conversions with link_id and source via clicks join
        const { data: conversionsData, error: conversionsError } = await supabase
          .from('conversions')
          .select(`
            id,
            click_id,
            type,
            value,
            created_at,
            clicks!inner(link_id, source)
          `)
          .order('created_at', { ascending: true });

        if (conversionsError) {
          console.error('Error fetching conversions:', conversionsError);
        } else {
          const transformed = (conversionsData ?? []).map((conv: any) => ({
            id: conv.id,
            click_id: conv.click_id,
            type: conv.type as 'lead' | 'sale',
            value: Number(conv.value),
            created_at: conv.created_at,
            link_id: conv.clicks.link_id,
            source: conv.clicks.source,
          }));
          setConversions(transformed);
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Subscribe to real-time click inserts (skip if using mock data)
  useEffect(() => {
    if (USE_MOCK_DATA) return;

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

  // Subscribe to real-time conversion inserts (skip if using mock data)
  useEffect(() => {
    if (USE_MOCK_DATA) return;

    const channel = supabase
      .channel('conversions-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversions',
        },
        async (payload) => {
          const newConversion = payload.new as DbConversion;
          console.log('Real-time conversion received:', newConversion);

          // Fetch the link_id for this conversion
          const { data: clickData } = await supabase
            .from('clicks')
            .select('link_id')
            .eq('id', newConversion.click_id)
            .single();

          if (clickData) {
            setConversions((prev) => [
              ...prev,
              {
                ...newConversion,
                value: Number(newConversion.value),
                link_id: clickData.link_id,
              },
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Transform clicks and conversions to analytics data format
  const analyticsData = useMemo<AnalyticsData[]>(() => {
    // Return mock data if enabled
    if (USE_MOCK_DATA) {
      return getMockAnalyticsData();
    }

    // Create a map of click_id to link_id for quick lookup
    const clickToLink = new Map<string, string>();
    clicks.forEach((click) => {
      clickToLink.set(click.id, click.link_id);
    });

    // Group data by date and link
    const dataByDateAndLink = new Map<string, Map<string, { clicks: number; leads: number; sales: number }>>();

    // Helper to get date key
    const getDateKey = (dateStr: string) => {
      const date = new Date(dateStr);
      const now = new Date();
      const hoursDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        // Last 24 hours: minute-level granularity
        date.setSeconds(0, 0);
        return date.toISOString();
      } else {
        // Older: daily granularity
        date.setHours(12, 0, 0, 0);
        return date.toISOString();
      }
    };

    // Process clicks
    clicks.forEach((click) => {
      const dateKey = getDateKey(click.created_at);
      const linkId = click.link_id;

      if (!dataByDateAndLink.has(dateKey)) {
        dataByDateAndLink.set(dateKey, new Map());
      }
      const linkMap = dataByDateAndLink.get(dateKey)!;
      if (!linkMap.has(linkId)) {
        linkMap.set(linkId, { clicks: 0, leads: 0, sales: 0 });
      }
      linkMap.get(linkId)!.clicks += 1;
    });

    // Process conversions
    conversions.forEach((conv) => {
      const dateKey = getDateKey(conv.created_at);
      const linkId = conv.link_id ?? clickToLink.get(conv.click_id) ?? '';

      if (!linkId) return;

      if (!dataByDateAndLink.has(dateKey)) {
        dataByDateAndLink.set(dateKey, new Map());
      }
      const linkMap = dataByDateAndLink.get(dateKey)!;
      if (!linkMap.has(linkId)) {
        linkMap.set(linkId, { clicks: 0, leads: 0, sales: 0 });
      }
      const data = linkMap.get(linkId)!;
      if (conv.type === 'lead') {
        data.leads += 1;
      } else if (conv.type === 'sale') {
        data.sales += 1;
      }
    });

    // Convert to AnalyticsData format
    const result: AnalyticsData[] = [];

    dataByDateAndLink.forEach((linkMap, dateKey) => {
      linkMap.forEach((data, linkId) => {
        result.push({
          date: dateKey,
          clicks: data.clicks,
          leads: data.leads,
          sales: data.sales,
          linkId,
        });
      });
    });

    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [clicks, conversions]);

  // Calculate dashboard stats
  const stats = useMemo<DashboardStats>(() => {
    // Return mock stats if enabled
    if (USE_MOCK_DATA) {
      return getMockStats();
    }

    const totalClicks = clicks.length;
    const totalLeads = conversions.filter((c) => c.type === 'lead').length;
    const totalSales = conversions.filter((c) => c.type === 'sale').length;
    const totalEarnings = conversions
      .filter((c) => c.type === 'sale')
      .reduce((sum, c) => sum + c.value, 0);

    const conversionRate = totalClicks > 0 ? ((totalLeads + totalSales) / totalClicks) * 100 : 0;
    const earningsPerClick = totalClicks > 0 ? totalEarnings / totalClicks : 0;

    return {
      totalClicks,
      totalLeads,
      totalSales,
      totalEarnings,
      conversionRate,
      earningsPerClick,
    };
  }, [clicks, conversions]);

  return {
    clicks,
    conversions,
    analyticsData,
    stats,
    isLoading,
  };
}
