import type { PricingPlanData } from '@/components/landing/PricingCard';
import type { BillingCycle } from '@/lib/stripe';

export const YEARLY_DISCOUNT = 0.75;

export const pricingPlans: Record<string, PricingPlanData> = {
  free: {
    name: 'Free',
    description: 'For hobbyists exploring the platform.',
    monthlyPrice: 0,
    priceIds: { monthly: null, yearly: null },
    features: ['25 active links', 'Click tracking', 'Basic dashboard', 'Community support'],
    highlighted: false,
  },
  pro: {
    name: 'Pro',
    description: 'For serious marketers scaling up.',
    monthlyPrice: 10,
    priceIds: {
      monthly: 'price_1SqvwMR7WITbhBZj8cbrc0Zz',
      yearly: 'price_1SqvxyR7WITbhBZjcM73F1lN',
    },
    features: [
      '100 active links',
      'Leads & Sales tracking',
      'Full analytics',
      'Geographic insights',
      'Priority support',
    ],
    highlighted: false,
  },
  business: {
    name: 'Business',
    description: 'For teams and agencies at scale.',
    monthlyPrice: 15,
    priceIds: {
      monthly: 'price_1Sqw2AR7WITbhBZjvQDRReY6',
      yearly: 'price_1Sqw2aR7WITbhBZjzBBcN8H3',
    },
    badge: 'Most Popular',
    features: [
      '175 active links',
      'All Pro features',
      'Team collaboration',
      'API access',
      'Dedicated support',
    ],
    highlighted: true,
  },
};

export function getDisplayPrice(plan: PricingPlanData, cycle: BillingCycle): number {
  if (plan.monthlyPrice === 0) return 0;
  if (cycle === 'monthly') return plan.monthlyPrice;
  return plan.monthlyPrice * YEARLY_DISCOUNT;
}

export const pricingFaqs = [
  {
    question: 'Can I switch plans anytime?',
    answer:
      'Yes! You can upgrade or downgrade your plan at any time. When upgrading, you\'ll be charged the prorated difference. When downgrading, the remaining credit will be applied to your next billing cycle.',
  },
  {
    question: 'What happens when I cancel?',
    answer:
      'If you cancel your subscription, you\'ll retain access to your paid features until the end of your current billing period. After that, your account will revert to the Free plan and your data will be preserved.',
  },
  {
    question: 'Is there a free trial?',
    answer:
      'The Free plan is available forever with no credit card required. You can explore the platform and upgrade whenever you\'re ready to unlock advanced features.',
  },
  {
    question: 'How does yearly billing work?',
    answer:
      'Yearly billing gives you 3 months free compared to monthly billing. You\'re charged once per year upfront, and you can cancel anytime.',
  },
  {
    question: 'Do you offer refunds?',
    answer:
      'We offer a 7-day money-back guarantee on all paid plans. If you\'re not satisfied, contact support within 7 days of your purchase for a full refund.',
  },
];
