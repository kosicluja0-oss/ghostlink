import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Ghost, Mail, Lock, Eye, EyeOff, Loader2, LinkIcon, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AuthMode = 'login' | 'signup' | 'forgot';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  );
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasPendingLink, setHasPendingLink] = useState(false);

  // Check for pending link from landing page
  useEffect(() => {
    const pendingLink = localStorage.getItem('pending_initial_link');
    setHasPendingLink(!!pendingLink);
  }, []);

  // Check if already logged in, but handle PASSWORD_RECOVERY specially
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // If user clicked password reset link, redirect to reset page
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/auth/reset-password');
        return;
      }
      if (session) {
        navigate('/dashboard');
      }
      setIsInitializing(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      } else {
        setIsInitializing(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Show loading while checking auth state
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-background pointer-events-none" />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const validateForm = () => {
    try {
      if (mode === 'forgot') {
        emailSchema.parse({ email });
      } else {
        authSchema.parse({ email, password });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'email') newErrors.email = err.message;
          if (err.path[0] === 'password') newErrors.password = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleForgotPassword = async () => {
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Check your email for the reset link!');
      setMode('login');
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (mode === 'forgot') {
      await handleForgotPassword();
      return;
    }
    
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password');
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success('Welcome back!');
        navigate('/dashboard');
      } else {
        const redirectUrl = `${window.location.origin}/dashboard`;
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              display_name: fullName.trim() || email.split('@')[0],
            },
          },
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Please login instead.');
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success('Account created! You can now login.');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-background pointer-events-none" />
      
      <div className="w-full max-w-md relative">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Ghost className="h-6 w-6 text-primary" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">Ghost Link</span>
        </Link>

        {/* Auth Card */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-xl shadow-black/20">
          {/* Pending Link Banner */}
          {hasPendingLink && mode === 'signup' && (
            <Alert className="mb-6 border-primary/30 bg-primary/5">
              <LinkIcon className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm text-foreground/80">
                Link detected! Create your account to start tracking revenue.
              </AlertDescription>
            </Alert>
          )}

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {mode === 'forgot' ? 'Reset Password' : mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === 'forgot' 
                ? 'Enter your email to receive a reset link'
                : mode === 'login' 
                  ? 'Enter your credentials to access your dashboard' 
                  : 'Start tracking your affiliate links today'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Full Name - only for signup */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
            {mode !== 'forgot' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </Label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>
            )}

            {/* Submit */}
            <Button 
              type="submit" 
              variant="glow" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === 'forgot' ? 'Sending...' : mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                mode === 'forgot' ? 'Send Reset Link' : mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            {mode === 'forgot' ? (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-sm text-primary hover:underline font-medium"
              >
                ← Back to login
              </button>
            ) : (
              <p className="text-sm text-muted-foreground">
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-primary hover:underline font-medium"
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
