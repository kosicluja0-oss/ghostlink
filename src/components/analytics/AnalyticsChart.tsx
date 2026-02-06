import { useState, useMemo, useCallback, memo, useRef, useEffect } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import type { TimeRange } from './TimeRangeSelector';
import type { AnalyticsData } from '@/types';
import { 
  subMinutes, 
  subHours, 
  subDays, 
  subWeeks, 
  subMonths, 
  subYears,
  eachMinuteOfInterval,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  startOfMinute,
  startOfDay,
  startOfWeek,
  startOfMonth,
} from 'date-fns';
import { Ghost, ChevronLeft } from 'lucide-react';
import { useTimezone } from '@/hooks/useTimezone';

// Generate all time points in a range for continuous timeline
function generateTimePoints(range: TimeRange): Date[] {
  const now = new Date();
  const start = getDateRangeStart(range);
  
  switch (range) {
    case '30m':
      return eachMinuteOfInterval({ start, end: now });
    case '6h':
      // Every 5 minutes for 6h
      return eachMinuteOfInterval({ start, end: now }).filter((_, i) => i % 5 === 0);
    case '1d':
      // Every 15 minutes for 1d
      return eachMinuteOfInterval({ start, end: now }).filter((_, i) => i % 15 === 0);
    case '1w':
      return eachDayOfInterval({ start, end: now });
    case '1m':
      return eachDayOfInterval({ start, end: now });
    case '1y':
      return eachWeekOfInterval({ start, end: now });
    case '3y':
      return eachMonthOfInterval({ start, end: now });
    default:
      return eachDayOfInterval({ start, end: now });
  }
}

// Get the key for grouping data points
function getTimeKey(date: Date, range: TimeRange): string {
  switch (range) {
    case '30m':
      return startOfMinute(date).toISOString();
    case '6h':
      // Round to nearest 5 minutes
      const mins5 = new Date(date);
      mins5.setMinutes(Math.floor(mins5.getMinutes() / 5) * 5, 0, 0);
      return mins5.toISOString();
    case '1d':
      // Round to nearest 15 minutes
      const mins15 = new Date(date);
      mins15.setMinutes(Math.floor(mins15.getMinutes() / 15) * 15, 0, 0);
      return mins15.toISOString();
    case '1w':
    case '1m':
      return startOfDay(date).toISOString();
    case '1y':
      return startOfWeek(date).toISOString();
    case '3y':
      return startOfMonth(date).toISOString();
    default:
      return startOfDay(date).toISOString();
  }
}

// Get tick interval based on time range
function getTickInterval(range: TimeRange, dataLength: number): number {
  switch (range) {
    case '30m':
      return Math.max(1, Math.floor(dataLength / 6));
    case '6h':
      return Math.max(1, Math.floor(dataLength / 8));
    case '1d':
      return Math.max(1, Math.floor(dataLength / 8));
    case '1w':
      return 1; // Show every day
    case '1m':
      return Math.max(1, Math.floor(dataLength / 10)); // ~every 3 days
    case '1y':
      return Math.max(1, Math.floor(dataLength / 12)); // ~monthly
    case '3y':
      return Math.max(1, Math.floor(dataLength / 12)); // ~quarterly
    default:
      return Math.max(1, Math.floor(dataLength / 10));
  }
}

interface AnalyticsChartProps {
  data: AnalyticsData[];
  showConversions?: boolean;
  timeRange: TimeRange;
  activeLinkId?: string | null;
  selectedLinkAlias?: string;
  onClearSelection?: () => void;
  links?: import('@/types').GhostLink[];
}

type MetricKey = 'clicks' | 'leads' | 'sales' | 'revenue' | 'cr' | 'epc';

const METRIC_LABELS: Record<MetricKey, string> = {
  clicks: 'Clicks',
  leads: 'Leads',
  sales: 'Sales',
  revenue: 'Revenue',
  cr: 'Conv. Rate',
  epc: 'EPC',
};

const METRIC_COLORS: Record<MetricKey, string> = {
  clicks: 'hsl(var(--chart-clicks))',
  leads: 'hsl(var(--warning))',
  sales: 'hsl(var(--success))',
  revenue: 'hsl(var(--success))',
  cr: 'hsl(var(--primary))',
  epc: 'hsl(var(--primary))',
};

// Metrics that require special Y-axis formatting
type MetricFormat = 'number' | 'currency' | 'percentage';

const METRIC_FORMAT: Record<MetricKey, MetricFormat> = {
  clicks: 'number',
  leads: 'number',
  sales: 'number',
  revenue: 'currency',
  cr: 'percentage',
  epc: 'currency',
};

function getDateRangeStart(range: TimeRange): Date {
  const now = new Date();
  switch (range) {
    case '30m': return subMinutes(now, 30);
    case '6h': return subHours(now, 6);
    case '1d': return subDays(now, 1);
    case '1w': return subWeeks(now, 1);
    case '1m': return subMonths(now, 1);
    case '1y': return subYears(now, 1);
    case '3y': return subYears(now, 3);
    default: return subMonths(now, 1);
  }
}

// Timezone-aware formatting functions
function createFormatDateForRange(formatInTimezone: (date: Date | string | number, formatStr: string) => string) {
  return (date: Date, range: TimeRange): string => {
    switch (range) {
      case '30m':
      case '6h':
      case '1d':
        return formatInTimezone(date, 'HH:mm');
      case '1w':
        return formatInTimezone(date, 'EEE d');
      case '1m':
        return formatInTimezone(date, 'MMM d');
      case '1y':
        return formatInTimezone(date, 'MMM');
      case '3y':
        return formatInTimezone(date, 'MMM yyyy');
      default:
        return formatInTimezone(date, 'MMM d');
    }
  };
}

function createFormatTooltipDate(formatInTimezone: (date: Date | string | number, formatStr: string) => string) {
  return (date: Date, range: TimeRange): string => {
    switch (range) {
      case '30m':
      case '6h':
      case '1d':
        return formatInTimezone(date, 'd MMM yyyy, HH:mm');
      case '1w':
      case '1m':
        return formatInTimezone(date, 'd MMM yyyy');
      case '1y':
      case '3y':
        return formatInTimezone(date, 'MMM yyyy');
      default:
        return formatInTimezone(date, 'd MMM yyyy');
    }
  };
}

// Format value based on metric type
function formatMetricValue(value: number, metric: MetricKey): string {
  const fmt = METRIC_FORMAT[metric];
  switch (fmt) {
    case 'currency':
      return value >= 1000
        ? `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
        : `$${value.toFixed(2)}`;
    case 'percentage':
      return `${value.toFixed(1)}%`;
    default: {
      const intValue = Math.round(value);
      return intValue >= 1000
        ? `${(intValue / 1000).toFixed(intValue >= 10000 ? 0 : 1)}k`
        : intValue.toString();
    }
  }
}

// Format tooltip value with full precision
function formatTooltipValue(value: number, metric: MetricKey): string {
  const fmt = METRIC_FORMAT[metric];
  switch (fmt) {
    case 'currency':
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'percentage':
      return `${value.toFixed(2)}%`;
    default:
      return value.toLocaleString();
  }
}

// Memoized main chart component
const MainChart = memo(({ 
  displayData, 
  activeMetric,
  tickInterval 
}: { 
  displayData: any[]; 
  activeMetric: MetricKey;
  tickInterval: number;
}) => {
  const metricFormat = METRIC_FORMAT[activeMetric];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload;
      return (
        <div className="bg-card/95 backdrop-blur-sm border border-border/80 rounded-lg p-3 shadow-xl">
          <p className="text-xs font-medium text-foreground mb-2 border-b border-border/50 pb-2">
            {dataPoint?.tooltipDate}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm py-0.5">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">{METRIC_LABELS[entry.dataKey as MetricKey] ?? entry.dataKey}</span>
              </div>
              <span className="font-semibold text-foreground tabular-nums">
                {formatTooltipValue(entry.value, entry.dataKey as MetricKey)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={displayData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={METRIC_COLORS[activeMetric]} stopOpacity={0.25} />
            <stop offset="100%" stopColor={METRIC_COLORS[activeMetric]} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="hsl(var(--border))" 
          strokeOpacity={0.25}
          vertical={false}
        />
        <XAxis 
          dataKey="dateFormatted" 
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={{ stroke: 'hsl(var(--border))', strokeOpacity: 0.5 }}
          dy={10}
          interval={tickInterval}
          padding={{ left: 10, right: 10 }}
          textAnchor="middle"
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          dx={-10}
          tickFormatter={(value) => formatMetricValue(value, activeMetric)}
          domain={[0, (dataMax: number) => {
            if (metricFormat === 'percentage') {
              return Math.min(100, Math.max(5, Math.ceil(dataMax * 1.15)));
            }
            const minRange = metricFormat === 'currency' ? 1 : 5;
            const paddedMax = Math.ceil(dataMax * 1.15);
            return Math.max(minRange, paddedMax);
          }]}
          allowDecimals={metricFormat !== 'number'}
          tickCount={5}
        />
        <Tooltip content={<CustomTooltip />} />

        <Area
          type="monotone"
          dataKey={activeMetric}
          stroke={METRIC_COLORS[activeMetric]}
          strokeWidth={2}
          fill="url(#metricGradient)"
          dot={false}
          activeDot={{ r: 4, fill: METRIC_COLORS[activeMetric], stroke: 'hsl(var(--background))', strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

MainChart.displayName = 'MainChart';

export function AnalyticsChart({ 
  data, 
  showConversions = true, 
  timeRange,
  activeLinkId,
  selectedLinkAlias,
  onClearSelection,
  links = [],
}: AnalyticsChartProps) {
  const { formatInTimezone, timezone } = useTimezone();
  
  // Create timezone-aware formatting functions
  const formatDateForRange = useMemo(
    () => createFormatDateForRange(formatInTimezone),
    [formatInTimezone, timezone]
  );
  const formatTooltipDate = useMemo(
    () => createFormatTooltipDate(formatInTimezone),
    [formatInTimezone, timezone]
  );
  
  const [activeMetric, setActiveMetric] = useState<MetricKey>('clicks');
  const [metricDropdownOpen, setMetricDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Available metrics
  const availableMetrics: MetricKey[] = showConversions 
    ? ['clicks', 'leads', 'sales', 'revenue', 'cr', 'epc'] 
    : ['clicks'];

  // Other metrics (not currently active)
  const otherMetrics = availableMetrics.filter(m => m !== activeMetric);

  // Select a metric from dropdown
  const selectMetric = useCallback((metric: MetricKey) => {
    setActiveMetric(metric);
    setMetricDropdownOpen(false);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!metricDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMetricDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [metricDropdownOpen]);
  
  // Chart container ref for measuring dimensions
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Continuous timeline data with gap-filling
  const chartData = useMemo(() => {
    const startDate = getDateRangeStart(timeRange);
    
    // Filter data by date range first
    let filtered = data.filter(item => new Date(item.date) >= startDate);
    
    // Filter by active link if one is selected
    if (activeLinkId) {
      filtered = filtered.filter(item => item.linkId === activeLinkId);
    }
    
    // Build a map of actual data keyed by time bucket
    const dataMap = new Map<string, { clicks: number; leads: number; sales: number; earnings: number }>();
    
    filtered.forEach(item => {
      const key = getTimeKey(new Date(item.date), timeRange);
      if (dataMap.has(key)) {
        const existing = dataMap.get(key)!;
        existing.clicks += item.clicks;
        existing.leads += item.leads;
        existing.sales += item.sales;
        existing.earnings += item.earnings;
      } else {
        dataMap.set(key, {
          clicks: item.clicks,
          leads: item.leads,
          sales: item.sales,
          earnings: item.earnings,
        });
      }
    });
    
    // Generate all time points for continuous timeline
    const timePoints = generateTimePoints(timeRange);
    
    // Merge time points with actual data (fill gaps with zeros)
    // Include computed metrics: revenue, cr (conversion rate), epc (earnings per click)
    return timePoints.map(date => {
      const key = getTimeKey(date, timeRange);
      const d = dataMap.get(key);
      
      const clicks = d?.clicks ?? 0;
      const leads = d?.leads ?? 0;
      const sales = d?.sales ?? 0;
      const earnings = d?.earnings ?? 0;
      
      return {
        date: date.toISOString(),
        timestamp: date.getTime(),
        clicks,
        leads,
        sales,
        revenue: earnings,
        cr: clicks > 0 ? ((leads + sales) / clicks) * 100 : 0,
        epc: clicks > 0 ? earnings / clicks : 0,
        dateFormatted: formatDateForRange(date, timeRange),
        tooltipDate: formatTooltipDate(date, timeRange),
      };
    });
  }, [data, timeRange, activeLinkId]);

  // Calculate tick interval based on data length
  const tickInterval = useMemo(() => {
    return getTickInterval(timeRange, chartData.length);
  }, [timeRange, chartData.length]);

  // Watermark component
  const Watermark = () => (
    <div className="absolute bottom-10 right-4 flex items-center gap-1.5 opacity-25 pointer-events-none select-none">
      <Ghost className="w-4 h-4 text-foreground" />
      <span className="text-xs font-medium text-foreground tracking-wide">Ghost Link</span>
    </div>
  );

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setMetricDropdownOpen(prev => !prev)}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground/70 hover:text-muted-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/30"
            >
              {METRIC_LABELS[activeMetric]}
              <ChevronLeft 
                className={`w-3.5 h-3.5 transition-transform duration-200 ${metricDropdownOpen ? '-rotate-90' : ''}`} 
              />
            </button>
            {metricDropdownOpen && otherMetrics.length > 0 && (
              <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-md shadow-lg z-20 min-w-[100px] overflow-hidden animate-fade-in">
                {otherMetrics.map(metric => (
                  <button
                    key={metric}
                    onClick={() => selectMetric(metric)}
                    className="w-full text-left px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    {METRIC_LABELS[metric]}
                  </button>
                ))}
              </div>
            )}
          </div>
          {activeLinkId && selectedLinkAlias && (
            <div className="flex items-center gap-2 ml-1 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20">
              <span className="text-[11px] font-medium text-primary">ghost.link/{selectedLinkAlias}</span>
              <button
                onClick={onClearSelection}
                className="text-[11px] text-primary/70 hover:text-primary transition-colors font-medium"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Chart */}
      <div 
        ref={chartContainerRef} 
        className="h-[240px] w-full relative"
      >
        <MainChart 
          displayData={chartData} 
          activeMetric={activeMetric}
          tickInterval={tickInterval}
        />
        <Watermark />
      </div>
    </div>
  );
}
