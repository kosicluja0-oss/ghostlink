import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Settings as SettingsIcon, User, CreditCard, Globe, Camera, Check, Crown, Mail, Shield, Loader2, ExternalLink, Lock, Eye, EyeOff, Upload, X, Wrench, Bell, Clock, AlertCircle, Download } from 'lucide-react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useSubscription } from '@/hooks/useSubscription';
import { useOpenTicketsCount } from '@/hooks/useOpenTicketsCount';
import { usePasswordStrength } from '@/hooks/usePasswordStrength';
import { openCustomerPortal, createCheckoutSession } from '@/lib/stripe';
import { TIERS, TierType } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { TIMEZONES, TIMEZONE_GROUPS } from '@/lib/timezone';
import { useDataExport } from '@/hooks/useDataExport';

const Settings = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    user,
    signOut
  } = useAuth();
  const {
    profile,
    isLoading: profileLoading,
    updateProfile,
    isUpdating
  } = useProfile();
  const {
    tier,
    subscriptionStatus,
    billingCycle,
    isSubscribed,
    isPastDue,
    isLoading: subscriptionLoading,
    refetch: refetchSubscription
  } = useSubscription();
  const openTicketsCount = useOpenTicketsCount();
  const { isAdmin } = useUserRole();
  const { exportData, isExporting } = useDataExport();
  const [displayName, setDisplayName] = useState('');
  const [currency, setCurrency] = useState('usd');
  const [timezone, setTimezone] = useState('Europe/Prague');
  const [marketingEmails, setMarketingEmails] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  
  // Admin tier switcher state
  const [selectedTier, setSelectedTier] = useState<TierType>(tier);
  const [isChangingTier, setIsChangingTier] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Danger Zone state
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password strength calculation with detailed requirements
  const passwordStrength = usePasswordStrength(newPassword);

  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const isPasswordValid = passwordStrength.isStrong && passwordsMatch && currentPassword.length > 0;

  // Detect unsaved changes in profile/preferences
  const hasUnsavedChanges = useMemo(() => {
    if (!profile) return false;
    const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return (
      displayName !== (profile.display_name || '') ||
      currency !== (profile.currency || 'usd') ||
      timezone !== (profile.timezone || defaultTimezone)
    );
  }, [displayName, currency, timezone, profile]);

  // Handle checkout redirect result
  useEffect(() => {
    const checkoutResult = searchParams.get('checkout');
    if (checkoutResult === 'success') {
      toast.success('Subscription activated! Welcome to your new plan.');
      refetchSubscription();
      // Clean up URL
      navigate('/settings', {
        replace: true
      });
    } else if (checkoutResult === 'canceled') {
      toast.info('Checkout was canceled');
      navigate('/settings', {
        replace: true
      });
    }
  }, [searchParams, navigate, refetchSubscription]);

  // Sync local state with profile data
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setCurrency(profile.currency || 'usd');
      setTimezone(profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
      setMarketingEmails(profile.marketing_emails ?? true);
      setSecurityAlerts(profile.security_alerts ?? true);
    }
  }, [profile]);

  // Handler for notification toggle changes
  const handleNotificationChange = (field: 'marketing_emails' | 'security_alerts', value: boolean) => {
    // Optimistic update
    if (field === 'marketing_emails') setMarketingEmails(value);
    else setSecurityAlerts(value);
    
    updateProfile({ [field]: value });
  };
  
  // Sync selected tier with current tier
  useEffect(() => {
    setSelectedTier(tier);
  }, [tier]);
  
  // Admin tier change handler
  const handleAdminTierChange = async () => {
    if (!user?.id || selectedTier === tier) return;
    
    setIsChangingTier(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ tier: selectedTier })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast.success(`Tier changed to ${selectedTier.toUpperCase()}`);
      refetchSubscription();
    } catch (error: any) {
      console.error('[ADMIN-TIER-CHANGE] Error:', error);
      toast.error(error.message || 'Failed to change tier');
    } finally {
      setIsChangingTier(false);
    }
  };
  const userInitial = displayName ? displayName.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : 'U';
  const currentTierData = TIERS[tier];
  const handleSaveProfile = async () => {
    await updateProfile({
      display_name: displayName,
      currency,
      timezone
    });
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setAvatarUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with avatar URL (add cache buster)
      await updateProfile({ avatar_url: `${publicUrl}?t=${Date.now()}` });
      toast.success('Avatar updated successfully');
    } catch (error: any) {
      console.error('[AVATAR-UPLOAD] Error:', error);
      toast.error(error.message || 'Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
      // Reset input
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  // Generate gradient avatar based on initials
  const getInitialGradient = (name: string) => {
    const colors = [
      'from-violet-500 to-purple-600',
      'from-blue-500 to-cyan-500',
      'from-emerald-500 to-teal-500',
      'from-orange-500 to-red-500',
      'from-pink-500 to-rose-500',
      'from-indigo-500 to-blue-600',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
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
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error: any) {
      console.error('[CHANGE-PASSWORD] Error:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordForm(false);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    setIsDeleting(true);
    try {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
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
      return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
          Payment Due
        </Badge>;
    }
    if (isSubscribed) {
      return <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
          Active
        </Badge>;
    }
    return <Badge variant="secondary" className="bg-muted text-muted-foreground">
        Free Tier
      </Badge>;
  };
  return <TooltipProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar userEmail={user?.email} userTier={tier} onOpenSettings={() => {}} onOpenDataIntegration={() => navigate('/integrations')} onSignOut={signOut} openTicketsCount={openTicketsCount} />
          
          <SidebarInset className="flex-1">
            <main className="p-4 lg:p-6 max-w-7xl mx-auto">
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

              <div className="w-full max-w-2xl mx-auto space-y-6">
                {/* 1. Profile Section - Always visible */}
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
                    {profileLoading ? <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div> : <>
                        {/* Avatar */}
                        <div className="flex items-center gap-6">
                          <div className="relative group">
                            <Avatar className="h-24 w-24 border-2 border-border shadow-lg">
                              {profile?.avatar_url ? (
                                <AvatarImage src={profile.avatar_url} alt="Profile" />
                              ) : (
                                <AvatarFallback className={`bg-gradient-to-br ${getInitialGradient(displayName || user?.email || 'U')} text-white text-2xl font-bold`}>
                                  {userInitial}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <button 
                              className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              onClick={() => avatarInputRef.current?.click()}
                              disabled={avatarUploading}
                            >
                              {avatarUploading ? (
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                              ) : (
                                <Camera className="w-6 h-6 text-white" />
                              )}
                            </button>
                            <input
                              ref={avatarInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarUpload}
                              className="hidden"
                            />
                          </div>
                          <div className="space-y-2">
                            <p className="text-lg font-semibold text-foreground">{displayName || 'Set your name'}</p>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => avatarInputRef.current?.click()}
                              disabled={avatarUploading}
                              className="mt-1"
                            >
                              {avatarUploading ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Change Photo
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Name & Email */}
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="displayName">Display Name</Label>
                            <Input id="displayName" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" className="bg-input" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                              <Input id="email" value={user?.email || ''} disabled className="bg-muted text-muted-foreground pr-10" />
                              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Email cannot be changed
                            </p>
                          </div>
                        </div>

                        {/* Unsaved changes indicator */}
                        {hasUnsavedChanges && (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 text-warning animate-fade-in">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm font-medium">You have unsaved changes</span>
                          </div>
                        )}

                        <Button 
                          onClick={handleSaveProfile} 
                          className="w-full sm:w-auto" 
                          disabled={isUpdating || !hasUnsavedChanges}
                          variant={hasUnsavedChanges ? "default" : "secondary"}
                        >
                          {isUpdating ? <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </> : hasUnsavedChanges ? 'Save Changes' : 'No Changes'}
                        </Button>
                      </>}
                  </CardContent>
                </Card>

                {/* Collapsible Sections */}
                <Accordion type="multiple" className="space-y-3">
                  {/* 2. Preferences */}
                  <AccordionItem value="preferences" className="bg-card border border-border rounded-lg px-6">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-primary" />
                        <div className="text-left">
                          <p className="font-semibold text-foreground">Preferences</p>
                          <p className="text-sm text-muted-foreground font-normal">Customize your experience</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6">
                      <div className="grid gap-4 sm:grid-cols-2 pt-2">
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
                          <Label htmlFor="timezone">Timezone</Label>
                          <Select value={timezone} onValueChange={setTimezone}>
                            <SelectTrigger className="bg-input">
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {Object.entries(TIMEZONE_GROUPS).map(([region, timezones]) => (
                                <div key={region}>
                                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                    {region}
                                  </div>
                                  {timezones.map((tz) => (
                                    <SelectItem key={tz.value} value={tz.value}>
                                      {tz.label}
                                    </SelectItem>
                                  ))}
                                </div>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 3. Notifications */}
                  <AccordionItem value="notifications" className="bg-card border border-border rounded-lg px-6">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-primary" />
                        <div className="text-left">
                          <p className="font-semibold text-foreground">Notifications</p>
                          <p className="text-sm text-muted-foreground font-normal">Manage your email notification preferences</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6">
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="marketing-emails" className="text-sm font-medium">
                              Marketing Emails
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Tips, news, and special offers
                            </p>
                          </div>
                          <Switch
                            id="marketing-emails"
                            checked={marketingEmails}
                            onCheckedChange={(checked) => handleNotificationChange('marketing_emails', checked)}
                            disabled={isUpdating}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="security-alerts" className="text-sm font-medium">
                              Security Alerts
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Login alerts and password changes
                            </p>
                          </div>
                          <Switch
                            id="security-alerts"
                            checked={securityAlerts}
                            onCheckedChange={(checked) => handleNotificationChange('security_alerts', checked)}
                            disabled={isUpdating}
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 4. Security */}
                  <AccordionItem value="security" className="bg-card border border-border rounded-lg px-6">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-primary" />
                        <div className="text-left">
                          <p className="font-semibold text-foreground">Security</p>
                          <p className="text-sm text-muted-foreground font-normal">Manage your password and account security</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6">
                      <div className="pt-2">
                        {!showPasswordForm ? (
                          <Button
                            variant="outline"
                            onClick={() => setShowPasswordForm(true)}
                          >
                            Change Password
                          </Button>
                        ) : (
                          <div className="space-y-4">
                            <div className="grid gap-4">
                              {/* Current Password */}
                              <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <div className="relative">
                                  <Input
                                    id="currentPassword"
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password"
                                    className="bg-input pr-10"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>

                              {/* New Password */}
                              <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <div className="relative">
                                  <Input
                                    id="newPassword"
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="bg-input pr-10"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                                {/* Password Requirements */}
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
                                    <div className="flex items-center gap-2 text-xs">
                                      {passwordStrength.hasLength ? (
                                        <Check className="w-3.5 h-3.5 text-success" />
                                      ) : (
                                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                                      )}
                                      <span className={passwordStrength.hasLength ? 'text-success' : 'text-muted-foreground'}>
                                        At least 8 characters
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                      {passwordStrength.hasNumber ? (
                                        <Check className="w-3.5 h-3.5 text-success" />
                                      ) : (
                                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                                      )}
                                      <span className={passwordStrength.hasNumber ? 'text-success' : 'text-muted-foreground'}>
                                        Include a number
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                      {passwordStrength.hasSymbol ? (
                                        <Check className="w-3.5 h-3.5 text-success" />
                                      ) : (
                                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                                      )}
                                      <span className={passwordStrength.hasSymbol ? 'text-success' : 'text-muted-foreground'}>
                                        Include a symbol
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Confirm Password */}
                              <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <div className="relative">
                                  <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    className="bg-input pr-10"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                                {confirmPassword && !passwordsMatch && (
                                  <p className="text-xs text-destructive">Passwords do not match</p>
                                )}
                                {confirmPassword && passwordsMatch && (
                                  <div className="flex items-center gap-2 text-xs text-success">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Passwords match</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                onClick={handleChangePassword}
                                disabled={isChangingPassword || !isPasswordValid}
                              >
                                {isChangingPassword ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Updating...
                                  </>
                                ) : (
                                  'Update Password'
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={handleCancelPasswordChange}
                                disabled={isChangingPassword}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 5. Billing */}
                  <AccordionItem value="billing" className="bg-card border border-border rounded-lg px-6">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-primary" />
                        <div className="text-left">
                          <p className="font-semibold text-foreground">Billing & Subscription</p>
                          <p className="text-sm text-muted-foreground font-normal">Manage your plan and payment methods</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6">
                      <div className="space-y-6 pt-2">
                        {subscriptionLoading ? <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                          </div> : <>
                            {/* Current Plan */}
                            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-ghost-surface">
                              <div className="flex items-center gap-3">
                                <div className={cn("flex items-center justify-center w-12 h-12 rounded-xl", tier === 'free' ? "bg-muted" : "bg-primary/10")}>
                                  {tier !== 'free' ? <Crown className="w-6 h-6 text-primary" /> : <Shield className="w-6 h-6 text-muted-foreground" />}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-foreground capitalize">
                                      {tier} Plan
                                    </span>
                                    {getStatusBadge()}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {currentTierData.price ? `$${currentTierData.price}/month${billingCycle === 'yearly' ? ' (billed yearly)' : ''}` : 'No charge'}
                                  </p>
                                </div>
                              </div>
                              {isSubscribed || isPastDue ? <Button variant="outline" onClick={handleManageSubscription} disabled={portalLoading}>
                                  {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>
                                      Manage
                                      <ExternalLink className="w-4 h-4 ml-2" />
                                    </>}
                                </Button> : <Button variant="default" onClick={() => handleUpgrade('pro')} disabled={!!upgradeLoading}>
                                  {upgradeLoading === 'pro' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upgrade'}
                                </Button>}
                            </div>

                            {/* Plan Features */}
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-foreground">Your plan includes:</p>
                              <ul className="grid gap-2 sm:grid-cols-2">
                                {tier === 'free' && <>
                                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Check className="w-4 h-4 text-success" /> 25 active links
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Check className="w-4 h-4 text-success" /> Click tracking
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Check className="w-4 h-4 text-success" /> Basic analytics
                                    </li>
                                  </>}
                                {tier === 'pro' && <>
                                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Check className="w-4 h-4 text-success" /> 100 active links
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Check className="w-4 h-4 text-success" /> Advanced analytics
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Check className="w-4 h-4 text-success" /> Bridge pages
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Check className="w-4 h-4 text-success" /> Priority support
                                    </li>
                                  </>}
                                {tier === 'business' && <>
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
                                  </>}
                              </ul>
                            </div>

                            {/* Upgrade options for free users */}
                            {tier === 'free' && <div className="pt-4 border-t border-border">
                                <p className="text-sm font-medium text-foreground mb-3">
                                  Upgrade your plan
                                </p>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => handleUpgrade('pro')} disabled={!!upgradeLoading}>
                                    {upgradeLoading === 'pro' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Pro - $10/mo
                                  </Button>
                                  <Button variant="default" size="sm" onClick={() => handleUpgrade('business')} disabled={!!upgradeLoading}>
                                    {upgradeLoading === 'business' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Business - $15/mo
                                  </Button>
                                </div>
                              </div>}
                          </>}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Admin Developer Tools - Only visible to admins */}
                  {isAdmin && (
                    <AccordionItem value="admin" className="bg-card border border-dashed border-warning/50 rounded-lg px-6">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3">
                          <Wrench className="w-5 h-5 text-warning" />
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground">Developer Tools</p>
                              <Badge variant="outline" className="text-xs border-warning/50 text-warning">
                                Admin Only
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground font-normal">Test different subscription tiers without payment</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-6">
                        <div className="space-y-4 pt-2">
                          <div className="space-y-3">
                            <Label>Test Tier Switching</Label>
                            <div className="flex gap-3">
                              <Select value={selectedTier} onValueChange={(value: TierType) => setSelectedTier(value)}>
                                <SelectTrigger className="w-[180px] bg-input">
                                  <SelectValue placeholder="Select tier" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="free">
                                    <span className="flex items-center gap-2">
                                      <Shield className="w-4 h-4 text-muted-foreground" />
                                      Free (25 links)
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="pro">
                                    <span className="flex items-center gap-2">
                                      <Crown className="w-4 h-4 text-primary" />
                                      Pro (100 links)
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="business">
                                    <span className="flex items-center gap-2">
                                      <Crown className="w-4 h-4 text-warning" />
                                      Business (175 links)
                                    </span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <Button 
                                onClick={handleAdminTierChange}
                                disabled={isChangingTier || selectedTier === tier}
                                variant="outline"
                              >
                                {isChangingTier ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Applying...
                                  </>
                                ) : (
                                  'Apply'
                                )}
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">Current tier:</span>
                              <Badge 
                                variant="secondary" 
                                className={cn(
                                  tier === 'free' && "bg-muted text-muted-foreground",
                                  tier === 'pro' && "bg-primary/10 text-primary",
                                  tier === 'business' && "bg-warning/10 text-warning"
                                )}
                              >
                                {tier.toUpperCase()}
                              </Badge>
                              {tier !== 'free' && <Check className="w-4 h-4 text-success" />}
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>

                {/* 6. Footer Actions - GDPR Export & Delete Account */}
                <div className="pt-4 flex justify-center gap-3">
                  <Button 
                    variant="ghost" 
                    onClick={exportData}
                    disabled={isExporting}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download My Data
                      </>
                    )}
                  </Button>
                  <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-muted/50">
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
                              <Input id="delete-confirm" value={deleteConfirmation} onChange={e => setDeleteConfirmation(e.target.value)} placeholder="DELETE" className="mt-2" />
                            </div>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>
                          Cancel
                        </AlertDialogCancel>
                        <Button variant="secondary" onClick={handleDeleteAccount} disabled={deleteConfirmation !== 'DELETE' || isDeleting}>
                          {isDeleting ? <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Deleting...
                            </> : 'Delete My Account'}
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
    </TooltipProvider>;
};
export default Settings;
