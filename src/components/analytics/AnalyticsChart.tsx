import { useState, useMemo, useCallback, memo } from 'react';
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
  format, 
  subMinutes, 
  subHours, 
  subDays, 
  subWeeks, 
  subMonths, 
  subYears,
  eachMinuteOfInterval,
  eachHourOfInterval,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  startOfMinute,
  startOfHour,
  startOfDay,
  startOfWeek,
  startOfMonth,
} from 'date-fns';
import { Ghost } from 'lucide-react';

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

function formatDateForRange(date: Date, range: TimeRange): string {
  switch (range) {
    case '30m':
    case '6h':
    case '1d':
      return format(date, 'HH:mm');
    case '1w':
      return format(date, 'EEE d');
    case '1m':
      return format(date, 'MMM d');
    case '1y':
      return format(date, 'MMM');
    case '3y':
      return format(date, 'MMM yyyy');
    default:
      return format(date, 'MMM d');
  }
}

function formatTooltipDate(date: Date, range: TimeRange): string {
  switch (range) {
    case '30m':
    case '6h':
    case '1d':
      return format(date, 'd MMM yyyy, HH:mm');
    case '1w':
    case '1m':
      return format(date, 'd MMM yyyy');
    case '1y':
    case '3y':
      return format(date, 'MMM yyyy');
    default:
      return format(date, 'd MMM yyyy');
  }
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
  onClearSelection
}: AnalyticsChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('1m');
  const [visibleMetrics, setVisibleMetrics] = useState<Record<MetricKey, boolean>>({
    clicks: true,
    leads: true,
    sales: true,
  });
  
  // Fixed range slider state - always has a selection
  const [rangeStart, setRangeStart] = useState(0);
  const [rangeEnd, setRangeEnd] = useState(100); // percentage
  const [dragMode, setDragMode] = useState<'left' | 'right' | 'middle' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartRange, setDragStartRange] = useState({ start: 0, end: 100 });
  const [committedRange, setCommittedRange] = useState({ start: 0, end: 100 });

  // Reset range when time range changes
  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
    setRangeStart(0);
    setRangeEnd(100);
    setCommittedRange({ start: 0, end: 100 });
    if (onTimeRangeChange) {
      const startDate = getDateRangeStart(range);
      const filtered = data.filter(item => new Date(item.date) >= startDate);
      onTimeRangeChange(range, filtered);
    }
  }, [data, onTimeRangeChange]);

  // Continuous timeline data with gap-filling
  // Generates all time points in range and merges actual data
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
        clicks: existingData?.clicks ?? 0,
        leads: existingData?.leads ?? 0,
        sales: existingData?.sales ?? 0,
        dateFormatted: formatDateForRange(date, timeRange),
        tooltipDate: formatTooltipDate(date, timeRange),
      };
    });
  }, [data, timeRange, activeLinkId]);

  // Data to display in main chart - ONLY updates when range is committed (mouse released)
  const displayData = useMemo(() => {
    if (committedRange.start === 0 && committedRange.end === 100) {
      return chartData;
    }
    const startIdx = Math.floor((committedRange.start / 100) * chartData.length);
    const endIdx = Math.floor((committedRange.end / 100) * chartData.length);
    return chartData.slice(startIdx, Math.max(endIdx, startIdx + 1));
  }, [chartData, committedRange]);

  // Calculate tick interval based on display data length (adapts to zoom)
  const tickInterval = useMemo(() => {
    return getTickInterval(timeRange, displayData.length);
  }, [timeRange, displayData.length]);

  // Simplified mini-map data for navigator (max 100 points)
  const navigatorData = useMemo(() => {
    const step = Math.max(1, Math.floor(chartData.length / 100));
    return chartData.filter((_, i) => i % step === 0);
  }, [chartData]);

  const toggleMetric = useCallback((metric: MetricKey) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric],
    }));
  }, []);

  // Range slider handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, mode: 'left' | 'right' | 'middle') => {
    e.stopPropagation();
    e.preventDefault();
    setDragMode(mode);
    setDragStartX(e.clientX);
    setDragStartRange({ start: rangeStart, end: rangeEnd });
  }, [rangeStart, rangeEnd]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragMode) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const deltaPercent = ((e.clientX - dragStartX) / rect.width) * 100;
    const minWidth = 5; // Minimum 5% width
    
    if (dragMode === 'left') {
      const newStart = Math.max(0, Math.min(rangeEnd - minWidth, dragStartRange.start + deltaPercent));
      setRangeStart(newStart);
    } else if (dragMode === 'right') {
      const newEnd = Math.min(100, Math.max(rangeStart + minWidth, dragStartRange.end + deltaPercent));
      setRangeEnd(newEnd);
    } else if (dragMode === 'middle') {
      const width = dragStartRange.end - dragStartRange.start;
      let newStart = dragStartRange.start + deltaPercent;
      let newEnd = dragStartRange.end + deltaPercent;
      
      if (newStart < 0) {
        newStart = 0;
        newEnd = width;
      }
      if (newEnd > 100) {
        newEnd = 100;
        newStart = 100 - width;
      }
      
      setRangeStart(newStart);
      setRangeEnd(newEnd);
    }
  }, [dragMode, dragStartX, dragStartRange, rangeStart, rangeEnd]);

  const handleMouseUp = useCallback(() => {
    if (dragMode) {
      // Commit the range on mouse release - this triggers main chart update
      setCommittedRange({ start: rangeStart, end: rangeEnd });
    }
    setDragMode(null);
  }, [dragMode, rangeStart, rangeEnd]);

  const handleResetZoom = useCallback(() => {
    setRangeStart(0);
    setRangeEnd(100);
    setCommittedRange({ start: 0, end: 100 });
  }, []);

  const isZoomed = rangeStart !== 0 || rangeEnd !== 100;

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
          {isZoomed && !activeLinkId && (
            <button 
              onClick={handleResetZoom}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded border border-border/50 hover:border-border"
            >
              Reset Zoom
            </button>
          )}
        </div>
        <TimeRangeSelector value={timeRange} onChange={handleTimeRangeChange} />
      </div>

      {/* Main Chart */}
      <div className="h-[240px] w-full relative">
        <MainChart 
          displayData={displayData} 
          visibleMetrics={visibleMetrics} 
          showConversions={showConversions}
          tickInterval={tickInterval}
        />
        <Watermark />
      </div>

      {/* Divider */}
      <div className="h-px bg-border/50 my-3" />

      {/* Fixed Range Slider / Navigator */}
      <div className="space-y-1">
        <div 
          className="relative h-[40px] bg-muted/30 rounded border border-border/50 overflow-hidden select-none"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Mini area chart */}
          <div className="absolute inset-0 pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={navigatorData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
                <defs>
                  <linearGradient id="navigatorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-clicks))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--chart-clicks))" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Area
                  type="linear"
                  dataKey="clicks"
                  stroke="hsl(var(--chart-clicks))"
                  strokeWidth={1}
                  strokeOpacity={0.5}
                  fill="url(#navigatorGradient)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Dimmed areas outside selection */}
          <div 
            className="absolute top-0 bottom-0 left-0 bg-background/60 pointer-events-none"
            style={{ width: `${rangeStart}%` }}
          />
          <div 
            className="absolute top-0 bottom-0 right-0 bg-background/60 pointer-events-none"
            style={{ width: `${100 - rangeEnd}%` }}
          />

          {/* Selection window - always visible, never disappears */}
          <div 
            className="absolute top-0 bottom-0 border-l-2 border-r-2 border-primary/60"
            style={{ 
              left: `${rangeStart}%`, 
              width: `${rangeEnd - rangeStart}%` 
            }}
          >
            {/* Middle drag area */}
            <div 
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => handleMouseDown(e, 'middle')}
            />
            
            {/* Left handle */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-3 -translate-x-1/2 cursor-ew-resize flex items-center justify-center z-10"
              onMouseDown={(e) => handleMouseDown(e, 'left')}
            >
              <div className="w-1.5 h-5 bg-primary rounded-full shadow-sm" />
            </div>
            
            {/* Right handle */}
            <div 
              className="absolute right-0 top-0 bottom-0 w-3 translate-x-1/2 cursor-ew-resize flex items-center justify-center z-10"
              onMouseDown={(e) => handleMouseDown(e, 'right')}
            >
              <div className="w-1.5 h-5 bg-primary rounded-full shadow-sm" />
            </div>
          </div>
        </div>

        {/* Static timeline labels */}
        <div className="flex justify-between px-1">
          {navigatorData
            .filter((_, i) => i % Math.max(1, Math.floor(navigatorData.length / 6)) === 0 || i === navigatorData.length - 1)
            .slice(0, 7)
            .map((item, i) => (
              <span key={i} className="text-[10px] text-muted-foreground">
                {item.dateFormatted}
              </span>
            ))
          }
        </div>
      </div>

      <CustomLegend />
    </div>
  );
}
