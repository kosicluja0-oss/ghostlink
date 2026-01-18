import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

interface UnreadCount {
  ticketId: string;
  count: number;
}

export function useUnreadMessages() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const queryClient = useQueryClient();

  // Fetch unread message counts per ticket
  const { data: unreadCounts, isLoading } = useQuery({
    queryKey: ['unread-messages', user?.id, isAdmin],
    queryFn: async (): Promise<UnreadCount[]> => {
      if (!user?.id) return [];

      // For admins: count unread messages from users (is_admin = false)
      // For users: count unread messages from admins (is_admin = true)
      const { data, error } = await supabase
        .from('support_messages')
        .select('ticket_id')
        .is('read_at', null)
        .eq('is_admin', !isAdmin);

      if (error) {
        console.error('Error fetching unread messages:', error);
        return [];
      }

      // Count messages per ticket
      const countMap = new Map<string, number>();
      data?.forEach((msg) => {
        const current = countMap.get(msg.ticket_id) || 0;
        countMap.set(msg.ticket_id, current + 1);
      });

      return Array.from(countMap.entries()).map(([ticketId, count]) => ({
        ticketId,
        count,
      }));
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get unread count for a specific ticket
  const getUnreadCountForTicket = useCallback(
    (ticketId: string): number => {
      return unreadCounts?.find((u) => u.ticketId === ticketId)?.count || 0;
    },
    [unreadCounts]
  );

  // Get total unread count
  const totalUnreadCount = unreadCounts?.reduce((sum, u) => sum + u.count, 0) || 0;

  // Mark messages as read for a ticket
  const markAsRead = useCallback(
    async (ticketId: string) => {
      if (!user?.id) return;

      const { error } = await supabase.rpc('mark_messages_as_read', {
        p_ticket_id: ticketId,
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error marking messages as read:', error);
        return;
      }

      // Invalidate queries to refresh counts
      queryClient.invalidateQueries({ queryKey: ['unread-messages'] });
    },
    [user?.id, queryClient]
  );

  // Subscribe to realtime updates for new messages
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('unread-messages-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
        },
        () => {
          // Refresh unread counts when new message arrives
          queryClient.invalidateQueries({ queryKey: ['unread-messages'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return {
    unreadCounts: unreadCounts || [],
    totalUnreadCount,
    getUnreadCountForTicket,
    markAsRead,
    isLoading,
  };
}
