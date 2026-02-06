import { useState, useMemo, useCallback, memo, useRef } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { TimeRangeSelector, type TimeRange } from './TimeRangeSelector';
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
import { Ghost } from 'lucide-react';
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
  onTimeRangeChange?: (range: TimeRange, filteredData: AnalyticsData[]) => void;
  activeLinkId?: string | null;
  selectedLinkAlias?: string;
  onClearSelection?: () => void;
  links?: import('@/types').GhostLink[];
}

type MetricKey = 'clicks' | 'leads' | 'sales';

const METRIC_COLORS: Record<MetricKey, string> = {
  clicks: 'hsl(var(--chart-clicks))',
  leads: 'hsl(var(--warning))',
  sales: 'hsl(var(--success))',
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

// Memoized main chart component
const MainChart = memo(({ 
  displayData, 
  visibleMetrics, 
  showConversions,
  tickInterval 
}: { 
  displayData: any[]; 
  visibleMetrics: Record<MetricKey, boolean>; 
  showConversions: boolean;
  tickInterval: number;
}) => {
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
                <span className="text-muted-foreground capitalize">{entry.dataKey}</span>
              </div>
              <span className="font-semibold text-foreground tabular-nums">{entry.value.toLocaleString()}</span>
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
          <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--chart-clicks))" stopOpacity={0.25} />
            <stop offset="100%" stopColor="hsl(var(--chart-clicks))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--warning))" stopOpacity={0.2} />
            <stop offset="100%" stopColor="hsl(var(--warning))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.2} />
            <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
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
          tickFormatter={(value) => {
            const intValue = Math.round(value);
            return intValue >= 1000 ? `${(intValue / 1000).toFixed(intValue >= 10000 ? 0 : 1)}k` : intValue.toString();
          }}
          domain={[0, (dataMax: number) => {
            const minRange = 5;
            const paddedMax = Math.ceil(dataMax * 1.15); // 15% padding at top
            return Math.max(minRange, paddedMax);
          }]}
          allowDecimals={false}
          tickCount={5}
        />
        <Tooltip content={<CustomTooltip />} />

        {visibleMetrics.clicks && (
          <Area
            type="monotone"
            dataKey="clicks"
            stroke={METRIC_COLORS.clicks}
            strokeWidth={2}
            fill="url(#clicksGradient)"
            dot={false}
            activeDot={{ r: 4, fill: METRIC_COLORS.clicks, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        )}
        
        {showConversions && visibleMetrics.leads && (
          <Area
            type="monotone"
            dataKey="leads"
            stroke={METRIC_COLORS.leads}
            strokeWidth={2}
            fill="url(#leadsGradient)"
            dot={false}
            activeDot={{ r: 4, fill: METRIC_COLORS.leads, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        )}
        
        {showConversions && visibleMetrics.sales && (
          <Area
            type="monotone"
            dataKey="sales"
            stroke={METRIC_COLORS.sales}
            strokeWidth={2}
            fill="url(#salesGradient)"
            dot={false}
            activeDot={{ r: 4, fill: METRIC_COLORS.sales, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
});

MainChart.displayName = 'MainChart';

export function AnalyticsChart({ 
  data, 
  showConversions = true, 
  onTimeRangeChange,
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
  
  const [timeRange, setTimeRange] = useState<TimeRange>('1m');
  const [visibleMetrics, setVisibleMetrics] = useState<Record<MetricKey, boolean>>({
    clicks: true,
    leads: true,
    sales: true,
  });
  
  // Chart container ref for measuring dimensions
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Reset range when time range changes
  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
    if (onTimeRangeChange) {
      const startDate = getDateRangeStart(range);
      const filtered = data.filter(item => new Date(item.date) >= startDate);
      onTimeRangeChange(range, filtered);
    }
  }, [data, onTimeRangeChange]);

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
    const dataMap = new Map<string, { clicks: number; leads: number; sales: number }>();
    
    filtered.forEach(item => {
      const key = getTimeKey(new Date(item.date), timeRange);
      if (dataMap.has(key)) {
        const existing = dataMap.get(key)!;
        existing.clicks += item.clicks;
        existing.leads += item.leads;
        existing.sales += item.sales;
      } else {
        dataMap.set(key, {
          clicks: item.clicks,
          leads: item.leads,
          sales: item.sales,
        });
      }
    });
    
    // Generate all time points for continuous timeline
    const timePoints = generateTimePoints(timeRange);
    
    // Merge time points with actual data (fill gaps with zeros)
    return timePoints.map(date => {
      const key = getTimeKey(date, timeRange);
      const existingData = dataMap.get(key);
      
      return {
        date: date.toISOString(),
        timestamp: date.getTime(),
        clicks: existingData?.clicks ?? 0,
        leads: existingData?.leads ?? 0,
        sales: existingData?.sales ?? 0,
        dateFormatted: formatDateForRange(date, timeRange),
        tooltipDate: formatTooltipDate(date, timeRange),
      };
    });
  }, [data, timeRange, activeLinkId]);

  // Calculate tick interval based on data length
  const tickInterval = useMemo(() => {
    return getTickInterval(timeRange, chartData.length);
  }, [timeRange, chartData.length]);

  const toggleMetric = useCallback((metric: MetricKey) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric],
    }));
  }, []);


  const CustomLegend = () => {
    const metrics: { key: MetricKey; label: string; locked?: boolean }[] = [
      { key: 'clicks', label: 'Clicks' },
      { key: 'leads', label: 'Leads', locked: !showConversions },
      { key: 'sales', label: 'Sales', locked: !showConversions },
    ];

    return (
      <div className="flex items-center justify-center gap-6 mt-4">
        {metrics.map(({ key, label, locked }) => (
          <button
            key={key}
            onClick={() => !locked && toggleMetric(key)}
            disabled={locked}
            className={`flex items-center gap-2 text-sm transition-opacity ${
              locked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'
            } ${!visibleMetrics[key] && !locked ? 'opacity-40' : ''}`}
          >
            <div 
              className="w-3 h-3 rounded-full transition-all"
              style={{ 
                backgroundColor: METRIC_COLORS[key],
                opacity: visibleMetrics[key] && !locked ? 1 : 0.3,
              }}
            />
            <span className="text-muted-foreground">{label}</span>
          </button>
        ))}
      </div>
    );
  };

  // Watermark component - positioned with 20px padding from bottom axis
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
          <h3 className="text-base font-semibold text-foreground">Traffic Overview</h3>
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
        <TimeRangeSelector value={timeRange} onChange={handleTimeRangeChange} />
      </div>

      {/* Main Chart */}
      <div 
        ref={chartContainerRef} 
        className="h-[240px] w-full relative"
      >
        <MainChart 
          displayData={chartData} 
          visibleMetrics={visibleMetrics} 
          showConversions={showConversions}
          tickInterval={tickInterval}
        />
        <Watermark />
      </div>


      <CustomLegend />
    </div>
  );
}
