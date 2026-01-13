import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings as SettingsIcon, User, CreditCard, Globe, Camera, 
  Check, Crown, Mail, Shield
} from 'lucide-react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import type { TierType } from '@/types';
import { TIERS } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const Settings = () => {
  const navigate = useNavigate();
  const { user, session, isLoading: authLoading, signOut } = useAuth();
  
  const [userTier, setUserTier] = useState<TierType>('pro');
  const [displayName, setDisplayName] = useState('');
  const [currency, setCurrency] = useState('usd');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/auth');
    }
  }, [authLoading, session, navigate]);

  useEffect(() => {
    if (user?.email) {
      setDisplayName(user.email.split('@')[0]);
    }
  }, [user]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!session) {
    return null;
  }

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';
  const currentTierData = TIERS[userTier];

  const handleSaveProfile = () => {
    toast.success('Profile updated successfully');
  };

  const handleManageSubscription = () => {
    toast.info('Subscription management coming soon');
  };

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar
            userEmail={user?.email}
            userTier={userTier}
            onOpenSettings={() => {}}
            onOpenDataIntegration={() => navigate('/integrations')}
            onSignOut={signOut}
          />
          
          <SidebarInset className="flex-1">
            <main className="p-4 lg:p-6 max-w-4xl mx-auto">
              {/* Header */}
              <section className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                    <SettingsIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                    <p className="text-sm text-muted-foreground">
                      Manage your account preferences and subscription
                    </p>
                  </div>
                </div>
              </section>

              <div className="space-y-6">
                {/* Profile Section */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <User className="w-5 h-5 text-primary" />
                      Profile
                    </CardTitle>
                    <CardDescription>
                      Your personal information and avatar
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                      <div className="relative group">
                        <Avatar className="h-20 w-20 border-2 border-border">
                          {avatarUrl ? (
                            <AvatarImage src={avatarUrl} alt="Profile" />
                          ) : (
                            <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                              {userInitial}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <button 
                          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => toast.info('Avatar upload coming soon')}
                        >
                          <Camera className="w-6 h-6 text-white" />
                        </button>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">Profile Photo</p>
                        <p className="text-xs text-muted-foreground">
                          Click to upload a new avatar
                        </p>
                      </div>
                    </div>

                    {/* Name & Email */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Your name"
                          className="bg-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Input
                            id="email"
                            value={user?.email || ''}
                            disabled
                            className="bg-muted text-muted-foreground pr-10"
                          />
                          <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Email cannot be changed
                        </p>
                      </div>
                    </div>

                    <Button onClick={handleSaveProfile} className="w-full sm:w-auto">
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>

                {/* Preferences Section */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Globe className="w-5 h-5 text-primary" />
                      Preferences
                    </CardTitle>
                    <CardDescription>
                      Customize your experience
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="currency">Default Currency</Label>
                        <Select value={currency} onValueChange={setCurrency}>
                          <SelectTrigger className="bg-input">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="usd">$ USD (US Dollar)</SelectItem>
                            <SelectItem value="eur">€ EUR (Euro)</SelectItem>
                            <SelectItem value="gbp">£ GBP (British Pound)</SelectItem>
                            <SelectItem value="czk">Kč CZK (Czech Koruna)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Timezone</Label>
                        <div className="px-3 py-2 rounded-md bg-muted text-muted-foreground text-sm">
                          {Intl.DateTimeFormat().resolvedOptions().timeZone}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Billing Section */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <CreditCard className="w-5 h-5 text-primary" />
                      Billing & Subscription
                    </CardTitle>
                    <CardDescription>
                      Manage your plan and payment methods
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Current Plan */}
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-ghost-surface">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex items-center justify-center w-12 h-12 rounded-xl",
                          userTier === 'free' 
                            ? "bg-muted" 
                            : "bg-primary/10"
                        )}>
                          {userTier !== 'free' ? (
                            <Crown className="w-6 h-6 text-primary" />
                          ) : (
                            <Shield className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground capitalize">
                              {userTier} Plan
                            </span>
                            <Badge 
                              variant="secondary"
                              className={cn(
                                userTier !== 'free' 
                                  ? "bg-success/10 text-success border-success/20" 
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {userTier !== 'free' ? 'Active' : 'Free Tier'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {currentTierData.price 
                              ? `$${currentTierData.price}/month`
                              : 'No charge'
                            }
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" onClick={handleManageSubscription}>
                        {userTier === 'free' ? 'Upgrade' : 'Manage'}
                      </Button>
                    </div>

                    {/* Plan Features */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Your plan includes:</p>
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {userTier === 'free' && (
                          <>
                            <li className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Check className="w-4 h-4 text-success" /> 5 active links
                            </li>
                            <li className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Check className="w-4 h-4 text-success" /> Click tracking only
                            </li>
                            <li className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Check className="w-4 h-4 text-success" /> Basic analytics
                            </li>
                          </>
                        )}
                        {userTier === 'pro' && (
                          <>
                            <li className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Check className="w-4 h-4 text-success" /> 25 active links
                            </li>
                            <li className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Check className="w-4 h-4 text-success" /> Full analytics
                            </li>
                            <li className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Check className="w-4 h-4 text-success" /> Bridge pages
                            </li>
                            <li className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Check className="w-4 h-4 text-success" /> Priority support
                            </li>
                          </>
                        )}
                        {userTier === 'business' && (
                          <>
                            <li className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Check className="w-4 h-4 text-success" /> 100 active links
                            </li>
                            <li className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Check className="w-4 h-4 text-success" /> All PRO features
                            </li>
                            <li className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Check className="w-4 h-4 text-success" /> API access
                            </li>
                            <li className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Check className="w-4 h-4 text-success" /> Custom branding
                            </li>
                          </>
                        )}
                      </ul>
                    </div>

                    {/* Plan Selector (for demo) */}
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-3">
                        Demo: Switch plans to preview different feature sets
                      </p>
                      <div className="flex gap-2">
                        {(['free', 'pro', 'business'] as TierType[]).map((tier) => (
                          <Button
                            key={tier}
                            variant={userTier === tier ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setUserTier(tier)}
                            className="capitalize"
                          >
                            {tier}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
};

export default Settings;
