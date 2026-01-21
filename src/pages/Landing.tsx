import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ghost, Zap, Target, Layers, Check, ChevronDown, ChevronUp, BarChart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/hooks/useAuth';
import { createCheckoutSession, STRIPE_PRICES, type PlanId, type BillingCycle } from '@/lib/stripe';
import { toast } from 'sonner';
// Mock chart component for hero
function MockDashboardChart() {
  return <div className="relative w-full max-w-4xl mx-auto">
      <div className="bg-card/80 backdrop-blur-xl border border-border rounded-xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Ghost className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">Traffic Overview</span>
          </div>
          <div className="flex gap-2">
            {['24h', '7d', '30d'].map(period => <span key={period} className={`text-xs px-2 py-1 rounded ${period === '7d' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>
                {period}
              </span>)}
          </div>
        </div>
        
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">24,847</div>
            <div className="text-xs text-muted-foreground">Total Clicks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">1,293</div>
            <div className="text-xs text-muted-foreground">Leads</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">847</div>
            <div className="text-xs text-muted-foreground">Sales</div>
          </div>
        </div>
        
        {/* Chart Mock */}
        <div className="h-32 relative">
          <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,80 Q50,60 100,70 T200,40 T300,55 T400,30 L400,100 L0,100 Z" fill="url(#chartGradient)" />
            <path d="M0,80 Q50,60 100,70 T200,40 T300,55 T400,30" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
          </svg>
          {/* Live indicator */}
          <div className="absolute top-0 right-0 flex items-center gap-1.5 text-xs text-primary">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Live
          </div>
        </div>
      </div>
      
      {/* Glow effect */}
      <div className="absolute inset-0 -z-10 bg-primary/10 blur-3xl rounded-full scale-75" />
    </div>;
}
const features = [{
  icon: Zap,
  title: 'Real-time analytics',
  description: 'Watch traffic as it happens. No delays. Millisecond latency tracking for the data-driven marketer.'
}, {
  icon: Target,
  title: 'Conversion Tracking',
  description: 'Postback URL support for Leads & Sales. Know exactly which campaigns are printing money.'
}, {
  icon: Layers,
  title: 'Smart Bridge Pages',
  description: 'Increase conversions with pre-lander overlays. Warm up your audience before the offer.'
}];

// Pricing data with Stripe-ready structure
// Base monthly prices - yearly = monthly * 12 * 0.75 (25% discount = 3 months free)
const YEARLY_DISCOUNT = 0.75;
type PricingPlan = {
  name: string;
  description: string;
  monthlyPrice: number; // Base monthly price
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
      monthly: 'price_1SqvwMR7WITbhBZj8cbrc0Zz',
      yearly: 'price_1SqvxyR7WITbhBZjcM73F1lN'
    },
    features: ['100 active links', 'Leads & Sales tracking', 'Full analytics', 'Bridge pages', 'Priority support'],
    highlighted: false
  },
  business: {
    name: 'Business',
    description: 'For teams and agencies at scale.',
    monthlyPrice: 15,
    priceIds: {
      monthly: 'price_1Sqw2AR7WITbhBZjvQDRReY6',
      yearly: 'price_1Sqw2aR7WITbhBZjzBBcN8H3'
    },
    badge: 'Most Popular',
    features: ['175 active links', 'All Pro features', 'Team collaboration', 'API access', 'Dedicated support'],
    highlighted: true
  }
};

// Helper to calculate prices
function getDisplayPrice(plan: PricingPlan, cycle: 'monthly' | 'yearly'): number {
  if (plan.monthlyPrice === 0) return 0;
  if (cycle === 'monthly') return plan.monthlyPrice;
  // For yearly, show the monthly equivalent (discounted)
  return plan.monthlyPrice * YEARLY_DISCOUNT;
}

// Helper to format price (no decimals if whole number, otherwise 2 decimals)
function formatPrice(value: number): string {
  if (value === 0) return '0';
  return value % 1 === 0 ? value.toString() : value.toFixed(2);
}
const faqs = [{
  question: 'How accurate is the tracking?',
  answer: 'Our tracking engine operates with millisecond precision. Every click is logged in real-time with accurate timestamps and metadata. We use edge servers globally to ensure minimal latency.'
}, {
  question: 'Is my data private and secure?',
  answer: 'Absolutely. All data is encrypted at rest and in transit. We never share your tracking data with third parties. Your links, clicks, and conversions remain strictly confidential.'
}, {
  question: 'How do I set up conversion tracking?',
  answer: 'Simply add your Postback URL in the link settings. When a conversion occurs, fire a request to your unique postback endpoint and we\'ll attribute it to the correct link automatically.'
}, {
  question: 'Can I migrate from another tracker?',
  answer: 'Yes! We support CSV imports for your existing links. Your historical data can be imported, and we\'ll help you set up redirects from your old tracking domains.'
}, {
  question: 'What are Bridge Pages?',
  answer: 'Bridge pages are intermediate landing pages that appear before redirecting to your offer. They help warm up cold traffic, improve ad compliance, and increase conversion rates.'
}];

// Animated price component with count-up effect
function AnimatedPrice({
  value,
  cycle
}: {
  value: number;
  cycle: 'monthly' | 'yearly';
}) {
  const [displayValue, setDisplayValue] = useState(value);
  useEffect(() => {
    const duration = 400;
    const startTime = Date.now();
    const startValue = displayValue;
    const endValue = value;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * easeOut;
      setDisplayValue(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <span className="tabular-nums">
      ${formatPrice(displayValue)}
    </span>;
}

// Stripe checkout handler
async function handleSubscription(planId: string, cycle: BillingCycle, isAuthenticated: boolean, navigate: ReturnType<typeof useNavigate>, setLoading: (loading: string | null) => void) {
  if (planId === 'free') return;

  // Require authentication for paid plans
  if (!isAuthenticated) {
    toast.info('Please sign in to subscribe');
    navigate('/auth?mode=signup&redirect=pricing');
    return;
  }
  const stripePlanId = planId as PlanId;
  if (!STRIPE_PRICES[stripePlanId]) {
    toast.error('Invalid plan selected');
    return;
  }
  setLoading(`${planId}-${cycle}`);
  try {
    const url = await createCheckoutSession(stripePlanId, cycle);
    if (url) {
      window.open(url, '_blank');
    }
  } finally {
    setLoading(null);
  }
}
export default function Landing() {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const isAuthenticated = !!user;
  return <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <Ghost className="h-6 w-6 text-white" />
              <span className="text-lg font-bold text-foreground tracking-tight">Ghost Link</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
              <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Login
              </Link>
              <Link to="/auth?mode=signup">
                <Button variant="glow" size="sm">Get Started</Button>
              </Link>
            </nav>

            {/* Mobile menu button */}
            <button className="md:hidden p-2 text-muted-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && <nav className="md:hidden py-4 border-t border-border/50 space-y-4">
              <a href="#features" className="block text-sm text-muted-foreground hover:text-foreground">
                Features
              </a>
              <a href="#pricing" className="block text-sm text-muted-foreground hover:text-foreground">
                Pricing
              </a>
              <Link to="/auth" className="block text-sm text-muted-foreground hover:text-foreground">
                Login
              </Link>
              <Link to="/auth?mode=signup">
                <Button variant="glow" size="sm" className="w-full">Get Started</Button>
              </Link>
            </nav>}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-4">
        <div className="container mx-auto flex flex-col items-center text-center">
          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-foreground tracking-tight leading-[1.1]">
            Stop guessing.
            <br />
            <span className="text-primary">Start scaling.</span>
          </h1>
          
          {/* Sub-headline */}
          <p className="mt-8 text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl leading-relaxed">
            Ghost Link is the missing piece of your sales funnel.
            <br className="hidden sm:block" />
            Track every click, lead, and sale from bio to bank account.
          </p>
          
          {/* CTA Buttons */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth?mode=signup">
              <Button variant="glow" size="xl" className="min-w-[200px] text-base font-semibold">
                Start for free
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="xl" className="min-w-[200px] text-base font-semibold">
                Learn More
              </Button>
            </a>
          </div>
          
          {/* Dashboard Preview */}
          <div className="mt-20 w-full">
            <MockDashboardChart />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-card/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Built for Performance
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything you need to track, analyze, and optimize your affiliate campaigns.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map(feature => <div key={feature.title} className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>)}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
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
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            {Object.entries(pricingPlans).map(([planId, plan]) => {
            const isFree = planId === 'free';
            const displayPrice = getDisplayPrice(plan, billingCycle);
            return <div key={planId} className={`relative bg-card border rounded-xl p-6 flex flex-col ${plan.highlighted ? 'border-primary shadow-lg shadow-primary/20 scale-105 z-10' : 'border-border'}`}>
                  {plan.badge && <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                        {plan.badge}
                      </span>
                    </div>}
                  
                  {/* Header Container - Fixed height for alignment */}
                  <div className="min-h-[180px] flex flex-col">
                    {/* Plan Name */}
                    <h3 className="text-3xl font-bold text-foreground text-center">{plan.name}</h3>
                    
                    {/* Price Area */}
                    <div className="flex items-baseline justify-center mt-4">
                      <span className="text-4xl font-bold text-foreground tabular-nums transition-all duration-300">
                        <AnimatedPrice value={displayPrice} cycle={billingCycle} />
                      </span>
                      <span className="text-muted-foreground text-sm ml-1.5">
                        {isFree ? '' : 'per month'}
                      </span>
                    </div>
                    {isFree && <p className="text-xs text-muted-foreground text-center mt-1">
                        Free forever
                      </p>}
                    
                    {/* Toggle for Paid Plans */}
                    {!isFree ? <div className="flex items-center justify-center gap-2 mt-4 h-8">
                        <Switch checked={billingCycle === 'yearly'} onCheckedChange={checked => setBillingCycle(checked ? 'yearly' : 'monthly')} className="data-[state=checked]:bg-primary" />
                        <span className="text-sm text-muted-foreground">Billed yearly</span>
                        <span className="text-xs font-semibold bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          3 months free
                        </span>
                      </div> : <div className="h-8 mt-4" />}
                  </div>
                  
                  {/* CTA Button */}
                  <div className="mt-6">
                    {isFree ? <Link to="/auth?mode=signup">
                        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)] transition-all duration-300">
                          Start free trial
                        </Button>
                      </Link> : <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)] transition-all duration-300" onClick={() => handleSubscription(planId, billingCycle, isAuthenticated, navigate, setCheckoutLoading)} disabled={checkoutLoading === `${planId}-${billingCycle}`}>
                        {checkoutLoading === `${planId}-${billingCycle}` ? <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Loading...
                          </> : 'Get started'}
                      </Button>}
                  </div>
                  
                  {/* Features List */}
                  <ul className="space-y-3 mt-6 flex-1">
                    {plan.features.map(feature => <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        {feature}
                      </li>)}
                  </ul>
                </div>;
          })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => <AccordionItem key={index} value={`item-${index}`} className="border-border">
                <AccordionTrigger className="text-left text-foreground hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>)}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Ghost className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Ghost Link</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Ghost Link. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>;
}