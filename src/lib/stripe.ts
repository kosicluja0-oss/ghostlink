import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Stripe Price IDs - UPDATE THESE WITH YOUR REAL STRIPE PRICE IDs
export const STRIPE_PRICES = {
  pro: {
    monthly: 'price_1T40RUJEtCuiUlkpbRCOpK5X',
    yearly: 'price_1T40RqJEtCuiUlkpqlHF3ndZ',
  },
  business: {
    monthly: 'price_1T40SKJEtCuiUlkpoyShtOnU',
    yearly: 'price_1T40SlJEtCuiUlkph6VPCrU7',
  },
} as const;

export type PlanId = keyof typeof STRIPE_PRICES;
export type BillingCycle = 'monthly' | 'yearly';

export async function createCheckoutSession(planId: PlanId, billingCycle: BillingCycle): Promise<string | null> {
  const priceId = STRIPE_PRICES[planId][billingCycle];
  
  if (!priceId || priceId.includes('placeholder')) {
    toast.error('Stripe products not configured yet. Please contact support.');
    return null;
  }

  try {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { priceId, billingCycle },
    });

    if (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to create checkout session');
      return null;
    }

    return data?.url || null;
  } catch (err) {
    console.error('Checkout error:', err);
    toast.error('Failed to create checkout session');
    return null;
  }
}

export async function openCustomerPortal(): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('create-portal-session');

    if (error) {
      console.error('Portal error:', error);
      toast.error('Failed to open billing portal');
      return null;
    }

    return data?.url || null;
  } catch (err) {
    console.error('Portal error:', err);
    toast.error('Failed to open billing portal');
    return null;
  }
}
