import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ghost, Zap, Target, BarChart, Share2, Shield, CreditCard, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { FloatingParticles } from '@/components/landing/FloatingParticles';
import { ComparisonSection } from '@/components/landing/ComparisonSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { WhatsNewModal } from '@/components/landing/WhatsNewModal';

// Mock chart component for hero
function MockDashboardChart() {
  return <div className="relative w-full max-w-4xl mx-auto">
      <div className="bg-card/80 backdrop-blur-xl border border-border rounded-xl p-3 md:p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 md:mb-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="h-6 w-6 md:h-8 md:w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Ghost className="h-3 w-3 md:h-4 md:w-4 text-primary" />
            </div>
            <span className="text-xs md:text-sm font-medium text-foreground">Traffic Overview</span>
          </div>
          <div className="flex gap-1.5 md:gap-2">
            {['24h', '7d', '30d'].map(period => <span key={period} className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded ${period === '7d' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>
                {period}
              </span>)}
          </div>
        </div>
        
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-3 md:mb-6">
          <div className="text-center">
            <div className="text-lg md:text-2xl font-bold text-foreground">24,847</div>
            <div className="text-[10px] md:text-xs text-muted-foreground">Total Clicks</div>
          </div>
          <div className="text-center">
            <div className="text-lg md:text-2xl font-bold text-warning">1,293</div>
            <div className="text-[10px] md:text-xs text-muted-foreground">Leads</div>
          </div>
          <div className="text-center">
            <div className="text-lg md:text-2xl font-bold text-success">847</div>
            <div className="text-[10px] md:text-xs text-muted-foreground">Sales</div>
          </div>
        </div>
        
        {/* Chart Mock */}
        <div className="h-16 md:h-32 relative">
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
          <div className="absolute top-0 right-0 flex items-center gap-1.5 text-[10px] md:text-xs text-primary">
            <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-primary"></span>
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
  icon: BarChart,
  title: 'Detailed Reporting',
  description: 'Geographic insights, device breakdown, and traffic source analysis. Make data-driven decisions.'
}];

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
}];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  return <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
              <Link to="/" className="flex items-center gap-1.5 md:gap-2">
              <Ghost className="h-5 w-5 md:h-6 md:w-6 text-white" />
              <span className="text-[15px] md:text-lg font-bold text-foreground tracking-tight">Ghost Link</span>
            </Link>

            {/* Nav Actions */}
              <div className="flex items-center gap-1.5 sm:gap-2">
              <WhatsNewModal />
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

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10">
          {/* Floating Particles */}
          <FloatingParticles count={40} />
          {/* Primary gradient orb */}
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
          {/* Secondary gradient orb */}
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
          {/* Accent gradient orb */}
          <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
          {/* Grid overlay */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}
          />
        </div>
        
        <div className="container mx-auto flex flex-col items-center text-center relative z-10">
          {/* Beta Badge */}
          <div className="mb-4 inline-flex items-center gap-1.5 px-2.5 py-1 md:gap-2 md:px-3 md:py-1.5 rounded-full border border-primary/30 bg-primary/10 shadow-[0_0_15px_hsl(var(--primary)/0.1)] animate-pulse-glow">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
            </span>
            <span className="text-[9px] md:text-[10px] font-semibold tracking-widest text-primary uppercase">
              Now in Beta V2.0
            </span>
          </div>
          
          {/* Main Headline */}
          <h1 className="text-[2.4rem] md:text-7xl lg:text-8xl font-bold text-foreground tracking-tight leading-[1.1]">
            Stop guessing.
            <br />
            <span className="text-primary">Start scaling.</span>
          </h1>
          
          {/* Sub-headline */}
          <p className="mt-6 text-[13px] md:text-xl text-muted-foreground max-w-2xl leading-relaxed mx-auto">
            The tracking tool built for creators selling on Gumroad, Whop & social media.
            <br className="hidden sm:block" />
            Get full-funnel insights — clicks, leads, sales — at a fraction of the cost.
          </p>
          
          {/* CTA Button */}
          <div className="mt-10">
            <Link to="/auth?mode=signup">
              <Button variant="glow" size="lg">
                Start Free →
              </Button>
            </Link>
          </div>
          
          {/* Dashboard Preview */}
          <div className="mt-8 w-full">
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
            {features.map(feature => <div key={feature.title} className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:-translate-y-1 hover:shadow-[0_8px_30px_hsl(var(--primary)/0.12)] transition-all duration-300">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>)}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <ComparisonSection />

      <PricingSection />

      {/* Trust Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12">
            {[
              { icon: CreditCard, text: 'No credit card required', sub: 'Free plan, no strings attached' },
              { icon: null, stripeLogo: true, text: 'Secure Stripe checkout', sub: 'Payments handled by Stripe' },
              { icon: Lock, text: '256-bit encryption', sub: 'Your data is always protected' },
              { icon: Lock, text: '256-bit encryption', sub: 'Your data is always protected' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-center sm:text-left">
                {'stripeLogo' in item && item.stripeLogo ? (
                  <img src="https://cdn.simpleicons.org/stripe/6772E5" alt="Stripe" className="h-5 w-5 shrink-0" />
                ) : item.icon ? (
                  <item.icon className="h-5 w-5 text-primary shrink-0" />
                ) : null}
                <div>
                  <p className="text-sm font-medium text-foreground">{item.text}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section — hidden until real testimonials are collected */}
      {/* <TestimonialsSection /> */}

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
                    try {
                      await navigator.share({ title: 'Ghost Link', url: shareUrl });
                    } catch (e) {
                      // User cancelled share
                    }
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
    </div>;
}