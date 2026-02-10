import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Ghost, Mail, Lock, Eye, EyeOff, Loader2, LinkIcon, User, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { usePasswordStrength } from '@/hooks/usePasswordStrength';
import { Checkbox } from '@/components/ui/checkbox';

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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasPendingLink, setHasPendingLink] = useState(false);

  // Password strength validation
  const passwordStrength = usePasswordStrength(password);

  // Check if passwords match
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const showMismatchError = confirmPassword.length > 0 && !passwordsMatch;

  // Check if signup form is valid
  const isSignupValid = useMemo(() => {
    const emailValid = z.string().email().safeParse(email).success;
    return emailValid && passwordStrength.isStrong && passwordsMatch && agreedToTerms;
  }, [email, passwordStrength.isStrong, passwordsMatch, agreedToTerms]);

  // Check for pending link from landing page
  useEffect(() => {
    const pendingLink = localStorage.getItem('pending_initial_link');
    setHasPendingLink(!!pendingLink);
  }, []);

  // Track if we're in the middle of a signup to prevent auth listener redirect
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Check if already logged in, but handle PASSWORD_RECOVERY specially
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // If user clicked password reset link, redirect to reset page
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/auth/reset-password');
        return;
      }
      // Don't redirect during active signup — handleSubmit will navigate
      if (isSigningUp) {
        setIsInitializing(false);
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
  }, [navigate, isSigningUp]);

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
        setIsSigningUp(true);
        const redirectUrl = `${window.location.origin}/onboarding/plans`;
        
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
          setIsSigningUp(false);
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Please login instead.');
          } else {
            toast.error(error.message);
          }
          return;
        }

        // Reset wizard flag so new accounts always see the welcome wizard
        localStorage.removeItem('has_seen_welcome_wizard');
        
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
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
        <div className="bg-card border border-white/10 rounded-xl p-6 shadow-xl shadow-black/20">
          {/* Pending Link Banner */}
          {hasPendingLink && mode === 'signup' && (
            <Alert className="mb-4 border-primary/30 bg-primary/5">
              <LinkIcon className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm text-foreground/80">
                Link detected! Create your account to start tracking revenue.
              </AlertDescription>
            </Alert>
          )}

          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold text-foreground mb-1.5">
              {mode === 'forgot' ? 'Reset Password' : mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-sm text-muted-foreground/70">
              {mode === 'forgot' 
                ? 'Enter your email to receive a reset link'
                : mode === 'login' 
                  ? 'Enter your credentials to access your dashboard' 
                  : 'Start tracking your affiliate links today'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email}</p>
              )}
            </div>

            {/* Full Name - only for signup */}
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
            {mode !== 'forgot' && (
              <div className="space-y-1.5">
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
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive mt-1">{errors.password}</p>
                )}
                
                {/* Password strength indicators - only show on signup */}
                {mode === 'signup' && password.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {/* Progress bar */}
                    <div className="flex gap-1">
                      {[1, 2, 3].map((level) => {
                        const filled = level <= passwordStrength.score;
                        return (
                          <div
                            key={level}
                            className={cn(
                              "h-1 flex-1 rounded-full transition-all duration-300",
                              filled 
                                ? passwordStrength.score === 3 
                                  ? "bg-success" 
                                  : passwordStrength.score === 2 
                                    ? "bg-warning" 
                                    : "bg-destructive"
                                : "bg-muted"
                            )}
                          />
                        );
                      })}
                    </div>
                    
                    {/* Requirements checklist */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        {passwordStrength.hasLength ? (
                          <Check className="h-3 w-3 text-success" />
                        ) : (
                          <X className="h-3 w-3 text-muted-foreground/50" />
                        )}
                        <span className={cn(
                          "text-xs transition-colors",
                          passwordStrength.hasLength ? "text-success" : "text-muted-foreground/70"
                        )}>
                          At least 8 characters
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {passwordStrength.hasNumber ? (
                          <Check className="h-3 w-3 text-success" />
                        ) : (
                          <X className="h-3 w-3 text-muted-foreground/50" />
                        )}
                        <span className={cn(
                          "text-xs transition-colors",
                          passwordStrength.hasNumber ? "text-success" : "text-muted-foreground/70"
                        )}>
                          Include a number
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {passwordStrength.hasSymbol ? (
                          <Check className="h-3 w-3 text-success" />
                        ) : (
                          <X className="h-3 w-3 text-muted-foreground/50" />
                        )}
                        <span className={cn(
                          "text-xs transition-colors",
                          passwordStrength.hasSymbol ? "text-success" : "text-muted-foreground/70"
                        )}>
                          Include a symbol
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Confirm Password - only for signup */}
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={cn(
                      "pl-10 pr-10 h-10 bg-input border-border text-foreground placeholder:text-muted-foreground",
                      showMismatchError && "border-destructive/50 focus-visible:ring-destructive/50"
                    )}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {showMismatchError && (
                  <p className="text-xs text-destructive mt-1">Passwords do not match</p>
                )}
              </div>
            )}

            {/* Age and Terms Checkbox - only for signup */}
            {mode === 'signup' && (
              <div className="flex items-start gap-3 pt-2">
                <Checkbox
                  id="agreedToTerms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                  disabled={isLoading}
                  className="mt-0.5"
                />
                <label
                  htmlFor="agreedToTerms"
                  className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
                >
                  I am at least 16 years old and agree to the{' '}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Privacy Policy
                  </a>
                </label>
              </div>
            )}

            {/* Submit */}
            <Button 
              type="submit" 
              variant="glow" 
              className={cn(
                "w-full h-10 mt-2 transition-opacity",
                mode === 'signup' && !isSignupValid && "opacity-50 cursor-not-allowed"
              )}
              disabled={isLoading || (mode === 'signup' && !isSignupValid)}
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
          <div className="mt-5 text-center">
            {mode === 'forgot' ? (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-sm text-primary hover:underline font-medium"
              >
                ← Back to login
              </button>
            ) : (
              <p className="text-sm text-muted-foreground/70">
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
