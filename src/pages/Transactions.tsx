import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Database, Filter, CalendarDays, ShoppingCart, UserPlus, MousePointerClick, Package } from 'lucide-react';
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
  linkId: string;
  linkAlias: string;
}

const Transactions = () => {
  const navigate = useNavigate();
  const { user, session, isLoading: authLoading, signOut } = useAuth();
  const { links } = useLinks();
  const { clicks, conversions } = useClicksRealtime();
  
  const [userTier, setUserTier] = useState<TierType>('pro');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [dateRange, setDateRange] = useState<DateRange>('7d');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/auth');
    }
  }, [authLoading, session, navigate]);

  // Build transactions from clicks and conversions
  const transactions: Transaction[] = useMemo(() => {
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
        linkId: conv.link_id || '',
        linkAlias: alias,
      });
    });

    // Sort by date descending
    return result.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [clicks, conversions, links]);

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

  const getSourceIcon = (source: string) => {
    // Could be extended with actual integration icons
    return <Package className="w-4 h-4 text-muted-foreground" />;
  };

  const salesCount = filteredTransactions.filter(t => t.type === 'sale').length;
  const leadsCount = filteredTransactions.filter(t => t.type === 'lead').length;
  const totalRevenue = filteredTransactions
    .filter(t => t.type === 'sale' && t.amount)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar
            userEmail={user?.email}
            userTier={userTier}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenDataIntegration={() => navigate('/integrations')}
            onSignOut={signOut}
          />
          
          <SidebarInset className="flex-1">
            <main className="p-4 lg:p-6 max-w-6xl mx-auto">
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
              {filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 bg-card border border-border rounded-xl">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Database className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">No activity yet</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
                    Share your tracking links to start seeing clicks, leads, and sales here!
                  </p>
                  <Button onClick={() => navigate('/dashboard')}>
                    Go to Dashboard
                  </Button>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="w-[140px]">Date</TableHead>
                        <TableHead className="w-[100px]">Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[100px] text-right">Amount</TableHead>
                        <TableHead className="w-[100px]">Source</TableHead>
                        <TableHead className="w-[140px]">Link</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id} className="group">
                          <TableCell className="text-sm text-muted-foreground">
                            {format(transaction.date, 'MMM d, HH:mm')}
                          </TableCell>
                          <TableCell>
                            {getTypeBadge(transaction.type)}
                          </TableCell>
                          <TableCell className="text-sm text-foreground">
                            {transaction.description}
                          </TableCell>
                          <TableCell className="text-right">
                            {transaction.amount !== null ? (
                              <span className="text-sm font-medium text-success">
                                + ${transaction.amount.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getSourceIcon(transaction.source)}
                              <span className="text-xs text-muted-foreground">
                                {transaction.source}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium text-primary truncate max-w-[120px] block">
                              {transaction.linkAlias}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Footer stats */}
              {filteredTransactions.length > 0 && (
                <div className="mt-3 text-xs text-muted-foreground">
                  Showing {filteredTransactions.length} transactions
                </div>
              )}
            </main>
          </SidebarInset>
        </div>

        {/* Settings Drawer */}
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
