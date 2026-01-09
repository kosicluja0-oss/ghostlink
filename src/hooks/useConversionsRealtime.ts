import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DbConversion {
  id: string;
  click_id: string;
  type: 'lead' | 'sale';
  value: number;
  created_at: string;
}

interface ConversionWithLink extends DbConversion {
  link_id: string;
}

export function useConversionsRealtime() {
  const [conversions, setConversions] = useState<ConversionWithLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial conversions with link_id via clicks join
  useEffect(() => {
    const fetchConversions = async () => {
      try {
        const { data, error } = await supabase
          .from('conversions')
          .select(`
            id,
            click_id,
            type,
            value,
            created_at,
            clicks!inner(link_id)
          `)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching conversions:', error);
          return;
        }

        // Transform to include link_id at top level
        const transformed: ConversionWithLink[] = (data ?? []).map((conv: any) => ({
          id: conv.id,
          click_id: conv.click_id,
          type: conv.type as 'lead' | 'sale',
          value: Number(conv.value),
          created_at: conv.created_at,
          link_id: conv.clicks.link_id,
        }));

        setConversions(transformed);
      } catch (error) {
        console.error('Error in fetchConversions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversions();
  }, []);

  // Subscribe to real-time conversion inserts
  useEffect(() => {
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

  // Calculate totals
  const stats = useMemo(() => {
    const totalLeads = conversions.filter((c) => c.type === 'lead').length;
    const totalSales = conversions.filter((c) => c.type === 'sale').length;
    const totalEarnings = conversions.reduce((sum, c) => sum + c.value, 0);

    return {
      totalLeads,
      totalSales,
      totalEarnings,
    };
  }, [conversions]);

  return {
    conversions,
    stats,
    isLoading,
  };
}
