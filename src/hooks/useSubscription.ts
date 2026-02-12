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

      // Fetch tier from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', user.id)
        .single();

      // Fetch billing data from separate table
      const { data: billing } = await supabase
        .from('billing_data')
        .select('subscription_status, billing_cycle, stripe_customer_id, subscription_id')
        .eq('user_id', user.id)
        .single();

      return {
        tier: (profile?.tier as TierType) || 'free',
        subscriptionStatus: billing?.subscription_status || null,
        billingCycle: billing?.billing_cycle || null,
        stripeCustomerId: billing?.stripe_customer_id || null,
        subscriptionId: billing?.subscription_id || null,
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60,
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
