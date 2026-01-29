import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ghost, Check, Loader2, Sparkles, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { createCheckoutSession, STRIPE_PRICES, type PlanId, type BillingCycle } from '@/lib/stripe';
import { toast } from 'sonner';

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
    features: ['100 active links', 'Leads & Sales tracking', 'Full analytics', 'Bridge pages', 'Priority support'],
    highlighted: false
  },
  business: {
    name: 'Business',
    description: 'For teams and agencies at scale.',
    monthlyPrice: 15,
    priceIds: {
      monthly: STRIPE_PRICES.business.monthly,
      yearly: STRIPE_PRICES.business.yearly
    },
    badge: 'Most Popular',
    features: ['175 active links', 'All Pro features', 'Team collaboration', 'API access', 'Dedicated support'],
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
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [pendingLink, setPendingLink] = useState<string | null>(null);

  useEffect(() => {
    const storedLink = localStorage.getItem('pending_initial_link');
    setPendingLink(storedLink);
  }, []);

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'free') {
      toast.success('Welcome to Ghost Link!');
      navigate('/dashboard');
      return;
    }

    const stripePlanId = planId as PlanId;
    if (!STRIPE_PRICES[stripePlanId]) {
      toast.error('Invalid plan selected');
      return;
    }

    setLoadingPlan(planId);
    try {
      const url = await createCheckoutSession(stripePlanId, billingCycle);
      if (url) {
        window.open(url, '_blank');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      }
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
              <Ghost className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">Ghost Link</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4 pt-[8vh] pb-[5vh]">
        {/* Personalized Hook */}
        <div className="flex items-center gap-2.5 mb-6">
          <span className="text-sm text-muted-foreground">Unlock revenue tracking for</span>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <Link2 className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-medium text-primary">
              {pendingLink ? extractDisplayUrl(pendingLink) : 'your business'}
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Step 2 of 2</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
            Choose your power
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Select the plan that fits your tracking needs. You can always upgrade later.
          </p>
        </div>

        {/* Pricing Cards - Matching Landing Page Style */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl w-full items-stretch">
          {Object.entries(pricingPlans).map(([planId, plan]) => {
            const isFree = planId === 'free';
            const displayPrice = getDisplayPrice(plan, billingCycle);
            const isLoading = loadingPlan === planId;

            return (
              <div
                key={planId}
                className={`relative bg-card border rounded-xl p-6 flex flex-col ${
                  plan.highlighted
                    ? 'border-primary shadow-lg shadow-primary/20 scale-105 z-10'
                    : 'border-border'
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Header Container - Fixed height for alignment */}
                <div className="min-h-[180px] flex flex-col">
                  {/* Plan Name */}
                  <h3 className="text-3xl font-bold text-foreground text-center">{plan.name}</h3>

                  {/* Price Area */}
                  <div className="flex items-baseline justify-center mt-4">
                    <span className="text-4xl font-bold text-foreground tabular-nums transition-all duration-300">
                      <AnimatedPrice value={displayPrice} />
                    </span>
                    <span className="text-muted-foreground text-sm ml-1.5">
                      {isFree ? '' : 'per month'}
                    </span>
                  </div>
                  {isFree && (
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      Free forever
                    </p>
                  )}

                  {/* Toggle for Paid Plans - Matching Landing Page */}
                  {!isFree ? (
                    <div className="flex items-center justify-center gap-2 mt-4 h-8">
                      <Switch
                        checked={billingCycle === 'yearly'}
                        onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
                        className="data-[state=checked]:bg-primary"
                      />
                      <span className="text-sm text-muted-foreground">Billed yearly</span>
                      <span className="text-xs font-semibold bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        3 months free
                      </span>
                    </div>
                  ) : (
                    <div className="h-8 mt-4" />
                  )}
                </div>

                {/* CTA Button - Matching Landing Page Style */}
                <div className="mt-6">
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)] transition-all duration-300"
                    onClick={() => handleSelectPlan(planId)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : isFree ? (
                      'Start free trial'
                    ) : (
                      'Get started'
                    )}
                  </Button>
                </div>

                {/* Features List */}
                <ul className="space-y-3 mt-6 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
