import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createCheckoutSession, STRIPE_PRICES, type PlanId, type BillingCycle } from '@/lib/stripe';
import { toast } from 'sonner';
import { PricingCard, type PricingPlanData } from './PricingCard';

const YEARLY_DISCOUNT = 0.75;

const pricingPlans: Record<string, PricingPlanData> = {
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

function getDisplayPrice(plan: PricingPlanData, cycle: BillingCycle): number {
  if (plan.monthlyPrice === 0) return 0;
  if (cycle === 'monthly') return plan.monthlyPrice;
  return plan.monthlyPrice * YEARLY_DISCOUNT;
}

// Mobile order: Pro, Business (swipeable), then Free below
const mobileOrder = ['pro', 'business'] as const;

export function PricingSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function handleSubscribe(planId: string) {
    if (planId === 'free') return;
    if (!isAuthenticated) {
      localStorage.setItem('pending_plan', JSON.stringify({ planId, cycle: billingCycle }));
      toast.info('Create an account to continue with your plan');
      navigate('/auth?mode=signup');
      return;
    }
    const stripePlanId = planId as PlanId;
    if (!STRIPE_PRICES[stripePlanId]) {
      toast.error('Invalid plan selected');
      return;
    }
    setCheckoutLoading(`${planId}-${billingCycle}`);
    try {
      const url = await createCheckoutSession(stripePlanId, billingCycle);
      if (url) window.open(url, '_blank');
    } finally {
      setCheckoutLoading(null);
    }
  }

  function scrollToSlide(index: number) {
    if (!scrollRef.current) return;
    const cards = scrollRef.current.children;
    if (cards[index]) {
      (cards[index] as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
      setActiveSlide(index);
    }
  }

  function handleScroll() {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const scrollLeft = el.scrollLeft;
    const cardWidth = el.scrollWidth / mobileOrder.length;
    const newIndex = Math.round(scrollLeft / cardWidth);
    setActiveSlide(Math.min(newIndex, mobileOrder.length - 1));
  }

  const desktopOrder = ['free', 'pro', 'business'];

  return (
    <section id="pricing" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Start free, upgrade when you're ready. No hidden fees.
          </p>
        </div>

        {/* Desktop: 3-column grid (original order) */}
        <div className="hidden md:grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
          {desktopOrder.map((planId) => {
            const plan = pricingPlans[planId];
            return (
              <PricingCard
                key={planId}
                planId={planId}
                plan={plan}
                billingCycle={billingCycle}
                setBillingCycle={setBillingCycle}
                displayPrice={getDisplayPrice(plan, billingCycle)}
                checkoutLoading={checkoutLoading}
                onSubscribe={handleSubscribe}
              />
            );
          })}
        </div>

        {/* Mobile: horizontal swipe for Pro & Business */}
        <div className="md:hidden">
          <div className="relative">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {mobileOrder.map((planId) => {
                const plan = pricingPlans[planId];
                return (
                  <PricingCard
                    key={planId}
                    planId={planId}
                    plan={plan}
                    billingCycle={billingCycle}
                    setBillingCycle={setBillingCycle}
                    displayPrice={getDisplayPrice(plan, billingCycle)}
                    checkoutLoading={checkoutLoading}
                    onSubscribe={handleSubscribe}
                    className="min-w-[85%] snap-center flex-shrink-0"
                  />
                );
              })}
            </div>

            {/* Arrow indicator */}
            {activeSlide === 0 && (
              <button
                onClick={() => scrollToSlide(1)}
                className="absolute -right-1 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-muted/60 backdrop-blur-sm flex items-center justify-center text-muted-foreground/70 transition-all hover:text-foreground hover:bg-muted"
                aria-label="Next plan"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-4">
            {mobileOrder.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToSlide(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeSlide === i ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          {/* Free plan below */}
          <div className="mt-6">
            <PricingCard
              planId="free"
              plan={pricingPlans.free}
              billingCycle={billingCycle}
              setBillingCycle={setBillingCycle}
              displayPrice={0}
              checkoutLoading={checkoutLoading}
              onSubscribe={handleSubscribe}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
