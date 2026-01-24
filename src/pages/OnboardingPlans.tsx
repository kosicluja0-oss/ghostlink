import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ghost, Check, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { createCheckoutSession, STRIPE_PRICES, type PlanId, type BillingCycle } from '@/lib/stripe';
import { toast } from 'sonner';

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
  return cycle === 'yearly' ? plan.monthlyPrice * 0.75 : plan.monthlyPrice;
}

function formatPrice(price: number): string {
  return price % 1 === 0 ? price.toString() : price.toFixed(2);
}

export default function OnboardingPlans() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'free') {
      // Free plan - go directly to dashboard
      toast.success('Welcome to Ghost Link!');
      navigate('/dashboard');
      return;
    }

    // Paid plans - initiate checkout
    const stripePlanId = planId as PlanId;
    if (!STRIPE_PRICES[stripePlanId]) {
      toast.error('Invalid plan selected');
      return;
    }

    setLoadingPlan(planId);
    try {
      const url = await createCheckoutSession(stripePlanId, billingCycle);
      if (url) {
        // Open checkout in new tab, user will be redirected after payment
        window.open(url, '_blank');
        // After a moment, redirect to dashboard
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
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Step 2 of 2</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Choose your power
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Select the plan that fits your tracking needs. You can always upgrade later.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center gap-3 mb-10">
          <span className={`text-sm transition-colors ${billingCycle === 'monthly' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
            Monthly
          </span>
          <Switch
            checked={billingCycle === 'yearly'}
            onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
          />
          <span className={`text-sm transition-colors ${billingCycle === 'yearly' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
            Yearly
          </span>
          {billingCycle === 'yearly' && (
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              Save 25%
            </Badge>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl w-full">
          {Object.entries(pricingPlans).map(([planId, plan]) => {
            const isFree = planId === 'free';
            const displayPrice = getDisplayPrice(plan, billingCycle);
            const isLoading = loadingPlan === planId;

            return (
              <div
                key={planId}
                className={`relative bg-card border rounded-xl p-6 flex flex-col transition-all duration-300 ${
                  plan.highlighted
                    ? 'border-primary shadow-lg shadow-primary/20 scale-105 z-10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground shadow-lg">
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground tabular-nums">
                      ${formatPrice(displayPrice)}
                    </span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                  {!isFree && billingCycle === 'yearly' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Billed annually
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                <Button
                  variant={plan.highlighted ? 'glow' : 'default'}
                  className="w-full mb-6"
                  onClick={() => handleSelectPlan(planId)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isFree ? (
                    'Start free'
                  ) : (
                    'Get started'
                  )}
                </Button>

                {/* Features */}
                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Skip Link */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-8 text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
        >
          Skip for now, I'll decide later
        </button>
      </main>
    </div>
  );
}
