import { useState, useEffect } from 'react';
import { Ghost, Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [cooldown, setCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email) {
      toast.error('No email address found. Please sign up again.');
      return;
    }
    setIsSending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${window.location.origin}/onboarding/plans` },
      });
      if (error) throw error;
      toast.success('Verification email resent!');
      setCooldown(60);
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-background pointer-events-none" />

      <div className="w-full max-w-md relative text-center">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Ghost className="h-6 w-6 text-primary" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">Ghost Link</span>
        </Link>

        <div className="bg-card border border-white/10 rounded-xl p-8 shadow-xl shadow-black/20">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-6">
            <Mail className="h-8 w-8 text-primary" />
          </div>

          <h1 className="text-2xl font-extrabold text-foreground mb-2">
            Verify your email
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            We've sent a confirmation link to{' '}
            {email ? <span className="font-medium text-foreground">{email}</span> : 'your email address'}.
            Click the link to verify your account and continue to plan selection.
          </p>

          {email && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResend}
              disabled={isSending || cooldown > 0}
              className="mb-6"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isSending ? 'animate-spin' : ''}`} />
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email'}
            </Button>
          )}

          <div className="bg-muted/30 border border-border rounded-lg p-4 text-xs text-muted-foreground">
            Didn't receive the email? Check your spam folder or click the button above to resend.
          </div>
        </div>

        <div className="mt-6">
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
