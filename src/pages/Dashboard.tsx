import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MousePointer, Users, DollarSign, TrendingUp, Percent, Filter, CalendarDays, Search, User, MousePointerClick, Sparkles, ShoppingCart, Link2, Globe, LayoutDashboard } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { TimeRange } from '@/components/analytics/TimeRangeSelector';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
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
import type { AnalyticsData } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
type TransactionType = 'click' | 'lead' | 'sale';
type DateRange = '7d' | '30d' | '90d' | 'all';
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
  const [filteredData, setFilteredData] = useState<AnalyticsData[] | null>(null);

  // Welcome wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [showLiveSignal, setShowLiveSignal] = useState(false);

  // Activity filters
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [showSampleData, setShowSampleData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);
  const [activityLimit, setActivityLimit] = useState(200);

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

  // Apply filters
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter);
    }

    // Date range filter
    const now = new Date();
    let cutoffDate: Date | null = null;
    switch (dateRange) {
      case '7d':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        cutoffDate = null;
        break;
    }
    if (cutoffDate) {
      filtered = filtered.filter(t => t.date >= cutoffDate!);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => t.description.toLowerCase().includes(query) || t.id.toLowerCase().includes(query) || t.linkAlias.toLowerCase().includes(query) || t.source.toLowerCase().includes(query));
    }
    return filtered;
  }, [transactions, typeFilter, dateRange, searchQuery]);

  // Paginated transactions for display
  const paginatedTransactions = useMemo(() => {
    return filteredTransactions.slice(0, visibleCount);
  }, [filteredTransactions, visibleCount]);
  const hasMoreTransactions = filteredTransactions.length > visibleCount || activityTotalCount > activityLimit;
  const handleLoadMore = () => {
    if (visibleCount < filteredTransactions.length) {
      setVisibleCount(prev => prev + 10);
    } else if (activityTotalCount > activityLimit) {
      setActivityLimit(prev => prev + 200);
    }
  };

  // FIX: useEffect instead of useMemo for side-effect (anti-pattern fix)
  useEffect(() => {
    setVisibleCount(10);
  }, [typeFilter, dateRange, searchQuery]);

  // Calculate stats based on chart time range selection
  const displayStats = useMemo(() => {
    const dataToUse = filteredData ?? chartData;
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
  }, [filteredData, chartData, stats]);
  const handleTimeRangeChange = (range: TimeRange, data: typeof chartData) => {
    setFilteredData(data);
  };
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
  const salesCount = filteredTransactions.filter(t => t.type === 'sale').length;
  const leadsCount = filteredTransactions.filter(t => t.type === 'lead').length;
  const clicksCount = filteredTransactions.filter(t => t.type === 'click').length;
  const totalRevenue = filteredTransactions.filter(t => t.type === 'sale' && t.amount).reduce((sum, t) => sum + (t.amount || 0), 0);
  const conversionRate = clicksCount > 0 ? (salesCount / clicksCount * 100).toFixed(1) : '0.0';
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
                <div className="flex items-center gap-3">
                  
                  <div>
                    <h1 className="text-foreground text-sm font-semibold">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">
                  </p>
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

              {/* Chart + Analytics Widgets Row */}
              <section className="mb-5">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                  <div className="lg:col-span-3">
                    <AnalyticsChart data={chartData} showConversions={!isFreeTier} onTimeRangeChange={handleTimeRangeChange} activeLinkId={null} selectedLinkAlias={undefined} onClearSelection={() => {}} links={links} />
                  </div>
                  <div className="lg:col-span-2 flex flex-col gap-4">
                    <TopCountriesCard countries={countryAnalytics} />
                    <TopPlacementsCard placements={placementAnalytics} />
                  </div>
                </div>
              </section>

              {/* Recent Activity Section */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
                    {showLiveSignal && <LiveSignalIndicator />}
                  </div>
                </div>

                {/* Enhanced Toolbar */}
                <div className="flex items-center gap-3 flex-wrap justify-between mb-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Filters:</span>
                    </div>
                    
                    <Select value={typeFilter} onValueChange={v => setTypeFilter(v as typeof typeFilter)}>
                      <SelectTrigger className="w-[130px] h-9">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="sale">Sales</SelectItem>
                        <SelectItem value="lead">Leads</SelectItem>
                        <SelectItem value="click">Clicks</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={dateRange} onValueChange={v => setDateRange(v as DateRange)}>
                      <SelectTrigger className="w-[140px] h-9">
                        <CalendarDays className="w-4 h-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Date Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="90d">Last 90 days</SelectItem>
                        <SelectItem value="all">All time</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="Search email, ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9 w-[180px] bg-background" />
                    </div>

                    {(typeFilter !== 'all' || dateRange !== '7d' || searchQuery) && <Button variant="ghost" size="sm" onClick={() => {
                    setTypeFilter('all');
                    setDateRange('7d');
                    setSearchQuery('');
                  }} className="text-muted-foreground hover:text-foreground">
                        Reset
                      </Button>}
                  </div>
                </div>

                {/* Summary Strip */}
                {filteredTransactions.length > 0 && <div className="flex items-center gap-6 px-4 py-3 bg-muted/30 rounded-lg border border-border mb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-success" />
                      <span className="text-sm text-muted-foreground">Total Revenue:</span>
                      <span className="text-sm font-semibold text-success font-mono">${totalRevenue.toFixed(2)}</span>
                    </div>
                    <div className="h-4 w-px bg-border" />
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-success" />
                      <span className="text-sm text-muted-foreground">Total Sales:</span>
                      <span className="text-sm font-semibold text-foreground font-mono">{salesCount}</span>
                    </div>
                    <div className="h-4 w-px bg-border" />
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Conversion Rate:</span>
                      <span className="text-sm font-semibold text-primary font-mono">{conversionRate}%</span>
                    </div>
                  </div>}

                {/* Data Table or Empty State */}
                {filteredTransactions.length === 0 && !showSampleData ? <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-border rounded-xl bg-card/50">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <MousePointerClick className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No activity yet</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
                      Once you start getting clicks and conversions, they'll appear here in real-time.
                    </p>
                    <Button variant="outline" onClick={() => setShowSampleData(true)} className="gap-2">
                      <Sparkles className="w-4 h-4" />
                      Show Sample Data
                    </Button>
                  </div> : <div className="border border-border rounded-xl overflow-hidden bg-card">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-border bg-muted/30">
                          <TableHead className="text-muted-foreground font-medium">Event</TableHead>
                          <TableHead className="text-muted-foreground font-medium">Link</TableHead>
                          <TableHead className="text-muted-foreground font-medium hidden sm:table-cell">Placement</TableHead>
                          <TableHead className="text-muted-foreground font-medium">Customer</TableHead>
                          <TableHead className="text-muted-foreground font-medium hidden md:table-cell">Country</TableHead>
                          <TableHead className="text-muted-foreground font-medium text-right">Amount</TableHead>
                          <TableHead className="text-muted-foreground font-medium text-right">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedTransactions.map(tx => <TableRow key={tx.id} className="border-border hover:bg-muted/50 transition-colors h-14">
                            <TableCell className="py-4">{getTypeBadge(tx.type)}</TableCell>
                            <TableCell className="py-4">
                              <button className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors cursor-pointer group" onClick={() => navigate('/links')}>
                                <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                                  <Link2 className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <span className="font-medium group-hover:underline">ghost.link/{tx.linkAlias}</span>
                              </button>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell py-4">
                              <PlacementBadge source={tx.placement} />
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                                    {getCustomerInitials(tx.description)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-foreground truncate max-w-[180px]">
                                  {tx.description}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell py-4">
                              {tx.location && COUNTRIES[tx.location] ? <div className="flex items-center gap-2">
                                  <span className="text-base">{COUNTRIES[tx.location].flag}</span>
                                  <span className="text-sm text-muted-foreground">{COUNTRIES[tx.location].name}</span>
                                </div> : <div className="flex items-center gap-2 text-muted-foreground">
                                  <Globe className="w-4 h-4" />
                                  <span className="text-sm">Unknown</span>
                                </div>}
                            </TableCell>
                            <TableCell className="text-right py-4 font-mono">
                              {tx.amount !== null ? <span className="text-foreground font-medium">${tx.amount.toFixed(2)}</span> : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-right py-4">
                              <span className="text-sm text-muted-foreground font-mono whitespace-nowrap">
                                {formatInTimezone(tx.date, 'MMM d, HH:mm')}
                              </span>
                            </TableCell>
                          </TableRow>)}
                      </TableBody>
                    </Table>
                    
                    {/* Load More Button */}
                    {hasMoreTransactions && <div className="flex items-center justify-center py-3 border-t border-border bg-muted/20">
                        <Button variant="ghost" size="sm" onClick={handleLoadMore} className="text-muted-foreground hover:text-foreground">
                          Load more ({Math.max(0, filteredTransactions.length - visibleCount)} remaining)
                        </Button>
                      </div>}
                  </div>}

                {/* Sample Data Toggle */}
                {showSampleData && !hasRealData && <div className="mt-4 flex items-center justify-center">
                    <Button variant="ghost" size="sm" onClick={() => setShowSampleData(false)} className="text-muted-foreground">
                      Hide Sample Data
                    </Button>
                  </div>}
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