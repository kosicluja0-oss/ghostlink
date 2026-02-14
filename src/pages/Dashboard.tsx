import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MousePointer, Users, DollarSign, TrendingUp, Percent, User, MousePointerClick, Sparkles, Link2, Globe, LayoutDashboard, CalendarDays, ChevronDown, ChevronUp, X } from 'lucide-react';
import type { MetricKey } from '@/components/analytics/AnalyticsChart';
import { Avatar, AvatarFallback } from '@/components/ui/avatar'; // kept for potential future use
import type { TimeRange } from '@/components/analytics/TimeRangeSelector';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useSidebarState } from '@/hooks/useSidebarState';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SettingsDrawer } from '@/components/layout/SettingsDrawer';
import { DataIntegrationModal } from '@/components/modals/DataIntegrationModal';
import { StatCard } from '@/components/analytics/StatCard';
import { AnalyticsChart } from '@/components/analytics/AnalyticsChart';
import { TopPlacementsCard } from '@/components/analytics/TopPlacementsCard';
import { TopCountriesCard } from '@/components/analytics/TopCountriesCard';
import { TopLinksCard } from '@/components/analytics/TopLinksCard';
import { PlacementBadge, parsePlacement } from '@/components/analytics/PlacementBadge';
import { WelcomeWizard } from '@/components/wizard/WelcomeWizard';
import { LiveSignalIndicator } from '@/components/wizard/LiveSignalIndicator';
import { useLinks } from '@/hooks/useLinks';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAuth } from '@/hooks/useAuth';

import { useProfile } from '@/hooks/useProfile';
import { useSubscription } from '@/hooks/useSubscription';
import { useTimezone } from '@/hooks/useTimezone';
import { useTrends } from '@/hooks/useTrendCalculation';
import { COUNTRIES } from '@/lib/countries';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
type TransactionType = 'click' | 'lead' | 'sale';

const METRIC_COLORS: Record<MetricKey, string> = {
  clicks: 'hsl(var(--chart-clicks))',
  leads: 'hsl(var(--warning))',
  sales: 'hsl(var(--success))',
  revenue: 'hsl(var(--success))',
  cr: 'hsl(var(--chart-conversions))',
  epc: 'hsl(var(--foreground))'
};

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

const Dashboard = () => {
  const navigate = useNavigate();
  const { sidebarOpen, setSidebarOpen } = useSidebarState();
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
  const [activeMetric, setActiveMetric] = useState<MetricKey>('clicks');
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  // Welcome wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [showLiveSignal, setShowLiveSignal] = useState(false);

  // Activity filters
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
  }, [recentActivity]);

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

  // Apply time range filter + optional link filter
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    // Global time range filter
    filtered = filtered.filter(t => t.date >= timeRangeCutoff);
    // Link filter
    if (selectedLinkId) {
      filtered = filtered.filter(t => t.linkId === selectedLinkId);
    }
    return filtered;
  }, [transactions, timeRangeCutoff, selectedLinkId]);

  // Show only the last 6 events
  const paginatedTransactions = useMemo(() => {
    return showAllEvents ? filteredTransactions : filteredTransactions.slice(0, 8);
  }, [filteredTransactions, showAllEvents]);

  const hasMoreEvents = filteredTransactions.length > 8;
  const handleMetricChange = useCallback((metric: MetricKey) => setActiveMetric(metric), []);

  // Calculate stats based on global time range + optional link filter
  const displayStats = useMemo(() => {
    let dataToUse = chartData.filter(d => new Date(d.date) >= timeRangeCutoff);
    if (selectedLinkId) {
      dataToUse = dataToUse.filter(d => d.linkId === selectedLinkId);
    }
    const totalClicks = dataToUse.reduce((sum, d) => sum + d.clicks, 0);
    const totalLeads = dataToUse.reduce((sum, d) => sum + d.leads, 0);
    const totalSales = dataToUse.reduce((sum, d) => sum + d.sales, 0);
    const totalEarnings = dataToUse.reduce((sum, d) => sum + d.earnings, 0);
    let conversionRate = 0;
    let earningsPerClick = 0;
    if (totalClicks > 0) {
      conversionRate = (totalLeads + totalSales) / totalClicks * 100;
      earningsPerClick = totalEarnings / totalClicks;
    }
    return {
      totalClicks,
      totalLeads,
      totalSales,
      totalEarnings,
      conversionRate,
      earningsPerClick
    };
  }, [timeRangeCutoff, chartData, selectedLinkId]);
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

  // Selected link alias for display
  const selectedLinkAlias = useMemo(() => {
    if (!selectedLinkId) return undefined;
    return links.find(l => l.id === selectedLinkId)?.alias;
  }, [selectedLinkId, links]);

  // Placement analytics from server-side distribution
  const placementAnalytics = useMemo(() => {
    return placementDistribution.map(p => {
      const parsed = parsePlacement(p.source === 'direct' || !p.source ? undefined : p.source);
      return {
        platform: parsed?.platform || 'direct',
        placement: parsed?.placement || 'Direct',
        clicks: p.clicks,
        leads: p.leads,
        sales: p.sales,
        earnings: Number(p.earnings),
      };
    });
  }, [placementDistribution]);

  // Country analytics from server-side distribution
  const countryAnalytics = useMemo(() => {
    return countryDistribution
      .filter(c => c.country !== 'UNKNOWN')
      .map(c => ({
        code: c.country,
        clicks: c.clicks,
        leads: c.leads,
        sales: c.sales,
        earnings: Number(c.earnings),
      }));
  }, [countryDistribution]);
  return <TooltipProvider>
      <>
        {/* Welcome Wizard Overlay */}
        {showWizard && <WelcomeWizard userName={userName} tier={subscriptionTier} onComplete={handleWizardComplete} onLinkCreated={refetchLinks} />}
        
        <div className="min-h-screen bg-background">
          <AppSidebar />
          
          <main className="ml-[15vw] p-4 lg:p-6">
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
                {selectedLinkId && selectedLinkAlias && (
                  <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                    <Link2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-xs font-medium text-primary">
                      Filtering by: /{selectedLinkAlias}
                    </span>
                    <button
                      onClick={() => setSelectedLinkId(null)}
                      className="ml-auto text-primary/60 hover:text-primary transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <StatCard label="Total Clicks" value={displayStats.totalClicks.toLocaleString()} icon={MousePointer} trend={selectedLinkId ? undefined : (clicksTrend ?? undefined)} accentColor="primary" customColor="hsl(var(--chart-clicks))" compact tooltip="Total number of times someone clicked on your tracking link. Every visit counts — even repeat visitors." isActive={activeMetric === 'clicks'} onClick={() => handleMetricChange('clicks')} />
                  <StatCard label="Total Leads" value={displayStats.totalLeads.toLocaleString()} icon={Users} trend={selectedLinkId ? undefined : (leadsTrend ?? undefined)} isLocked={isFreeTier} accentColor="warning" compact tooltip="People who took a desired action after clicking — like signing up, submitting a form, or opting in. A lead means someone showed real interest." isActive={activeMetric === 'leads'} onClick={() => handleMetricChange('leads')} />
                  <StatCard label="Total Sales" value={displayStats.totalSales.toLocaleString()} icon={TrendingUp} trend={selectedLinkId ? undefined : (salesTrend ?? undefined)} isLocked={isFreeTier} accentColor="success" compact tooltip="Confirmed purchases made through your links. Each sale means someone bought the product or service you're promoting." isActive={activeMetric === 'sales'} onClick={() => handleMetricChange('sales')} />
                  <StatCard label="Revenue" value={formatCurrency(displayStats.totalEarnings)} icon={DollarSign} trend={selectedLinkId ? undefined : (earningsTrend ?? undefined)} isLocked={isFreeTier} accentColor="success" compact tooltip="Total money earned from all your sales. This is the sum of commissions or product prices generated through your links." isActive={activeMetric === 'revenue'} onClick={() => handleMetricChange('revenue')} />
                  <StatCard label="Conv. Rate" value={`${displayStats.conversionRate.toFixed(2)}%`} icon={Percent} trend={selectedLinkId ? undefined : (conversionTrend ?? undefined)} isLocked={isFreeTier} accentColor="chart-conversions" compact tooltip="The percentage of clicks that turned into leads or sales. A higher rate means your traffic is more targeted and your offer resonates well." isActive={activeMetric === 'cr'} onClick={() => handleMetricChange('cr')} />
                  <StatCard label="EPC" value={formatCurrency(displayStats.earningsPerClick)} icon={Sparkles} trend={selectedLinkId ? undefined : (epcTrend ?? undefined)} isLocked={isFreeTier} accentColor="primary" compact tooltip="Earnings Per Click — how much money you earn on average for each click. It helps you compare which links or traffic sources are most profitable." isActive={activeMetric === 'epc'} onClick={() => handleMetricChange('epc')} />
                </div>
              </section>

              {/* Chart + Activity Table Row */}
              <section className="mb-5">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                  <div className="lg:col-span-3">
                    <AnalyticsChart data={chartData} showConversions={!isFreeTier} timeRange={timeRange} activeLinkId={selectedLinkId} selectedLinkAlias={selectedLinkAlias} onClearSelection={() => setSelectedLinkId(null)} links={links} activeMetric={activeMetric} onMetricChange={handleMetricChange} />
                  </div>
                  <div className="lg:col-span-2">
                    {showLiveSignal && <div className="mb-3"><LiveSignalIndicator /></div>}
                    {filteredTransactions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-border rounded-xl bg-card/50 h-full">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                          <MousePointerClick className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground mb-1">No activity yet</h3>
                        <p className="text-xs text-muted-foreground text-center max-w-xs">
                          Once you start getting clicks and conversions, they'll appear here.
                        </p>
                      </div>
                    ) : (
                      <div className="border border-border rounded-xl overflow-hidden bg-card flex flex-col" style={{ height: '311px' }}>
                        <div className="flex-1 min-h-0 overflow-y-auto">
                          <Table>
                            <TableBody>
                              {paginatedTransactions.map(tx => (
                                <TableRow key={tx.id} className="border-border hover:bg-muted/50 transition-colors">
                                  <TableCell className="py-2 px-2">{getTypeBadge(tx.type)}</TableCell>
                                  <TableCell className="py-2 px-2">
                                    <button className="flex items-center gap-1 text-xs text-foreground hover:text-primary transition-colors cursor-pointer group" onClick={() => navigate('/links')}>
                                      <Link2 className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                      <span className="font-medium group-hover:underline truncate max-w-[60px]">/{tx.linkAlias}</span>
                                    </button>
                                  </TableCell>
                                  <TableCell className="py-2 px-2 hidden xl:table-cell">
                                    <span className="text-xs text-foreground truncate max-w-[80px] block">
                                      {tx.description}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right py-2 px-2 font-mono text-xs hidden sm:table-cell">
                                    {tx.amount !== null ? <span className="text-foreground font-medium">${tx.amount.toFixed(2)}</span> : <span className="text-muted-foreground">—</span>}
                                  </TableCell>
                                  <TableCell className="text-right py-2 px-1.5">
                                    <span className="text-[11px] text-muted-foreground font-mono whitespace-nowrap">
                                      {formatInTimezone(tx.date, 'MMM d, HH:mm')}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        {hasMoreEvents && (
                          <div className="border-t border-white/10 px-3 py-1.5 backdrop-blur-xl bg-background/30">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowAllEvents(!showAllEvents)}
                              className="w-full text-xs text-muted-foreground hover:text-foreground gap-1 h-7"
                            >
                              {showAllEvents ? (
                                <>Show less <ChevronUp className="w-3 h-3" /></>
                              ) : (
                                <>Show all ({filteredTransactions.length}) <ChevronDown className="w-3 h-3" /></>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Countries + Placements + Links Row */}
              <section className="mb-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <TopCountriesCard countries={countryAnalytics} activeMetric={activeMetric} metricColor={METRIC_COLORS[activeMetric]} />
                  <TopPlacementsCard placements={placementAnalytics} activeMetric={activeMetric} metricColor={METRIC_COLORS[activeMetric]} />
                  <TopLinksCard links={links} activeMetric={activeMetric} metricColor={METRIC_COLORS[activeMetric]} selectedLinkId={selectedLinkId} onLinkSelect={setSelectedLinkId} />
                </div>
              </section>
            </main>
        </div>

        {/* Modals & Drawers */}
        <SettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} userTier={subscriptionTier} onChangeTier={() => {}} />

        <DataIntegrationModal open={dataIntegrationOpen} onOpenChange={setDataIntegrationOpen} />
      </>
    </TooltipProvider>;
};
export default Dashboard;