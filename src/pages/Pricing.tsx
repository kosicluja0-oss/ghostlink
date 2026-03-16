import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ghost, Share2, CreditCard } from 'lucide-react';
import { WhatsNewModal } from '@/components/landing/WhatsNewModal';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/hooks/useAuth';
import { createCheckoutSession, STRIPE_PRICES, type PlanId, type BillingCycle } from '@/lib/stripe';
import { toast } from 'sonner';
import { PricingCard } from '@/components/landing/PricingCard';
import { FeatureComparisonTable } from '@/components/pricing/FeatureComparisonTable';
import { pricingPlans, getDisplayPrice, pricingFaqs } from '@/lib/pricingData';

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

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

  const planOrder = ['free', 'pro', 'business'];

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-1.5 md:gap-2">
              <Ghost className="h-5 w-5 md:h-6 md:w-6 text-white" />
              <span className="text-[15px] md:text-lg font-bold text-foreground tracking-tight">
                Ghost Link
              </span>
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link to="/pricing">
                <Button variant="ghost" size="sm" className="text-xs font-medium h-7 px-2.5 text-primary">
                  Pricing
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-xs font-medium h-7 px-2.5">
                  Log in
                </Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button size="sm" className="text-xs font-medium h-7 px-2.5 bg-foreground text-background hover:bg-foreground/90 rounded-lg">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-28 pb-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight">
            Choose Your Plan
          </h1>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-lg">
            Start free, upgrade when you're ready. No hidden fees, cancel anytime.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 pb-16">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-4 lg:gap-8 max-w-6xl mx-auto items-stretch">
            {planOrder.map((planId) => {
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
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-16 px-4 bg-card/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
            Compare All Features
          </h2>
          <div className="bg-card border border-border rounded-xl p-4 md:p-8">
            <FeatureComparisonTable />
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <CreditCard className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">No credit card required</p>
                <p className="text-xs text-muted-foreground">Free plan, no strings attached</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-center sm:text-left">
              <img src="https://cdn.simpleicons.org/stripe/6772E5" alt="Stripe" className="h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Secure Stripe checkout</p>
                <p className="text-xs text-muted-foreground">Payments handled by Stripe</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {pricingFaqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-border">
                <AccordionTrigger className="text-left text-foreground hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Ghost className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="font-semibold text-foreground">Ghost Link</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <button
                onClick={async () => {
                  const shareUrl = 'https://ghstlink.com';
                  if (navigator.share) {
                    try { await navigator.share({ title: 'Ghost Link', url: shareUrl }); } catch {}
                  } else {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success('Link copied to clipboard!');
                  }
                }}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Ghost Link. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
