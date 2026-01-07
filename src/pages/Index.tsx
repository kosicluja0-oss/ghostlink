import { useState, useMemo } from 'react';
import { MousePointer, Users, DollarSign, TrendingUp, Percent } from 'lucide-react';
import type { TimeRange } from '@/components/analytics/TimeRangeSelector';
import { Header } from '@/components/layout/Header';
import { SettingsDrawer } from '@/components/layout/SettingsDrawer';
import { StatCard } from '@/components/analytics/StatCard';
import { AnalyticsChart } from '@/components/analytics/AnalyticsChart';
import { LinkKanban } from '@/components/links/LinkKanban';
import { CreateLinkModal } from '@/components/links/CreateLinkModal';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { TierType } from '@/types';
import { TIERS } from '@/types';

const Index = () => {
  const [userTier, setUserTier] = useState<TierType>('pro');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [filteredData, setFilteredData] = useState<typeof analyticsData | null>(null);
  
  const { analyticsData, links, stats, isLoading, addLink, archiveLink, restoreLink } = useAnalytics();
  
  const tier = TIERS[userTier];
  const isFreeTier = userTier === 'free';
  const activeLinksCount = links.filter(l => l.status === 'active').length;

  // Calculate stats based on filtered data (time range)
  const displayStats = useMemo(() => {
    const dataToUse = filteredData ?? analyticsData;
    const totalClicks = dataToUse.reduce((sum, d) => sum + d.clicks, 0);
    const totalLeads = dataToUse.reduce((sum, d) => sum + d.leads, 0);
    const totalSales = dataToUse.reduce((sum, d) => sum + d.sales, 0);
    
    let conversionRate = 0;
    let earningsPerClick = 0;
    
    if (totalClicks > 0) {
      conversionRate = ((totalLeads + totalSales) / totalClicks) * 100;
      const totalEarnings = links.reduce((sum, l) => sum + l.earnings, 0);
      earningsPerClick = totalEarnings / totalClicks;
    }
    
    return {
      totalClicks,
      totalLeads,
      totalSales,
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
    <div className="min-h-screen bg-background">
      <Header
        userTier={userTier}
        currentLinkCount={activeLinksCount}
        onCreateLink={() => setCreateModalOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="container mx-auto px-4 py-8">
        {/* Stats Banner */}
        <section className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard
              label="Total Clicks"
              value={displayStats.totalClicks.toLocaleString()}
              icon={MousePointer}
              trend={{ value: 12.5, isPositive: true }}
              accentColor="primary"
            />
            <StatCard
              label="Total Leads"
              value={displayStats.totalLeads.toLocaleString()}
              icon={Users}
              trend={{ value: 8.3, isPositive: true }}
              isLocked={isFreeTier}
              accentColor="warning"
            />
            <StatCard
              label="Total Sales"
              value={displayStats.totalSales.toLocaleString()}
              icon={DollarSign}
              trend={{ value: 15.2, isPositive: true }}
              isLocked={isFreeTier}
              accentColor="success"
            />
            <StatCard
              label="Conversion Rate"
              value={`${displayStats.conversionRate.toFixed(2)}%`}
              icon={Percent}
              trend={{ value: 2.1, isPositive: true }}
              isLocked={isFreeTier}
              accentColor="chart-conversions"
            />
            <StatCard
              label="EPC"
              value={formatCurrency(displayStats.earningsPerClick)}
              icon={TrendingUp}
              trend={{ value: 5.7, isPositive: true }}
              isLocked={isFreeTier}
              accentColor="success"
            />
          </div>
        </section>

        {/* Chart */}
        <section className="mb-8">
          <AnalyticsChart 
            data={analyticsData} 
            showConversions={!isFreeTier}
            onTimeRangeChange={handleTimeRangeChange}
          />
        </section>

        {/* Link Management */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Your Links</h2>
            <span className="text-sm text-muted-foreground">
              {activeLinksCount} of {tier.maxLinks} active
            </span>
          </div>
          
          <LinkKanban
            links={links}
            userTier={userTier}
            onArchive={archiveLink}
            onRestore={restoreLink}
          />
        </section>
      </main>

      {/* Modals & Drawers */}
      <SettingsDrawer
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        userTier={userTier}
        onChangeTier={setUserTier}
      />

      <CreateLinkModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={addLink}
        userTier={userTier}
        currentLinkCount={activeLinksCount}
        maxLinks={tier.maxLinks}
      />
    </div>
  );
};

export default Index;
