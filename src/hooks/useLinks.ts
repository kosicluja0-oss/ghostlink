import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { GhostLink } from '@/types';
import { toast } from 'sonner';
import { USE_MOCK_DATA, getMockLinks } from '@/lib/mockData';

/**
 * Hook to manage links with server-side aggregated stats.
 * Uses get_link_stats RPC for a single query instead of N+1 queries per link.
 */
export function useLinks() {
  const [links, setLinks] = useState<GhostLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch links with aggregated stats in a single query
  const fetchLinks = useCallback(async () => {
    if (USE_MOCK_DATA) {
      setLinks(getMockLinks());
      setIsLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLinks([]);
        setIsLoading(false);
        return;
      }

      // Single RPC call replaces N+1 queries (was: 3 queries per link)
      const { data, error } = await supabase.rpc('get_link_stats', {
        p_user_id: session.user.id,
      });

      if (error) {
        console.error('Error fetching links:', error);
        setIsLoading(false);
        return;
      }

      const linksData = (data as any[]) || [];
      setLinks(
        linksData.map((l) => ({
          id: l.link_id,
          alias: l.alias,
          targetUrl: l.target_url,
          clicks: l.clicks,
          leads: l.leads,
          sales: l.sales,
          earnings: Number(l.earnings),
          status: 'active' as const,
          createdAt: new Date(l.created_at),
        }))
      );
    } catch (error) {
      console.error('Error in fetchLinks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  // Subscribe to real-time click updates (just increment counter)
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
          const newClick = payload.new as { link_id: string };
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
    async (link: Omit<GhostLink, 'id' | 'clicks' | 'leads' | 'sales' | 'earnings' | 'createdAt'>) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast.error('You must be logged in to create links');
          return;
        }

        const { data, error } = await supabase
          .from('links')
          .insert([{
            user_id: session.user.id,
            custom_alias: link.alias,
            target_url: link.targetUrl,
          }])
          .select()
          .single();

        if (error) {
          console.error('Error adding link:', error);
          if (error.code === '23505') {
            toast.error('This alias is already taken. Please choose another.');
          } else if (error.message?.includes('violates row-level security')) {
            toast.error('Link limit reached. Upgrade your plan to create more links.');
          } else {
            toast.error('Failed to create link');
          }
          return;
        }

        const newLink: GhostLink = {
          id: data.id,
          alias: data.custom_alias,
          targetUrl: data.target_url,
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

  // Update an existing link
  const updateLink = useCallback(
    async (id: string, updates: { targetUrl?: string }) => {
      try {
        const updateData: { target_url?: string } = {};

        if (updates.targetUrl !== undefined) {
          updateData.target_url = updates.targetUrl;
        }

        const { error } = await supabase
          .from('links')
          .update(updateData)
          .eq('id', id);

        if (error) {
          console.error('Error updating link:', error);
          toast.error('Failed to update link');
          return;
        }

        setLinks((prev) =>
          prev.map((link) =>
            link.id === id
              ? { ...link, targetUrl: updates.targetUrl ?? link.targetUrl }
              : link
          )
        );
        toast.success('Link updated successfully');
      } catch (error) {
        console.error('Error in updateLink:', error);
        toast.error('Failed to update link');
      }
    },
    []
  );

  // Delete a link permanently
  const deleteLink = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('links')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting link:', error);
        toast.error('Failed to delete link');
        return;
      }

      setLinks((prev) => prev.filter((link) => link.id !== id));
      toast.success('Link deleted permanently');
    } catch (error) {
      console.error('Error in deleteLink:', error);
      toast.error('Failed to delete link');
    }
  }, []);

  return {
    links,
    isLoading,
    addLink,
    updateLink,
    deleteLink,
    refetch: fetchLinks,
  };
}
