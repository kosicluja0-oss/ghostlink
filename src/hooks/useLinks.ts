import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { GhostLink } from '@/types';
import { toast } from 'sonner';
import { USE_MOCK_DATA, getMockLinks } from '@/lib/mockData';

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

      // Get click counts and conversions for each link
      const linksWithStats = await Promise.all(
        linksData.map(async (link) => {
          const { count: clickCount } = await supabase
            .from('clicks')
            .select('*', { count: 'exact', head: true })
            .eq('link_id', link.id);

          const { data: clickIds } = await supabase
            .from('clicks')
            .select('id')
            .eq('link_id', link.id);

          let leads = 0;
          let sales = 0;
          let earnings = 0;

          if (clickIds && clickIds.length > 0) {
            const ids = clickIds.map(c => c.id);
            
            const { data: conversions } = await supabase
              .from('conversions')
              .select('type, value')
              .in('click_id', ids);

            if (conversions) {
              conversions.forEach((conv) => {
                if (conv.type === 'lead') {
                  leads++;
                } else if (conv.type === 'sale') {
                  sales++;
                  earnings += Number(conv.value) || 0;
                }
              });
            }
          }

          return {
            id: link.id,
            alias: link.custom_alias,
            targetUrl: link.target_url,
            clicks: clickCount ?? 0,
            leads,
            sales,
            earnings,
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
