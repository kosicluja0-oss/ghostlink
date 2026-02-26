import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { type BillingCycle } from '@/lib/stripe';

function formatPrice(value: number): string {
  if (value === 0) return '0';
  return value % 1 === 0 ? value.toString() : value.toFixed(2);
}

export function AnimatedPrice({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef<number>();
  const startRef = useRef<number | undefined>();
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;

    const duration = 400;
    const step = (timestamp: number) => {
      if (startRef.current === undefined) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
      }
    };

    startRef.current = undefined;
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = to;
    };
  }, [value]);

  return <span className="tabular-nums">${formatPrice(display)}</span>;
}

export interface PricingPlanData {
  name: string;
  description: string;
  monthlyPrice: number;
  priceIds: { monthly: string | null; yearly: string | null };
  features: string[];
  highlighted: boolean;
  badge?: string;
}

interface PricingCardProps {
  planId: string;
  plan: PricingPlanData;
  billingCycle: BillingCycle;
  setBillingCycle: (cycle: BillingCycle) => void;
  displayPrice: number;
  checkoutLoading: string | null;
  onSubscribe: (planId: string) => void;
  className?: string;
}

export function PricingCard({
  planId,
  plan,
  billingCycle,
  setBillingCycle,
  displayPrice,
  checkoutLoading,
  onSubscribe,
  className = '',
}: PricingCardProps) {
  const isFree = planId === 'free';

  return (
    <div
      className={`relative bg-card border rounded-xl p-6 flex flex-col hover:-translate-y-1 hover:shadow-[0_8px_30px_hsl(var(--primary)/0.15)] transition-all duration-300 ${
        plan.highlighted
          ? 'border-primary border-2 shadow-xl shadow-primary/25 z-10'
          : 'border-border'
      } ${className}`}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
            {plan.badge}
          </span>
        </div>
      )}

      {/* Header Container */}
      <div className="min-h-[160px] flex flex-col">
        <h3 className="text-3xl font-bold text-foreground text-center">{plan.name}</h3>

        <div className="flex items-baseline justify-center mt-4">
          <span className="text-3xl md:text-4xl font-bold text-foreground tabular-nums transition-all duration-300">
            <AnimatedPrice value={displayPrice} />
          </span>
          <span className="text-muted-foreground text-sm ml-1">
            {isFree ? '' : '/mo'}
          </span>
        </div>
        {isFree && (
          <p className="text-xs text-muted-foreground text-center mt-1">Free forever</p>
        )}

        {!isFree ? (
          <div className="flex items-center justify-center gap-1.5 mt-4 h-8">
            <Switch
              checked={billingCycle === 'yearly'}
              onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
              className="data-[state=checked]:bg-primary"
            />
            <span className="text-sm text-muted-foreground">Yearly</span>
            <span className="text-xs font-semibold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full whitespace-nowrap">
              3 mo free
            </span>
          </div>
        ) : (
          <div className="h-8 mt-4" />
        )}
      </div>

      {/* CTA Button */}
      <div className="mt-4">
        {isFree ? (
          <Link to="/auth?mode=signup">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)] transition-all duration-300">
              Start free trial
            </Button>
          </Link>
        ) : (
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)] transition-all duration-300"
            onClick={() => onSubscribe(planId)}
            disabled={checkoutLoading === `${planId}-${billingCycle}`}
          >
            {checkoutLoading === `${planId}-${billingCycle}` ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Get started'
            )}
          </Button>
        )}
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
}
