import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Database, Filter, CalendarDays, ShoppingCart, UserPlus, MousePointerClick, 
  Package, Sparkles, Monitor, Smartphone, Globe
} from 'lucide-react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SettingsDrawer } from '@/components/layout/SettingsDrawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { useLinks } from '@/hooks/useLinks';
import { useClicksRealtime } from '@/hooks/useClicksRealtime';
import type { TierType } from '@/types';

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
  locationFlag?: string;
  device?: 'desktop' | 'mobile';
  platform?: string;
}

// Flag emoji mapping for countries
const FLAGS: Record<string, string> = {
  US: '🇺🇸', UK: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷', CA: '🇨🇦', AU: '🇦🇺', 
  JP: '🇯🇵', BR: '🇧🇷', ES: '🇪🇸', IT: '🇮🇹', NL: '🇳🇱', CZ: '🇨🇿'
};

// Platform icons mapping
const PLATFORMS: Record<string, string> = {
  youtube: 'YT',
  instagram: 'IG',
  twitter: 'X',
  tiktok: 'TT',
  direct: '🔗',
};

// Sample mock data generator
const generateSampleData = (): Transaction[] => {
  const sampleTransactions: Transaction[] = [
    {
      id: 'sample-1',
      date: new Date(Date.now() - 1000 * 60 * 30),
      type: 'sale',
      description: 'Purchase: Summer E-book',
      amount: 49.00,
      source: 'Gumroad',
      sourceIcon: 'gumroad',
      linkId: '1',
      linkAlias: 'Summer Promo',
      location: 'US',
      locationFlag: FLAGS.US,
      device: 'desktop',
      platform: 'youtube',
    },
    {
      id: 'sample-2',
      date: new Date(Date.now() - 1000 * 60 * 60 * 2),
      type: 'lead',
      description: 'New Subscriber',
      amount: null,
      source: 'Direct Link',
      sourceIcon: 'direct',
      linkId: '2',
      linkAlias: 'Newsletter Signup',
      location: 'DE',
      locationFlag: FLAGS.DE,
      device: 'mobile',
      platform: 'instagram',
    },
    {
      id: 'sample-3',
      date: new Date(Date.now() - 1000 * 60 * 60 * 3),
      type: 'sale',
      description: 'Premium Course',
      amount: 199.00,
      source: 'Stripe',
      sourceIcon: 'stripe',
      linkId: '3',
      linkAlias: 'Course Link',
      location: 'UK',
      locationFlag: FLAGS.UK,
      device: 'desktop',
      platform: 'twitter',
    },
    {
      id: 'sample-4',
      date: new Date(Date.now() - 1000 * 60 * 60 * 5),
      type: 'click',
      description: 'Link clicked',
      amount: null,
      source: 'Direct Link',
      sourceIcon: 'direct',
      linkId: '1',
      linkAlias: 'Summer Promo',
      location: 'FR',
      locationFlag: FLAGS.FR,
      device: 'mobile',
      platform: 'tiktok',
    },
    {
      id: 'sample-5',
      date: new Date(Date.now() - 1000 * 60 * 60 * 8),
      type: 'sale',
      description: 'E-book Bundle',
      amount: 79.00,
      source: 'Lemon Squeezy',
      sourceIcon: 'lemon',
      linkId: '2',
      linkAlias: 'E-book Launch',
      location: 'CA',
      locationFlag: FLAGS.CA,
      device: 'desktop',
      platform: 'youtube',
    },
    {
      id: 'sample-6',
      date: new Date(Date.now() - 1000 * 60 * 60 * 12),
      type: 'lead',
      description: 'joh***@gmail.com',
      amount: null,
      source: 'Direct Link',
      sourceIcon: 'direct',
      linkId: '3',
      linkAlias: 'Newsletter Signup',
      location: 'AU',
      locationFlag: FLAGS.AU,
      device: 'mobile',
      platform: 'instagram',
    },
    {
      id: 'sample-7',
      date: new Date(Date.now() - 1000 * 60 * 60 * 18),
      type: 'click',
      description: 'Link clicked',
      amount: null,
      source: 'Direct Link',
      sourceIcon: 'direct',
      linkId: '1',
      linkAlias: 'Summer Promo',
      location: 'JP',
      locationFlag: FLAGS.JP,
      device: 'desktop',
      platform: 'direct',
    },
    {
      id: 'sample-8',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24),
      type: 'sale',
      description: 'Annual Membership',
      amount: 299.00,
      source: 'Stripe',
      sourceIcon: 'stripe',
      linkId: '4',
      linkAlias: 'Course Link',
      location: 'BR',
      locationFlag: FLAGS.BR,
      device: 'mobile',
      platform: 'youtube',
    },
    {
      id: 'sample-9',
      date: new Date(Date.now() - 1000 * 60 * 60 * 36),
      type: 'lead',
      description: 'sar***@outlook.com',
      amount: null,
      source: 'Gumroad',
      sourceIcon: 'gumroad',
      linkId: '2',
      linkAlias: 'E-book Launch',
      location: 'ES',
      locationFlag: FLAGS.ES,
      device: 'desktop',
      platform: 'twitter',
    },
    {
      id: 'sample-10',
      date: new Date(Date.now() - 1000 * 60 * 60 * 48),
      type: 'sale',
      description: 'Digital Workshop',
      amount: 149.00,
      source: 'Gumroad',
      sourceIcon: 'gumroad',
      linkId: '1',
      linkAlias: 'Summer Promo',
      location: 'NL',
      locationFlag: FLAGS.NL,
      device: 'mobile',
      platform: 'instagram',
    },
  ];

  return sampleTransactions;
};

const Transactions = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { links } = useLinks();
  const { clicks, conversions } = useClicksRealtime();
  
  const [userTier, setUserTier] = useState<TierType>('pro');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [showSampleData, setShowSampleData] = useState(false);

  // Build transactions from clicks and conversions
  const realTransactions: Transaction[] = useMemo(() => {
    const result: Transaction[] = [];
    
    // Map link IDs to aliases
    const linkMap = new Map(links.map(l => [l.id, l.alias]));

    // Add clicks
    clicks.forEach(click => {
      const alias = linkMap.get(click.link_id) || 'Unknown';
      result.push({
        id: `click-${click.id}`,
        date: new Date(click.created_at),
        type: 'click',
        description: 'Link clicked',
        amount: null,
        source: 'Direct Link',
        sourceIcon: 'direct',
        linkId: click.link_id,
        linkAlias: alias,
      });
    });

    // Add conversions (leads and sales)
    conversions.forEach(conv => {
      const alias = conv.link_id ? linkMap.get(conv.link_id) || 'Unknown' : 'Unknown';
      result.push({
        id: `conv-${conv.id}`,
        date: new Date(conv.created_at),
        type: conv.type as TransactionType,
        description: conv.type === 'sale' ? 'Purchase completed' : 'New subscriber',
        amount: conv.type === 'sale' ? Number(conv.value) : null,
        source: 'Webhook',
        sourceIcon: 'direct',
        linkId: conv.link_id || '',
        linkAlias: alias,
      });
    });

    // Sort by date descending
    return result.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [clicks, conversions, links]);

  // Combine real data with sample data if enabled
  const transactions = useMemo(() => {
    if (showSampleData && realTransactions.length === 0) {
      return generateSampleData();
    }
    return realTransactions;
  }, [realTransactions, showSampleData]);

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

    return filtered;
  }, [transactions, typeFilter, dateRange]);

  const getTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'sale':
        return (
          <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20">
            <ShoppingCart className="w-3 h-3 mr-1" />
            Sale
          </Badge>
        );
      case 'lead':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20 hover:bg-warning/20">
            <UserPlus className="w-3 h-3 mr-1" />
            Lead
          </Badge>
        );
      case 'click':
        return (
          <Badge variant="secondary" className="bg-muted text-muted-foreground">
            <MousePointerClick className="w-3 h-3 mr-1" />
            Click
          </Badge>
        );
    }
  };

  const getSourceIcon = (source: string, sourceIcon: string) => {
    switch (sourceIcon) {
      case 'gumroad':
        return <div className="w-5 h-5 rounded bg-pink-500/20 text-pink-400 flex items-center justify-center text-[10px] font-bold">G</div>;
      case 'stripe':
        return <div className="w-5 h-5 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-bold">S</div>;
      case 'lemon':
        return <div className="w-5 h-5 rounded bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-[10px] font-bold">L</div>;
      default:
        return <Package className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const salesCount = filteredTransactions.filter(t => t.type === 'sale').length;
  const leadsCount = filteredTransactions.filter(t => t.type === 'lead').length;
  const totalRevenue = filteredTransactions
    .filter(t => t.type === 'sale' && t.amount)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const hasRealData = realTransactions.length > 0;

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar
            userEmail={user?.email}
            userTier={userTier}
            onOpenSettings={() => navigate('/settings')}
            onOpenDataIntegration={() => navigate('/integrations')}
            onSignOut={signOut}
          />
          
          <SidebarInset className="flex-1">
            <main className="p-4 lg:p-6 max-w-7xl mx-auto">
              {/* Header */}
              <section className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                    <Database className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Recent Activity</h1>
                    <p className="text-sm text-muted-foreground">
                      Track every click, lead, and sale in real-time
                    </p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-success">${totalRevenue.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">Revenue</span>
                  </div>
                  <div className="h-6 w-px bg-border" />
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-foreground">{salesCount}</span>
                    <span className="text-xs text-muted-foreground">Sales</span>
                  </div>
                  <div className="h-6 w-px bg-border" />
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-foreground">{leadsCount}</span>
                    <span className="text-xs text-muted-foreground">Leads</span>
                  </div>
                </div>
              </section>

              {/* Filters */}
              <section className="mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Filters:</span>
                  </div>
                  
                  <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
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

                  <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
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

                  {(typeFilter !== 'all' || dateRange !== '7d') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTypeFilter('all');
                        setDateRange('7d');
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </section>

              {/* Data Table or Empty State */}
              {filteredTransactions.length === 0 && !showSampleData ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-border rounded-xl bg-card/50">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Database className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No transactions yet</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
                    Once you start getting clicks and conversions, they'll appear here in real-time.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSampleData(true)}
                    className="gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Show Sample Data
                  </Button>
                </div>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-border">
                        <TableHead className="text-muted-foreground font-medium">Time</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Type</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Description</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Link</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Source</TableHead>
                        <TableHead className="text-muted-foreground font-medium hidden md:table-cell">Location</TableHead>
                        <TableHead className="text-muted-foreground font-medium hidden lg:table-cell">Device</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((tx) => (
                        <TableRow key={tx.id} className="border-border hover:bg-muted/50">
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {format(tx.date, 'MMM d, HH:mm')}
                          </TableCell>
                          <TableCell>{getTypeBadge(tx.type)}</TableCell>
                          <TableCell className="text-sm text-foreground max-w-[200px] truncate">
                            {tx.description}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {tx.linkAlias}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getSourceIcon(tx.source, tx.sourceIcon)}
                              <span className="text-sm text-muted-foreground">{tx.source}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {tx.location && (
                              <div className="flex items-center gap-1.5">
                                <span>{tx.locationFlag}</span>
                                <span className="text-sm text-muted-foreground">{tx.location}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {tx.device && (
                              <div className="flex items-center gap-1.5">
                                {tx.device === 'desktop' ? (
                                  <Monitor className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <Smartphone className="w-4 h-4 text-muted-foreground" />
                                )}
                                {tx.platform && (
                                  <span className="text-xs text-muted-foreground uppercase">
                                    {PLATFORMS[tx.platform] || tx.platform}
                                  </span>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {tx.amount !== null ? (
                              <span className="text-success">${tx.amount.toFixed(2)}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Sample Data Toggle */}
              {showSampleData && !hasRealData && (
                <div className="mt-4 flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSampleData(false)}
                    className="text-muted-foreground"
                  >
                    Hide Sample Data
                  </Button>
                </div>
              )}
            </main>
          </SidebarInset>
        </div>

        {/* Modals */}
        <SettingsDrawer
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          userTier={userTier}
          onChangeTier={setUserTier}
        />
      </SidebarProvider>
    </TooltipProvider>
  );
};

export default Transactions;