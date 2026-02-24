import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CreditCard, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createCheckoutSession, STRIPE_PRICES, type PlanId, type BillingCycle } from '@/lib/stripe';
import { toast } from 'sonner';

/**
 * Dedicated page that auto-triggers Stripe checkout for users
 * who selected a plan before signing up (pending_plan in localStorage).
 * Uses window.location.href to avoid popup blockers.
 */
export default function PaymentRedirect() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const triggerCheckout = useCallback(async () => {
    const pendingPlanRaw = localStorage.getItem('pending_plan');
    if (!pendingPlanRaw) {
      // No pending plan — send to dashboard
      navigate('/dashboard');
      return;
    }

    try {
      const { planId, cycle } = JSON.parse(pendingPlanRaw) as { planId: string; cycle: BillingCycle };

      if (!planId || planId === 'free' || !STRIPE_PRICES[planId as PlanId]) {
        localStorage.removeItem('pending_plan');
        navigate('/dashboard');
        return;
      }

      setStatus('redirecting');
      localStorage.removeItem('pending_plan');

      const url = await createCheckoutSession(planId as PlanId, cycle);
      if (url) {
        // Direct redirect — no popup blocker issues
        window.location.href = url;
      } else {
        setStatus('error');
        setErrorMessage('Could not create checkout session. Please try again.');
      }
    } catch {
      localStorage.removeItem('pending_plan');
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
    }
  }, [navigate]);

  useEffect(() => {
    // Small delay to let session settle after email verification
    const timer = setTimeout(triggerCheckout, 600);
    return () => clearTimeout(timer);
  }, [triggerCheckout]);

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Payment setup failed</h2>
          <p className="text-sm text-muted-foreground mb-6">{errorMessage}</p>
          <div className="flex flex-col gap-3 items-center">
            <Button onClick={() => { setStatus('loading'); triggerCheckout(); }}>
              Try again
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/onboarding/plans')}>
              Choose a different plan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-6 animate-pulse">
          <CreditCard className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Redirecting to payment…
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Setting up your secure checkout. You'll be redirected in a moment.
        </p>
        <Loader2 className="h-6 w-6 text-primary animate-spin mx-auto" />
      </div>
    </div>
  );
}
