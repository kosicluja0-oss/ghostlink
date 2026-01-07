import { useState, useMemo, useCallback, memo } from 'react';
import {
  LineChart,
  Line,
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
import { format, subMinutes, subHours, subDays, subWeeks, subMonths, subYears } from 'date-fns';
import { Ghost } from 'lucide-react';

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
  showConversions 
}: { 
  displayData: any[]; 
  visibleMetrics: Record<MetricKey, boolean>; 
  showConversions: boolean;
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
      <LineChart data={displayData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="hsl(var(--border))" 
          strokeOpacity={0.5}
          vertical={false}
        />
        <XAxis 
          dataKey="dateFormatted" 
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={{ stroke: 'hsl(var(--border))', strokeOpacity: 0.5 }}
          dy={10}
          interval="preserveStartEnd"
          minTickGap={60}
          type="category"
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
          <Line
            type="linear"
            dataKey="clicks"
            stroke={METRIC_COLORS.clicks}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: METRIC_COLORS.clicks, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        )}
        
        {showConversions && visibleMetrics.leads && (
          <Line
            type="linear"
            dataKey="leads"
            stroke={METRIC_COLORS.leads}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: METRIC_COLORS.leads, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        )}
        
        {showConversions && visibleMetrics.sales && (
          <Line
            type="linear"
            dataKey="sales"
            stroke={METRIC_COLORS.sales}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: METRIC_COLORS.sales, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        )}
      </LineChart>
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

  // Conditional data density: minute-level for short ranges, daily for long ranges
  // Also filters by activeLinkId if present
  const chartData = useMemo(() => {
    const startDate = getDateRangeStart(timeRange);
    const useMinuteData = ['30m', '6h', '1d'].includes(timeRange);
    
    // Filter data by date range first
    let filtered = data.filter(item => new Date(item.date) >= startDate);
    
    // Filter by active link if one is selected
    if (activeLinkId) {
      filtered = filtered.filter(item => item.linkId === activeLinkId);
    }
    
    if (useMinuteData) {
      // For short ranges: aggregate all links per timestamp (or show single link data)
      const timeMap = new Map<string, { clicks: number; leads: number; sales: number; date: string }>();
      
      filtered.forEach(item => {
        const timeKey = item.date;
        if (timeMap.has(timeKey)) {
          const existing = timeMap.get(timeKey)!;
          existing.clicks += item.clicks;
          existing.leads += item.leads;
          existing.sales += item.sales;
        } else {
          timeMap.set(timeKey, {
            date: item.date,
            clicks: item.clicks,
            leads: item.leads,
            sales: item.sales,
          });
        }
      });
      
      return Array.from(timeMap.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(item => ({
          ...item,
          dateFormatted: formatDateForRange(new Date(item.date), timeRange),
          tooltipDate: formatTooltipDate(new Date(item.date), timeRange),
        }));
    } else {
      // For long ranges: aggregate to daily data (max ~1095 points for 3y)
      const dailyMap = new Map<string, { clicks: number; leads: number; sales: number; date: string }>();
      
      filtered.forEach(item => {
        const date = new Date(item.date);
        const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        
        if (dailyMap.has(dayKey)) {
          const existing = dailyMap.get(dayKey)!;
          existing.clicks += item.clicks;
          existing.leads += item.leads;
          existing.sales += item.sales;
        } else {
          dailyMap.set(dayKey, {
            date: item.date,
            clicks: item.clicks,
            leads: item.leads,
            sales: item.sales,
          });
        }
      });
      
      return Array.from(dailyMap.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(item => ({
          ...item,
          dateFormatted: formatDateForRange(new Date(item.date), timeRange),
          tooltipDate: formatTooltipDate(new Date(item.date), timeRange),
        }));
    }
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

  // Streaming indicator component - subtle, non-animated
  const StreamingIndicator = () => (
    <span className="text-[11px] text-muted-foreground/70">• Streaming live data</span>
  );

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-foreground">Traffic Overview</h3>
          <StreamingIndicator />
          {activeLinkId && selectedLinkAlias && (
            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-border">
              <span className="text-[12px] font-medium text-primary">ghost.link/{selectedLinkAlias}</span>
              <button
                onClick={onClearSelection}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <span>×</span>
                <span>Clear</span>
              </button>
            </div>
          )}
          {isZoomed && !activeLinkId && (
            <button 
              onClick={handleResetZoom}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border border-border/50 hover:border-border"
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
