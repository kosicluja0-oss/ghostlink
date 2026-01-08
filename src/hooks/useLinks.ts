import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { GhostLink, BridgePageConfig } from '@/types';
import { toast } from 'sonner';

interface DbClick {
  id: string;
  link_id: string;
  created_at: string;
}

export function useLinks() {
  const [links, setLinks] = useState<GhostLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch links and their click counts
  const fetchLinks = useCallback(async () => {
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLinks([]);
        setIsLoading(false);
        return;
      }

      const { data: linksData, error: linksError } = await supabase
        .from('links')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (linksError) {
        console.error('Error fetching links:', linksError);
        return;
      }

      if (!linksData) {
        setLinks([]);
        return;
      }

      // Get click counts for each link
      const linksWithStats = await Promise.all(
        linksData.map(async (link) => {
          const { count } = await supabase
            .from('clicks')
            .select('*', { count: 'exact', head: true })
            .eq('link_id', link.id);

          const bridgeConfig = link.bridge_page_config as unknown as BridgePageConfig | null;

          return {
            id: link.id,
            alias: link.custom_alias,
            targetUrl: link.target_url,
            hasBridgePage: link.has_bridge_page ?? false,
            bridgePageConfig: bridgeConfig ?? undefined,
            clicks: count ?? 0,
            leads: 0, // Will be implemented later
            sales: 0, // Will be implemented later
            earnings: 0, // Will be implemented later
            status: 'active' as const,
            createdAt: new Date(link.created_at),
          };
        })
      );

      setLinks(linksWithStats);
    } catch (error) {
      console.error('Error in fetchLinks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  // Subscribe to real-time click updates
  useEffect(() => {
    const channel = supabase
      .channel('clicks-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clicks',
        },
        (payload) => {
          const newClick = payload.new as DbClick;
          console.log('New click received:', newClick);
          
          // Update the click count for the affected link
          setLinks((prev) =>
            prev.map((link) =>
              link.id === newClick.link_id
                ? { ...link, clicks: link.clicks + 1 }
                : link
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Add a new link
  const addLink = useCallback(
    async (
      link: Omit<GhostLink, 'id' | 'clicks' | 'leads' | 'sales' | 'earnings' | 'createdAt'>
    ) => {
      try {
        // Get current user session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast.error('You must be logged in to create links');
          return;
        }

        const insertData: {
          user_id: string;
          custom_alias: string;
          target_url: string;
          has_bridge_page: boolean;
          bridge_page_config?: BridgePageConfig;
        } = {
          user_id: session.user.id,
          custom_alias: link.alias,
          target_url: link.targetUrl,
          has_bridge_page: link.hasBridgePage,
        };

        if (link.bridgePageConfig) {
          insertData.bridge_page_config = link.bridgePageConfig;
        }

        const { data, error } = await supabase
          .from('links')
          .insert([insertData as any])
          .select()
          .single();

        if (error) {
          console.error('Error adding link:', error);
          if (error.code === '23505') {
            toast.error('This alias is already taken. Please choose another.');
          } else {
            toast.error('Failed to create link');
          }
          return;
        }

        const bridgeConfig = data.bridge_page_config as unknown as BridgePageConfig | null;

        const newLink: GhostLink = {
          id: data.id,
          alias: data.custom_alias,
          targetUrl: data.target_url,
          hasBridgePage: data.has_bridge_page ?? false,
          bridgePageConfig: bridgeConfig ?? undefined,
          clicks: 0,
          leads: 0,
          sales: 0,
          earnings: 0,
          status: 'active',
          createdAt: new Date(data.created_at),
        };

        setLinks((prev) => [newLink, ...prev]);
        toast.success('Link created successfully');
      } catch (error) {
        console.error('Error in addLink:', error);
        toast.error('Failed to create link');
      }
    },
    []
  );

  // Archive a link (for now, just remove from local state - could be soft delete)
  const archiveLink = useCallback(async (id: string) => {
    setLinks((prev) =>
      prev.map((link) =>
        link.id === id ? { ...link, status: 'archived' as const } : link
      )
    );
    toast.success('Link archived');
  }, []);

  // Restore a link
  const restoreLink = useCallback(async (id: string) => {
    setLinks((prev) =>
      prev.map((link) =>
        link.id === id ? { ...link, status: 'active' as const } : link
      )
    );
    toast.success('Link restored');
  }, []);

  return {
    links,
    isLoading,
    addLink,
    archiveLink,
    restoreLink,
    refetch: fetchLinks,
  };
}
