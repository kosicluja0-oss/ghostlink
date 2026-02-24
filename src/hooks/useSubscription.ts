import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { TierType } from '@/types';

export interface SubscriptionData {
  tier: TierType;
  subscriptionStatus: string | null;
  billingCycle: string | null;
}

export function useSubscription() {
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async (): Promise<SubscriptionData> => {
      if (!user?.id) {
        return {
          tier: 'free',
          subscriptionStatus: null,
          billingCycle: null,
        };
      }

      try {
        // Call check-subscription edge function that queries Stripe directly
        const { data: result, error: fnError } = await supabase.functions.invoke('check-subscription');

        if (fnError) {
          console.error('[useSubscription] Edge function error:', fnError);
          // Fallback to DB query
          return await fallbackDbQuery(user.id);
        }

        return {
          tier: (result?.tier as TierType) || 'free',
          subscriptionStatus: result?.subscription_status || null,
          billingCycle: result?.billing_cycle || null,
        };
      } catch (err) {
        console.error('[useSubscription] Error calling check-subscription:', err);
        return await fallbackDbQuery(user.id);
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // every minute
  });

  const isSubscribed = data?.subscriptionStatus === 'active';
  const isPastDue = data?.subscriptionStatus === 'past_due';

  return {
    tier: data?.tier || 'free',
    subscriptionStatus: data?.subscriptionStatus,
    billingCycle: data?.billingCycle,
    isSubscribed,
    isPastDue,
    isLoading,
    error,
    refetch,
  };
}

// Fallback: query DB directly if edge function fails
async function fallbackDbQuery(userId: string): Promise<SubscriptionData> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', userId)
    .single();

  const { data: billing } = await supabase
    .from('billing_data')
    .select('subscription_status, billing_cycle')
    .eq('user_id', userId)
    .maybeSingle();

  return {
    tier: (profile?.tier as TierType) || 'free',
    subscriptionStatus: billing?.subscription_status || null,
    billingCycle: billing?.billing_cycle || null,
  };
}
