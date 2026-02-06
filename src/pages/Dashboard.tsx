import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MousePointer, Users, DollarSign, TrendingUp, Percent, User, MousePointerClick, Sparkles, Link2, Globe, LayoutDashboard, CalendarDays, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { TimeRange } from '@/components/analytics/TimeRangeSelector';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SettingsDrawer } from '@/components/layout/SettingsDrawer';
import { DataIntegrationModal } from '@/components/modals/DataIntegrationModal';
import { StatCard } from '@/components/analytics/StatCard';
import { AnalyticsChart } from '@/components/analytics/AnalyticsChart';
import { TopPlacementsCard } from '@/components/analytics/TopPlacementsCard';
import { TopCountriesCard } from '@/components/analytics/TopCountriesCard';
import { PlacementBadge, parsePlacement } from '@/components/analytics/PlacementBadge';
import { WelcomeWizard } from '@/components/wizard/WelcomeWizard';
import { LiveSignalIndicator } from '@/components/wizard/LiveSignalIndicator';
import { useLinks } from '@/hooks/useLinks';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAuth } from '@/hooks/useAuth';
import { useOpenTicketsCount } from '@/hooks/useOpenTicketsCount';
import { useProfile } from '@/hooks/useProfile';
import { useSubscription } from '@/hooks/useSubscription';
import { useTimezone } from '@/hooks/useTimezone';
import { useTrends } from '@/hooks/useTrendCalculation';
import { COUNTRIES } from '@/lib/countries';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
type TransactionType = 'click' | 'lead' | 'sale';

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  '30m': '30 min',
  '6h': '6 hours',
  '1d': '1 day',
  '1w': '1 week',
  '1m': '1 month',
  '1y': '1 year',
  '3y': '3 years',
};
const TIME_RANGE_OPTIONS: TimeRange[] = ['30m', '6h', '1d', '1w', '1m', '1y', '3y'];
interface Transaction {
  id: string;
  date: Date;
  type: TransactionType;
  description: string;
  amount: number | null;
  source: string;
  sourceIcon: string;
  linkId: string;
  linkAlias: string;
  location?: string;
  placement?: string;
}

// Sample mock data for demo purposes (shown only when user has no real data)
const SAMPLE_TRANSACTIONS: Transaction[] = [{
  id: 'sample-1',
  date: new Date(Date.now() - 1000 * 60 * 30),
  type: 'sale',
  description: 'Yuki Tanada',
  amount: 49.00,
  source: 'Gumroad',
  sourceIcon: 'gumroad',
  linkId: '1',
  linkAlias: 'ebook',
  location: 'JP',
  placement: 'ig-story'
}, {
  id: 'sample-2',
  date: new Date(Date.now() - 1000 * 60 * 60 * 2),
  type: 'lead',
  description: 'newsletter@email.com',
  amount: null,
  source: 'Direct Link',
  sourceIcon: 'direct',
  linkId: '2',
  linkAlias: 'signup',
  location: 'DE',
  placement: 'tt-bio'
}, {
  id: 'sample-3',
  date: new Date(Date.now() - 1000 * 60 * 60 * 3),
  type: 'sale',
  description: 'Marcus Chen',
  amount: 199.00,
  source: 'Stripe',
  sourceIcon: 'stripe',
  linkId: '3',
  linkAlias: 'course',
  location: 'US',
  placement: 'yt-shorts'
}, {
  id: 'sample-4',
  date: new Date(Date.now() - 1000 * 60 * 60 * 5),
  type: 'click',
  description: 'visitor@gmail.com',
  amount: null,
  source: 'Direct Link',
  sourceIcon: 'direct',
  linkId: '1',
  linkAlias: 'promo',
  location: 'FR',
  placement: 'ig-story'
}, {
  id: 'sample-5',
  date: new Date(Date.now() - 1000 * 60 * 60 * 8),
  type: 'sale',
  description: 'Sarah Johnson',
  amount: 79.00,
  source: 'Lemon Squeezy',
  sourceIcon: 'lemon',
  linkId: '2',
  linkAlias: 'bundle',
  location: 'CA',
  placement: 'ig-story'
}];
const Dashboard = () => {
  const navigate = useNavigate();
  const {
    user,
    signOut
  } = useAuth();
  const {
    profile
  } = useProfile();
  const {
    tier: subscriptionTier
  } = useSubscription();
  const {
    formatInTimezone
  } = useTimezone();
  const {
    clicksTrend,
    leadsTrend,
    salesTrend,
    earningsTrend,
    conversionTrend,
    epcTrend
  } = useTrends(7);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dataIntegrationOpen, setDataIntegrationOpen] = useState(false);
  const [timeRangeOpen, setTimeRangeOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('1m');

  // Welcome wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [showLiveSignal, setShowLiveSignal] = useState(false);

  // Activity filters
  const [showSampleData, setShowSampleData] = useState(false);
  const activityLimit = 200;

  // Use server-side aggregated data (fixes 1000-row limit)
  const {
    links,
    refetch: refetchLinks
  } = useLinks();
  const {
    stats,
    chartData,
    recentActivity,
    activityTotalCount,
    placementDistribution,
    countryDistribution,
    hasClicks
  } = useDashboardData({
    activityLimit
  });
  const openTicketsCount = useOpenTicketsCount();

  // Check if wizard should be shown on mount
  useEffect(() => {
    const hasSeenWizard = localStorage.getItem('has_seen_welcome_wizard');
    if (!hasSeenWizard) {
      setShowWizard(true);
    } else {
      const wizardCompletedAt = localStorage.getItem('wizard_completed_at');
      if (wizardCompletedAt && !hasClicks) {
        setShowLiveSignal(true);
      }
    }
  }, []);

  // Hide live signal once first click arrives
  useEffect(() => {
    if (hasClicks && showLiveSignal) {
      setShowLiveSignal(false);
      localStorage.removeItem('wizard_completed_at');
    }
  }, [hasClicks, showLiveSignal]);
  const handleWizardComplete = () => {
    setShowWizard(false);
    setShowLiveSignal(true);
    localStorage.setItem('wizard_completed_at', new Date().toISOString());
  };

  // Get user's display name for the wizard
  const userName = useMemo(() => {
    if (profile?.display_name) return profile.display_name;
    if (user?.user_metadata?.display_name) return user.user_metadata.display_name;
    if (user?.email) return user.email.split('@')[0];
    return 'Ghost';
  }, [profile, user]);

  // Determine if user is on free tier
  const isFreeTier = subscriptionTier === 'free';

  // Map server-side activity events to Transaction format for table display
  const transactions: Transaction[] = useMemo(() => {
    if (showSampleData && recentActivity.length === 0) {
      return SAMPLE_TRANSACTIONS;
    }
    return recentActivity.map(event => ({
      id: event.id,
      date: new Date(event.created_at),
      type: event.event_type as TransactionType,
      description: event.event_type === 'sale' ? 'Purchase completed' : event.event_type === 'lead' ? 'New subscriber' : 'Link clicked',
      amount: event.event_type === 'sale' && event.value > 0 ? Number(event.value) : null,
      source: event.event_type === 'click' ? 'Direct Link' : 'Webhook',
      sourceIcon: 'direct',
      linkId: event.link_id,
      linkAlias: event.link_alias,
      placement: event.source || undefined,
      location: event.country || undefined
    }));
  }, [recentActivity, showSampleData]);

  // Helper to get cutoff date from global timeRange
  const timeRangeCutoff = useMemo(() => {
    const now = new Date();
    switch (timeRange) {
      case '30m': return new Date(now.getTime() - 30 * 60 * 1000);
      case '6h': return new Date(now.getTime() - 6 * 60 * 60 * 1000);
      case '1d': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '1w': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '1m': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '1y': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      case '3y': return new Date(now.getTime() - 3 * 365 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }, [timeRange]);

  // Apply time range filter
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    // Global time range filter
    filtered = filtered.filter(t => t.date >= timeRangeCutoff);
    return filtered;
  }, [transactions, timeRangeCutoff]);

  // Show only the last 6 events
  const paginatedTransactions = useMemo(() => {
    return filteredTransactions.slice(0, 6);
  }, [filteredTransactions]);

  // Calculate stats based on global time range
  const displayStats = useMemo(() => {
    const dataToUse = chartData.filter(d => new Date(d.date) >= timeRangeCutoff);
    const totalClicks = dataToUse.reduce((sum, d) => sum + d.clicks, 0);
    const totalLeads = dataToUse.reduce((sum, d) => sum + d.leads, 0);
    const totalSales = dataToUse.reduce((sum, d) => sum + d.sales, 0);
    const totalEarnings = stats.totalEarnings;
    let conversionRate = 0;
    let earningsPerClick = 0;
    if (totalClicks > 0) {
      conversionRate = (totalLeads + totalSales) / totalClicks * 100;
      earningsPerClick = stats.totalClicks > 0 ? totalEarnings / stats.totalClicks : 0;
    }
    return {
      totalClicks,
      totalLeads,
      totalSales,
      totalEarnings,
      conversionRate,
      earningsPerClick
    };
  }, [timeRangeCutoff, chartData, stats]);
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };
  const getTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'sale':
        return <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/25 px-2.5 py-0.5 rounded-full">
            <DollarSign className="w-3 h-3 mr-1" />
            Sale
          </Badge>;
      case 'lead':
        return <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/25 px-2.5 py-0.5 rounded-full">
            <User className="w-3 h-3 mr-1" />
            Lead
          </Badge>;
      case 'click':
        return <Badge variant="secondary" className="bg-muted/80 text-muted-foreground border-border px-2.5 py-0.5 rounded-full">
            <MousePointerClick className="w-3 h-3 mr-1" />
            Click
          </Badge>;
    }
  };

  // Get customer initials for avatar
  const getCustomerInitials = (description: string) => {
    if (description.includes('@')) {
      return description.charAt(0).toUpperCase();
    }
    const words = description.split(' ');
    if (words.length >= 2) {
      return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
    }
    return description.charAt(0).toUpperCase();
  };
  const hasRealData = hasClicks;

  // Placement analytics from server-side distribution
  const placementAnalytics = useMemo(() => {
    const total = placementDistribution.reduce((sum, p) => sum + p.count, 0);
    return placementDistribution.map(p => {
      const parsed = parsePlacement(p.source === 'direct' || !p.source ? undefined : p.source);
      return {
        platform: parsed?.platform || 'direct',
        placement: parsed?.placement || 'Direct',
        count: p.count,
        percentage: total > 0 ? Math.round(p.count / total * 100) : 0
      };
    });
  }, [placementDistribution]);

  // Country analytics from server-side distribution
  const countryAnalytics = useMemo(() => {
    const total = countryDistribution.reduce((sum, c) => sum + c.count, 0);
    return countryDistribution.filter(c => c.country !== 'UNKNOWN').map(c => ({
      code: c.country,
      count: c.count,
      percentage: total > 0 ? Math.round(c.count / total * 100) : 0
    }));
  }, [countryDistribution]);
  return <TooltipProvider>
      <SidebarProvider defaultOpen={true}>
        {/* Welcome Wizard Overlay */}
        {showWizard && <WelcomeWizard userName={userName} tier={subscriptionTier} onComplete={handleWizardComplete} onLinkCreated={refetchLinks} />}
        
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar userEmail={user?.email} userTier={subscriptionTier} onOpenSettings={() => setSettingsOpen(true)} onOpenDataIntegration={() => setDataIntegrationOpen(true)} onSignOut={signOut} openTicketsCount={openTicketsCount} />
          
          <SidebarInset className="flex-1">
            <main className="p-4 lg:p-6">
              {/* Page Header */}
              <section className="mb-5">
                <div>
                  <h1 className="text-foreground text-sm font-semibold">Overview</h1>
                  <div className="mt-1.5">
                    <Popover onOpenChange={setTimeRangeOpen}>
                      <PopoverTrigger asChild>
                        <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-md bg-card border border-border hover:bg-muted/50">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {TIME_RANGE_LABELS[timeRange]}
                          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${timeRangeOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-auto p-1.5 bg-card border border-border">
                        <div className="flex flex-col gap-0.5">
                          {TIME_RANGE_OPTIONS.map((range) => (
                            <button
                              key={range}
                              onClick={() => setTimeRange(range)}
                              className={`text-left px-3 py-1.5 text-xs rounded-md transition-colors ${
                                timeRange === range
                                  ? 'bg-primary text-primary-foreground font-medium'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                              }`}
                            >
                              {TIME_RANGE_LABELS[range]}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </section>

              {/* Stats Banner - Compact */}
              <section className="mb-5">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <StatCard label="Total Clicks" value={displayStats.totalClicks.toLocaleString()} icon={MousePointer} trend={clicksTrend ?? undefined} accentColor="primary" compact />
                  <StatCard label="Total Leads" value={displayStats.totalLeads.toLocaleString()} icon={Users} trend={leadsTrend ?? undefined} isLocked={isFreeTier} accentColor="warning" compact />
                  <StatCard label="Total Sales" value={displayStats.totalSales.toLocaleString()} icon={TrendingUp} trend={salesTrend ?? undefined} isLocked={isFreeTier} accentColor="success" compact />
                  <StatCard label="Revenue" value={formatCurrency(displayStats.totalEarnings)} icon={DollarSign} trend={earningsTrend ?? undefined} isLocked={isFreeTier} accentColor="success" compact />
                  <StatCard label="Conv. Rate" value={`${displayStats.conversionRate.toFixed(2)}%`} icon={Percent} trend={conversionTrend ?? undefined} isLocked={isFreeTier} accentColor="chart-conversions" compact />
                  <StatCard label="EPC" value={formatCurrency(displayStats.earningsPerClick)} icon={Sparkles} trend={epcTrend ?? undefined} isLocked={isFreeTier} accentColor="primary" compact />
                </div>
              </section>

              {/* Chart + Activity Table Row */}
              <section className="mb-5">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                  <div className="lg:col-span-3">
                    <AnalyticsChart data={chartData} showConversions={!isFreeTier} timeRange={timeRange} activeLinkId={null} selectedLinkAlias={undefined} onClearSelection={() => {}} links={links} />
                  </div>
                  <div className="lg:col-span-2">
                    {showLiveSignal && <div className="mb-3"><LiveSignalIndicator /></div>}
                    {filteredTransactions.length === 0 && !showSampleData ? (
                      <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-border rounded-xl bg-card/50 h-full">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                          <MousePointerClick className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground mb-1">No activity yet</h3>
                        <p className="text-xs text-muted-foreground text-center max-w-xs mb-4">
                          Once you start getting clicks and conversions, they'll appear here.
                        </p>
                        <Button variant="outline" size="sm" onClick={() => setShowSampleData(true)} className="gap-2">
                          <Sparkles className="w-3.5 h-3.5" />
                          Show Sample Data
                        </Button>
                      </div>
                    ) : (
                      <div className="border border-border rounded-xl overflow-hidden bg-card h-full flex flex-col">
                        <div className="flex-1 overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="hover:bg-transparent border-border bg-muted/30">
                                <TableHead className="text-muted-foreground font-medium text-xs px-3">Event</TableHead>
                                <TableHead className="text-muted-foreground font-medium text-xs px-3">Link</TableHead>
                                <TableHead className="text-muted-foreground font-medium text-xs px-3">Customer</TableHead>
                                <TableHead className="text-muted-foreground font-medium text-xs px-3 text-right">Amount</TableHead>
                                <TableHead className="text-muted-foreground font-medium text-xs px-3 text-right">Date</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedTransactions.map(tx => (
                                <TableRow key={tx.id} className="border-border hover:bg-muted/50 transition-colors">
                                  <TableCell className="py-2.5 px-3">{getTypeBadge(tx.type)}</TableCell>
                                  <TableCell className="py-2.5 px-3">
                                    <button className="flex items-center gap-1.5 text-xs text-foreground hover:text-primary transition-colors cursor-pointer group" onClick={() => navigate('/links')}>
                                      <div className="w-5 h-5 rounded bg-muted flex items-center justify-center">
                                        <Link2 className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                                      </div>
                                      <span className="font-medium group-hover:underline truncate max-w-[80px]">/{tx.linkAlias}</span>
                                    </button>
                                  </TableCell>
                                  <TableCell className="py-2.5 px-3">
                                    <div className="flex items-center gap-2">
                                      <Avatar className="w-6 h-6">
                                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
                                          {getCustomerInitials(tx.description)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs text-foreground truncate max-w-[100px]">
                                        {tx.description}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right py-2.5 px-3 font-mono text-xs">
                                    {tx.amount !== null ? <span className="text-foreground font-medium">${tx.amount.toFixed(2)}</span> : <span className="text-muted-foreground">—</span>}
                                  </TableCell>
                                  <TableCell className="text-right py-2.5 px-3">
                                    <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                                      {formatInTimezone(tx.date, 'MMM d, HH:mm')}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                    {showSampleData && !hasRealData && (
                      <div className="mt-3 flex items-center justify-center">
                        <Button variant="ghost" size="sm" onClick={() => setShowSampleData(false)} className="text-xs text-muted-foreground">
                          Hide Sample Data
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Countries + Placements Row */}
              <section className="mb-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TopCountriesCard countries={countryAnalytics} />
                  <TopPlacementsCard placements={placementAnalytics} />
                </div>
              </section>
            </main>
          </SidebarInset>
        </div>

        {/* Modals & Drawers */}
        <SettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} userTier={subscriptionTier} onChangeTier={() => {}} />

        <DataIntegrationModal open={dataIntegrationOpen} onOpenChange={setDataIntegrationOpen} />
      </SidebarProvider>
    </TooltipProvider>;
};
export default Dashboard;