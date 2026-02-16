import { useState, useEffect } from 'react';
import { ExternalLink, TrendingUp, MousePointerClick, Users, DollarSign, Percent, CalendarDays, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { MiniAreaChart, type ChartMetric } from '@/components/analytics/MiniAreaChart';
import { TopPlacementsCard } from '@/components/analytics/TopPlacementsCard';
import { TopCountriesCard } from '@/components/analytics/TopCountriesCard';
import { ConversionFunnel } from '@/components/analytics/ConversionFunnel';
import { useLinkAnalytics } from '@/hooks/useLinkAnalytics';
import { getDisplayUrl } from '@/lib/trackingUrl';
import type { GhostLink } from '@/types';

type DetailTimeRange = 'all' | '30d' | '7d' | '24h';

const DETAIL_RANGES: { value: DetailTimeRange; label: string }[] = [
  { value: 'all', label: 'All time history' },
  { value: '30d', label: '30 day history' },
  { value: '7d', label: '7 day history' },
  { value: '24h', label: '24 hours history' },
];

const RANGE_TO_DAYS: Record<DetailTimeRange, number | null> = {
  all: null,
  '30d': 30,
  '7d': 7,
  '24h': 1,
};

interface LinkDetailPanelProps {
  link: GhostLink | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Favicon({ url }: { url: string }) {
  try {
    const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    return (
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
        alt=""
        className="w-5 h-5 rounded shrink-0"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  } catch { return null; }
}

interface KpiItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  dimmed?: boolean;
  active?: boolean;
  onClick?: () => void;
  accentColor?: string;
}

function KpiItem({ icon, label, value, dimmed, active, onClick, accentColor }: KpiItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors cursor-pointer ${
        active
          ? 'bg-primary/10 ring-1 ring-primary/30'
          : 'bg-muted/20 hover:bg-muted/40'
      } ${dimmed ? 'opacity-50' : ''}`}
    >
      <div style={accentColor ? { color: accentColor } : undefined} className={accentColor ? '' : 'text-muted-foreground'}>{icon}</div>
      <span className="text-sm font-bold text-foreground tabular-nums">{value}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-1">
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-[120px] rounded-lg" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-[140px] rounded-lg" />
        <Skeleton className="h-[140px] rounded-lg" />
      </div>
      <Skeleton className="h-[100px] rounded-lg" />
    </div>
  );
}

export function LinkDetailPanel({ link, open, onOpenChange }: LinkDetailPanelProps) {
  const [timeRange, setTimeRange] = useState<DetailTimeRange>('30d');
  const [chartMetric, setChartMetric] = useState<ChartMetric>('clicks');
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Reset to defaults whenever the link changes or panel reopens
  useEffect(() => {
    setTimeRange('30d');
    setChartMetric('clicks');
  }, [link?.id, open]);

  const days = RANGE_TO_DAYS[timeRange];
  const { dailyClicks, placements, countries, funnel, isLoading } = useLinkAnalytics(
    open && link ? link.id : null,
    days
  );

  return (
    <AnimatePresence mode="wait">
      {open && link && (
        <motion.div
          key={link.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="h-full overflow-y-auto border-l border-border bg-card p-4"
        >
          {/* Header */}
          <div className="pb-4 border-b border-border mb-4">
            <div className="flex items-center gap-2.5">
              <Favicon url={link.targetUrl} />
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold truncate text-foreground">
                  {getDisplayUrl(link.alias)}
                </h2>
                <p className="truncate text-xs text-muted-foreground">
                  <a
                    href={link.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    {link.targetUrl}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-5 gap-1.5">
                <KpiItem icon={<MousePointerClick className="w-3.5 h-3.5" />} label="Clicks" value={funnel.totalClicks.toLocaleString()} active={chartMetric === 'clicks'} onClick={() => setChartMetric('clicks')} accentColor="hsl(var(--chart-clicks))" />
                <KpiItem icon={<Users className="w-3.5 h-3.5" />} label="Leads" value={funnel.totalLeads.toLocaleString()} active={chartMetric === 'leads'} onClick={() => setChartMetric('leads')} accentColor="hsl(var(--chart-leads))" />
                <KpiItem icon={<DollarSign className="w-3.5 h-3.5" />} label="Sales" value={funnel.totalSales.toLocaleString()} active={chartMetric === 'sales'} onClick={() => setChartMetric('sales')} accentColor="hsl(var(--chart-sales))" />
                <KpiItem icon={<TrendingUp className="w-3.5 h-3.5" />} label="EPC" value={`$${funnel.epc.toFixed(2)}`} active={chartMetric === 'epc'} onClick={() => setChartMetric('epc')} accentColor="hsl(var(--chart-conversions))" />
                <KpiItem icon={<Percent className="w-3.5 h-3.5" />} label="CR" value={`${funnel.conversionRate.toFixed(1)}%`} active={chartMetric === 'cr'} onClick={() => setChartMetric('cr')} accentColor="hsl(var(--foreground))" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Popover onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-md bg-card border border-border hover:bg-muted/50">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {DETAIL_RANGES.find(r => r.value === timeRange)?.label}
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${popoverOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-1.5 bg-card border border-border">
                      <div className="flex flex-col gap-0.5">
                        {DETAIL_RANGES.map((range) => (
                          <button
                            key={range.value}
                            onClick={() => setTimeRange(range.value)}
                            className={`text-left px-3 py-1.5 text-xs rounded-md transition-colors ${
                              timeRange === range.value
                                ? 'bg-primary text-primary-foreground font-medium'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            }`}
                          >
                            {range.label}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="bg-muted/10 rounded-lg p-2 border border-border/50">
                  <MiniAreaChart data={dailyClicks} metric={chartMetric} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <TopPlacementsCard placements={placements} />
                <TopCountriesCard countries={countries} />
              </div>

            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
