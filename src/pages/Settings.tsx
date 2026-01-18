import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Settings as SettingsIcon, User, CreditCard, Globe, Camera, 
  Check, Crown, Mail, Shield, Loader2, ExternalLink
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
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useSubscription } from '@/hooks/useSubscription';
import { useOpenTicketsCount } from '@/hooks/useOpenTicketsCount';
import { openCustomerPortal, createCheckoutSession } from '@/lib/stripe';
import { TIERS } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Settings = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const { profile, isLoading: profileLoading, updateProfile, isUpdating } = useProfile();
  const { tier, subscriptionStatus, billingCycle, isSubscribed, isPastDue, isLoading: subscriptionLoading, refetch: refetchSubscription } = useSubscription();
  const openTicketsCount = useOpenTicketsCount();
  
  const [displayName, setDisplayName] = useState('');
  const [currency, setCurrency] = useState('usd');
  const [portalLoading, setPortalLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
  
  // Danger Zone state
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Handle checkout redirect result
  useEffect(() => {
    const checkoutResult = searchParams.get('checkout');
    if (checkoutResult === 'success') {
      toast.success('Subscription activated! Welcome to your new plan.');
      refetchSubscription();
      // Clean up URL
      navigate('/settings', { replace: true });
    } else if (checkoutResult === 'canceled') {
      toast.info('Checkout was canceled');
      navigate('/settings', { replace: true });
    }
  }, [searchParams, navigate, refetchSubscription]);

  // Sync local state with profile data
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setCurrency(profile.currency || 'usd');
    }
  }, [profile]);

  const userInitial = displayName ? displayName.charAt(0).toUpperCase() : 
                      user?.email ? user.email.charAt(0).toUpperCase() : 'U';
  const currentTierData = TIERS[tier];

  const handleSaveProfile = () => {
    updateProfile({
      display_name: displayName,
      currency,
    });
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const url = await openCustomerPortal();
      if (url) {
        window.open(url, '_blank');
      }
    } finally {
      setPortalLoading(false);
    }
  };

  const handleUpgrade = async (planId: 'pro' | 'business') => {
    setUpgradeLoading(planId);
    try {
      const url = await createCheckoutSession(planId, 'monthly');
      if (url) {
        window.open(url, '_blank');
      }
    } finally {
      setUpgradeLoading(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast.success('Account deleted successfully');
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('[DELETE-ACCOUNT] Error:', error);
      toast.error('Failed to delete account');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setDeleteConfirmation('');
    }
  };

  const getStatusBadge = () => {
    if (isPastDue) {
      return (
        <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
          Payment Due
        </Badge>
      );
    }
    if (isSubscribed) {
      return (
        <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
          Active
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-muted text-muted-foreground">
        Free Tier
      </Badge>
    );
  };

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar
            userEmail={user?.email}
            userTier={tier}
            onOpenSettings={() => {}}
            onOpenDataIntegration={() => navigate('/integrations')}
            onSignOut={signOut}
            openTicketsCount={openTicketsCount}
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
                    {profileLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <>
                        {/* Avatar */}
                        <div className="flex items-center gap-4">
                          <div className="relative group">
                            <Avatar className="h-20 w-20 border-2 border-border">
                              {profile?.avatar_url ? (
                                <AvatarImage src={profile.avatar_url} alt="Profile" />
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

                        <Button 
                          onClick={handleSaveProfile} 
                          className="w-full sm:w-auto"
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </Button>
                      </>
                    )}
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
                          {profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
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
                    {subscriptionLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <>
                        {/* Current Plan */}
                        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-ghost-surface">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "flex items-center justify-center w-12 h-12 rounded-xl",
                              tier === 'free' 
                                ? "bg-muted" 
                                : "bg-primary/10"
                            )}>
                              {tier !== 'free' ? (
                                <Crown className="w-6 h-6 text-primary" />
                              ) : (
                                <Shield className="w-6 h-6 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground capitalize">
                                  {tier} Plan
                                </span>
                                {getStatusBadge()}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {currentTierData.price 
                                  ? `$${currentTierData.price}/month${billingCycle === 'yearly' ? ' (billed yearly)' : ''}`
                                  : 'No charge'
                                }
                              </p>
                            </div>
                          </div>
                          {isSubscribed || isPastDue ? (
                            <Button 
                              variant="outline" 
                              onClick={handleManageSubscription}
                              disabled={portalLoading}
                            >
                              {portalLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  Manage
                                  <ExternalLink className="w-4 h-4 ml-2" />
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button 
                              variant="default" 
                              onClick={() => handleUpgrade('pro')}
                              disabled={!!upgradeLoading}
                            >
                              {upgradeLoading === 'pro' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Upgrade'
                              )}
                            </Button>
                          )}
                        </div>

                        {/* Plan Features */}
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-foreground">Your plan includes:</p>
                          <ul className="grid gap-2 sm:grid-cols-2">
                            {tier === 'free' && (
                              <>
                                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Check className="w-4 h-4 text-success" /> 25 active links
                                </li>
                                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Check className="w-4 h-4 text-success" /> Click tracking
                                </li>
                                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Check className="w-4 h-4 text-success" /> Basic dashboard
                                </li>
                                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Check className="w-4 h-4 text-success" /> Community support
                                </li>
                              </>
                            )}
                            {tier === 'pro' && (
                              <>
                                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Check className="w-4 h-4 text-success" /> 100 active links
                                </li>
                                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Check className="w-4 h-4 text-success" /> Leads & Sales tracking
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
                            {tier === 'business' && (
                              <>
                                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Check className="w-4 h-4 text-success" /> 175 active links
                                </li>
                                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Check className="w-4 h-4 text-success" /> All Pro features
                                </li>
                                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Check className="w-4 h-4 text-success" /> Team collaboration
                                </li>
                                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Check className="w-4 h-4 text-success" /> API access
                                </li>
                                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Check className="w-4 h-4 text-success" /> Dedicated support
                                </li>
                              </>
                            )}
                          </ul>
                        </div>

                        {/* Upgrade options for free users */}
                        {tier === 'free' && (
                          <div className="pt-4 border-t border-border">
                            <p className="text-sm font-medium text-foreground mb-3">
                              Upgrade your plan
                            </p>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpgrade('pro')}
                                disabled={!!upgradeLoading}
                              >
                                {upgradeLoading === 'pro' ? (
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : null}
                                Pro - $10/mo
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleUpgrade('business')}
                                disabled={!!upgradeLoading}
                              >
                                {upgradeLoading === 'business' ? (
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : null}
                                Business - $15/mo
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Delete Account - Subtle placement */}
                <div className="pt-4 flex justify-center">
                  <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      >
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete Account
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                          <div className="space-y-3">
                            <p>This action is <strong className="text-foreground">permanent and irreversible</strong>.</p>
                            <p>The following data will be deleted:</p>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              <li>Your profile and preferences</li>
                              <li>All tracking links</li>
                              <li>Click and conversion history</li>
                              <li>Support tickets and messages</li>
                            </ul>
                            <div className="pt-2">
                              <Label htmlFor="delete-confirm" className="text-foreground">
                                Type <strong>DELETE</strong> to confirm:
                              </Label>
                              <Input
                                id="delete-confirm"
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                placeholder="DELETE"
                                className="mt-2"
                              />
                            </div>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>
                          Cancel
                        </AlertDialogCancel>
                        <Button
                          variant="secondary"
                          onClick={handleDeleteAccount}
                          disabled={deleteConfirmation !== 'DELETE' || isDeleting}
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            'Delete My Account'
                          )}
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
};

export default Settings;
