import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

export function useOpenTicketsCount() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();

  const { data: count } = useQuery({
    queryKey: ['open-tickets-count', user?.id, isAdmin],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('support_tickets')
        .select('id', { count: 'exact', head: true })
        .in('status', ['open', 'in_progress']);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  return count || 0;
}
