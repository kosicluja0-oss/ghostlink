import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MousePointer, Users, DollarSign, TrendingUp, Percent, Plus } from 'lucide-react';
import { GetStartedCard } from '@/components/onboarding/GetStartedCard';
import type { TimeRange } from '@/components/analytics/TimeRangeSelector';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SettingsDrawer } from '@/components/layout/SettingsDrawer';
import { DataIntegrationModal } from '@/components/modals/DataIntegrationModal';
import { StatCard } from '@/components/analytics/StatCard';
import { AnalyticsChart } from '@/components/analytics/AnalyticsChart';
import { LinkTable } from '@/components/links/LinkTable';
import { CreateLinkModal } from '@/components/links/CreateLinkModal';
import { useLinks } from '@/hooks/useLinks';
import { useClicksRealtime } from '@/hooks/useClicksRealtime';
import { useAuth } from '@/hooks/useAuth';
import type { TierType, AnalyticsData } from '@/types';
import { TIERS } from '@/types';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  const [userTier, setUserTier] = useState<TierType>('pro');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dataIntegrationOpen, setDataIntegrationOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [filteredData, setFilteredData] = useState<AnalyticsData[] | null>(null);
  const [activeLinkId, setActiveLinkId] = useState<string | null>(null);
  
  // Use real data hooks
  const { links, addLink, archiveLink, restoreLink } = useLinks();
  const { analyticsData, stats } = useClicksRealtime();
  
  const tier = TIERS[userTier];
  const isFreeTier = userTier === 'free';
  const activeLinksCount = links.filter(l => l.status === 'active').length;

  // Get the currently selected link
  const selectedLink = useMemo(() => {
    return activeLinkId ? links.find(l => l.id === activeLinkId) : null;
  }, [activeLinkId, links]);

  // Handle link selection
  const handleLinkSelect = useCallback((linkId: string) => {
    setActiveLinkId(prev => prev === linkId ? null : linkId);
  }, []);

  // Clear link selection
  const handleClearSelection = useCallback(() => {
    setActiveLinkId(null);
  }, []);

  // Calculate stats based on filtered data (time range)
  const displayStats = useMemo(() => {
    const dataToUse = filteredData ?? analyticsData;
    const totalClicks = dataToUse.reduce((sum, d) => sum + d.clicks, 0);
    const totalLeads = dataToUse.reduce((sum, d) => sum + d.leads, 0);
    const totalSales = dataToUse.reduce((sum, d) => sum + d.sales, 0);
    
    // Calculate earnings from links data
    const totalEarnings = links.reduce((sum, l) => sum + l.earnings, 0);
    
    let conversionRate = 0;
    let earningsPerClick = 0;
    
    if (totalClicks > 0) {
      conversionRate = ((totalLeads + totalSales) / totalClicks) * 100;
      earningsPerClick = totalEarnings / totalClicks;
    }
    
    return {
      totalClicks,
      totalLeads,
      totalSales,
      totalEarnings,
      conversionRate,
      earningsPerClick,
    };
  }, [filteredData, analyticsData, links]);

  const handleTimeRangeChange = (range: TimeRange, data: typeof analyticsData) => {
    setFilteredData(data);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar
            userEmail={user?.email}
            userTier={userTier}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenDataIntegration={() => setDataIntegrationOpen(true)}
            onSignOut={signOut}
          />
          
          <SidebarInset className="flex-1">
            <main className="p-4 lg:p-6">
              {/* Get Started Onboarding */}
              <section className="mb-5">
                <GetStartedCard onCreateLink={() => setCreateModalOpen(true)} />
              </section>

              {/* Stats Banner - Compact */}
              <section className="mb-5">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <StatCard
                    label="Total Clicks"
                    value={displayStats.totalClicks.toLocaleString()}
                    icon={MousePointer}
                    trend={{ value: 12.5, isPositive: true }}
                    accentColor="primary"
                    compact
                  />
                  <StatCard
                    label="Total Leads"
                    value={displayStats.totalLeads.toLocaleString()}
                    icon={Users}
                    trend={{ value: 8.3, isPositive: true }}
                    isLocked={isFreeTier}
                    accentColor="warning"
                    compact
                  />
                  <StatCard
                    label="Total Sales"
                    value={displayStats.totalSales.toLocaleString()}
                    icon={DollarSign}
                    trend={{ value: 15.2, isPositive: true }}
                    isLocked={isFreeTier}
                    accentColor="success"
                    compact
                  />
                  <StatCard
                    label="Conversion Rate"
                    value={`${displayStats.conversionRate.toFixed(2)}%`}
                    icon={Percent}
                    trend={{ value: 2.1, isPositive: true }}
                    isLocked={isFreeTier}
                    accentColor="chart-conversions"
                    compact
                  />
                  <StatCard
                    label="EPC"
                    value={formatCurrency(displayStats.earningsPerClick)}
                    icon={TrendingUp}
                    trend={{ value: 5.7, isPositive: true }}
                    isLocked={isFreeTier}
                    accentColor="success"
                    compact
                  />
                </div>
              </section>

              {/* Chart */}
              <section className="mb-5">
                <AnalyticsChart 
                  data={analyticsData} 
                  showConversions={!isFreeTier}
                  onTimeRangeChange={handleTimeRangeChange}
                  activeLinkId={activeLinkId}
                  selectedLinkAlias={selectedLink?.alias}
                  onClearSelection={handleClearSelection}
                  links={links}
                />
              </section>

              {/* Link Management */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-foreground">Your Links</h2>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] text-muted-foreground">
                      {activeLinksCount} of {tier.maxLinks} active
                    </span>
                    <Button variant="glow" size="sm" onClick={() => setCreateModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      New Link
                    </Button>
                  </div>
                </div>
                
                <LinkTable
                  links={links}
                  userTier={userTier}
                  onArchive={archiveLink}
                  onRestore={restoreLink}
                  activeLinkId={activeLinkId}
                  onLinkSelect={handleLinkSelect}
                />
              </section>
            </main>
          </SidebarInset>
        </div>

        {/* Modals & Drawers */}
        <SettingsDrawer
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          userTier={userTier}
          onChangeTier={setUserTier}
        />

        <DataIntegrationModal
          open={dataIntegrationOpen}
          onOpenChange={setDataIntegrationOpen}
        />

        <CreateLinkModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onSubmit={addLink}
          userTier={userTier}
          currentLinkCount={activeLinksCount}
          maxLinks={tier.maxLinks}
        />
      </SidebarProvider>
    </TooltipProvider>
  );
};

export default Dashboard;