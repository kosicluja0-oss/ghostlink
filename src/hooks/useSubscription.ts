import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { TierType } from '@/types';

export interface SubscriptionData {
  tier: TierType;
  subscriptionStatus: string | null;
  billingCycle: string | null;
  stripeCustomerId: string | null;
  subscriptionId: string | null;
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
          stripeCustomerId: null,
          subscriptionId: null,
        };
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('tier, subscription_status, billing_cycle, stripe_customer_id, subscription_id')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching subscription:', error);
        return {
          tier: 'free',
          subscriptionStatus: null,
          billingCycle: null,
          stripeCustomerId: null,
          subscriptionId: null,
        };
      }

      return {
        tier: (profile?.tier as TierType) || 'free',
        subscriptionStatus: profile?.subscription_status || null,
        billingCycle: profile?.billing_cycle || null,
        stripeCustomerId: profile?.stripe_customer_id || null,
        subscriptionId: profile?.subscription_id || null,
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60, // Refetch every minute
  });

  const isSubscribed = data?.subscriptionStatus === 'active';
  const isPastDue = data?.subscriptionStatus === 'past_due';
  const hasStripeCustomer = !!data?.stripeCustomerId;

  return {
    tier: data?.tier || 'free',
    subscriptionStatus: data?.subscriptionStatus,
    billingCycle: data?.billingCycle,
    isSubscribed,
    isPastDue,
    hasStripeCustomer,
    isLoading,
    error,
    refetch,
  };
}
