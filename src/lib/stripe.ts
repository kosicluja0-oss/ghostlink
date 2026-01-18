import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Stripe Price IDs - UPDATE THESE WITH YOUR REAL STRIPE PRICE IDs
export const STRIPE_PRICES = {
  pro: {
    monthly: 'price_1SqvwMR7WITbhBZj8cbrc0Zz',
    yearly: 'price_1SqvxyR7WITbhBZjcM73F1lN',
  },
  business: {
    monthly: 'price_1Sqw2AR7WITbhBZjvQDRReY6',
    yearly: 'price_1Sqw2aR7WITbhBZjzBBcN8H3',
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
