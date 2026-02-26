import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Loader2, Link2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { createCheckoutSession, STRIPE_PRICES, type PlanId, type BillingCycle } from '@/lib/stripe';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MOTIVATIONAL_HEADLINES = [
  'Ready to unlock your full tracking power? 🚀',
  'Your links deserve superpowers — want to level up? ⚡',
  'Good start! Want to see what Pro can do for you? ✨',
  "You're in! Ready to go further? 🎯",
  'Free is great — but Pro is where the magic happens. 🪄',
];

// Extract display-friendly domain from URL
function extractDisplayUrl(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const hostname = parsed.hostname.replace('www.', '');
    const path = parsed.pathname !== '/' ? parsed.pathname.slice(0, 30) : '';
    return hostname + (path.length === 30 ? path + '...' : path);
  } catch {
    return url.slice(0, 40) + (url.length > 40 ? '...' : '');
  }
}

type PricingPlan = {
  name: string;
  description: string;
  monthlyPrice: number;
  priceIds: {
    monthly: string | null;
    yearly: string | null;
  };
  features: string[];
  highlighted: boolean;
  badge?: string;
};

const YEARLY_DISCOUNT = 0.75;

const pricingPlans: Record<string, PricingPlan> = {
  free: {
    name: 'Free',
    description: 'For hobbyists exploring the platform.',
    monthlyPrice: 0,
    priceIds: {
      monthly: null,
      yearly: null
    },
    features: ['25 active links', 'Click tracking', 'Basic dashboard', 'Community support'],
    highlighted: false
  },
  pro: {
    name: 'Pro',
    description: 'For serious marketers scaling up.',
    monthlyPrice: 10,
    priceIds: {
      monthly: STRIPE_PRICES.pro.monthly,
      yearly: STRIPE_PRICES.pro.yearly
    },
    badge: 'Recommended',
    features: ['100 active links', 'Leads & Sales tracking', 'Full analytics', 'Bridge pages', 'Priority support'],
    highlighted: true
  }
};

function getDisplayPrice(plan: PricingPlan, cycle: BillingCycle): number {
  if (plan.monthlyPrice === 0) return 0;
  if (cycle === 'monthly') return plan.monthlyPrice;
  return plan.monthlyPrice * YEARLY_DISCOUNT;
}

function formatPrice(value: number): string {
  if (value === 0) return '0';
  return value % 1 === 0 ? value.toString() : value.toFixed(2);
}

// Animated price component with count-up effect (matching Landing page)
function AnimatedPrice({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    const duration = 400;
    const startTime = Date.now();
    const startValue = displayValue;
    const endValue = value;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * easeOut;
      setDisplayValue(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);
  
  return <span className="tabular-nums">${formatPrice(displayValue)}</span>;
}

export default function OnboardingPlans() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [pendingLink, setPendingLink] = useState<string | null>(null);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [headlineIndex] = useState(() => {
    const key = 'onboarding_headline_index';
    const stored = parseInt(localStorage.getItem(key) || '0', 10);
    const next = (stored + 1) % MOTIVATIONAL_HEADLINES.length;
    localStorage.setItem(key, String(next));
    return stored;
  });

  useEffect(() => {
    const storedLink = localStorage.getItem('pending_initial_link');
    setPendingLink(storedLink);
  }, []);

  // If user returns to this page after canceling checkout
  useEffect(() => {
    if (searchParams.get('checkout') === 'canceled') {
      toast.info('Checkout was canceled. You can try again or pick a different plan.');
    }
  }, [searchParams]);

  // Listen for subscription changes while checkout is pending
  useEffect(() => {
    if (!checkoutPending) return;
    
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', session.user.id)
        .single();
      
      if (profile?.tier && profile.tier !== 'free') {
        clearInterval(interval);
        navigate('/dashboard?checkout=success');
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [checkoutPending, navigate]);

  const handleSelectPlan = useCallback(async (planId: string, overrideCycle?: BillingCycle) => {
    if (planId === 'free') {
      navigate('/dashboard');
      return;
    }

    const stripePlanId = planId as PlanId;
    if (!STRIPE_PRICES[stripePlanId]) {
      toast.error('Invalid plan selected');
      return;
    }

    const cycle = overrideCycle || billingCycle;
    setLoadingPlan(planId);
    try {
      const url = await createCheckoutSession(stripePlanId, cycle);
      if (url) {
        // Direct redirect — avoids popup blockers
        window.location.href = url;
      }
    } finally {
      setLoadingPlan(null);
    }
  }, [billingCycle, navigate]);

  // If user has a pending plan, redirect to payment-redirect page instead
  useEffect(() => {
    const pendingPlan = localStorage.getItem('pending_plan');
    if (pendingPlan) {
      navigate('/payment-redirect');
    }
  }, [navigate]);

  // Checkout pending screen — user opened Stripe in another tab
  if (checkoutPending) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-6">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Completing your payment…</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Finish checkout in the new tab. This page will redirect automatically once your subscription is active.
          </p>
          <div className="flex flex-col gap-3 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCheckoutPending(false)}
            >
              ← Pick a different plan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/80 backdrop-blur-sm flex items-center justify-center px-4">
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/60 pointer-events-none" />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
        {/* Header */}
        <div className="text-center px-6 pt-8 pb-4">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            {MOTIVATIONAL_HEADLINES[headlineIndex]}
          </h1>
        </div>

        {/* Personalized Hook */}
        {pendingLink && (
          <div className="flex items-center justify-center gap-2 px-6 pb-2">
            <span className="text-xs text-muted-foreground">Tracking</span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
              <Link2 className="h-3 w-3 text-primary" />
              <span className="text-xs font-medium text-primary">
                {extractDisplayUrl(pendingLink)}
              </span>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="relative grid md:grid-cols-2 gap-5 px-6 pb-8 pt-4">
          {/* Arrow from Pro → Free (visible on md+) */}
          <div className="hidden md:flex absolute inset-0 items-center justify-center z-20 pointer-events-none">
            <div className="flex items-center gap-1 animate-pulse">
              <div className="w-8 h-0.5 bg-gradient-to-r from-primary to-muted-foreground/40 rounded-full" />
              <ArrowRight className="h-5 w-5 text-muted-foreground/40" />
            </div>
          </div>
          {Object.entries(pricingPlans).reverse().map(([planId, plan]) => {
            const isFree = planId === 'free';
            const displayPrice = getDisplayPrice(plan, billingCycle);
            const isLoading = loadingPlan === planId;

            return (
              <div
                key={planId}
                className={`relative bg-background border rounded-xl p-5 flex flex-col ${
                  plan.highlighted
                    ? 'border-primary shadow-lg shadow-primary/20 scale-[1.02]'
                    : 'border-border'
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-0.5 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan Name & Price */}
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <div className="flex items-baseline justify-center mt-2">
                    <span className="text-3xl font-bold text-foreground tabular-nums">
                      <AnimatedPrice value={displayPrice} />
                    </span>
                    <span className="text-muted-foreground text-xs ml-1">
                      {isFree ? '' : '/mo'}
                    </span>
                  </div>
                  {isFree && (
                    <p className="text-xs text-muted-foreground mt-0.5">Free forever</p>
                  )}

                  {/* Billing toggle */}
                  {!isFree ? (
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <Switch
                        checked={billingCycle === 'yearly'}
                        onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
                        className="data-[state=checked]:bg-primary scale-90"
                      />
                      <span className="text-xs text-muted-foreground">Yearly</span>
                      <span className="text-[10px] font-semibold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                        3 months free
                      </span>
                    </div>
                  ) : (
                    <div className="h-7 mt-3" />
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2 flex-1 mb-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)] transition-all duration-300"
                  size="sm"
                  onClick={() => handleSelectPlan(planId)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : isFree ? (
                    'Continue with free version'
                  ) : (
                    'Continue with Pro features'
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
