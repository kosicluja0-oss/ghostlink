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
      return format(date, 'HH:mm');
    case '1d':
      return format(date, 'HH:mm');
    case '1w':
      return format(date, 'EEE');
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
    case '1y':
    case '3y':
      return format(date, 'd MMM yyyy');
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
          minTickGap={50}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          dx={-10}
          tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
          domain={['auto', 'auto']}
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

export function AnalyticsChart({ data, showConversions = true, onTimeRangeChange }: AnalyticsChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('1m');
  const [visibleMetrics, setVisibleMetrics] = useState<Record<MetricKey, boolean>>({
    clicks: true,
    leads: true,
    sales: true,
  });
  
  // Brush state for update-on-release behavior
  const [brushRange, setBrushRange] = useState<{ start: number; end: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);

  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
    setBrushRange(null);
    if (onTimeRangeChange) {
      const startDate = getDateRangeStart(range);
      const filtered = data.filter(item => new Date(item.date) >= startDate);
      onTimeRangeChange(range, filtered);
    }
  }, [data, onTimeRangeChange]);

  // Memoized chart data
  const chartData = useMemo(() => {
    const startDate = getDateRangeStart(timeRange);
    
    return data
      .filter(item => new Date(item.date) >= startDate)
      .map(item => ({
        ...item,
        dateFormatted: formatDateForRange(new Date(item.date), timeRange),
        tooltipDate: formatTooltipDate(new Date(item.date), timeRange),
      }));
  }, [data, timeRange]);

  // Data to display in main chart - ONLY updates when brush is released
  const displayData = useMemo(() => {
    if (brushRange) {
      return chartData.slice(brushRange.start, brushRange.end + 1);
    }
    return chartData;
  }, [chartData, brushRange]);

  // Simplified mini-map data for navigator
  const navigatorData = useMemo(() => {
    // Sample data for performance (max 100 points for navigator)
    const step = Math.max(1, Math.floor(chartData.length / 100));
    return chartData.filter((_, i) => i % step === 0);
  }, [chartData]);

  const toggleMetric = useCallback((metric: MetricKey) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric],
    }));
  }, []);

  // Navigator (custom brush) handlers
  const handleNavigatorMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const index = Math.floor(x * chartData.length);
    setIsDragging(true);
    setDragStart(index);
    setDragEnd(index);
  }, [chartData.length]);

  const handleNavigatorMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const index = Math.floor(x * chartData.length);
    setDragEnd(index);
  }, [isDragging, chartData.length]);

  const handleNavigatorMouseUp = useCallback(() => {
    if (isDragging && dragStart !== null && dragEnd !== null) {
      const start = Math.min(dragStart, dragEnd);
      const end = Math.max(dragStart, dragEnd);
      if (end - start > 1) {
        setBrushRange({ start, end: Math.min(end, chartData.length - 1) });
      }
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, [isDragging, dragStart, dragEnd, chartData.length]);

  const handleResetZoom = useCallback(() => {
    setBrushRange(null);
  }, []);

  // Calculate selection highlight position
  const selectionStyle = useMemo(() => {
    if (isDragging && dragStart !== null && dragEnd !== null) {
      const start = Math.min(dragStart, dragEnd);
      const end = Math.max(dragStart, dragEnd);
      const left = (start / chartData.length) * 100;
      const width = ((end - start) / chartData.length) * 100;
      return { left: `${left}%`, width: `${width}%` };
    }
    if (brushRange) {
      const left = (brushRange.start / chartData.length) * 100;
      const width = ((brushRange.end - brushRange.start) / chartData.length) * 100;
      return { left: `${left}%`, width: `${width}%` };
    }
    return null;
  }, [isDragging, dragStart, dragEnd, brushRange, chartData.length]);

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

  // Watermark component
  const Watermark = () => (
    <div className="absolute bottom-4 right-4 flex items-center gap-1.5 opacity-25 pointer-events-none select-none">
      <Ghost className="w-4 h-4 text-foreground" />
      <span className="text-xs font-medium text-foreground tracking-wide">Ghost Link</span>
    </div>
  );

  return (
    <div className="bg-card rounded-lg border border-border p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-foreground">Traffic Overview</h3>
          {brushRange && (
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
      <div className="h-[280px] w-full relative">
        <MainChart 
          displayData={displayData} 
          visibleMetrics={visibleMetrics} 
          showConversions={showConversions} 
        />
        <Watermark />
      </div>

      {/* Divider */}
      <div className="h-px bg-border/50 my-4" />

      {/* Custom Navigator / Mini-map */}
      <div className="space-y-1">
        <div 
          className="relative h-[40px] bg-muted/30 rounded border border-border/50 cursor-crosshair overflow-hidden select-none"
          onMouseDown={handleNavigatorMouseDown}
          onMouseMove={handleNavigatorMouseMove}
          onMouseUp={handleNavigatorMouseUp}
          onMouseLeave={handleNavigatorMouseUp}
        >
          {/* Mini area chart */}
          <div className="absolute inset-0">
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

          {/* Selection overlay */}
          {selectionStyle && (
            <div 
              className="absolute top-0 bottom-0 bg-primary/20 border-l-2 border-r-2 border-primary/60"
              style={selectionStyle}
            >
              {/* Left handle */}
              <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-5 bg-primary rounded-full" />
              {/* Right handle */}
              <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-1.5 h-5 bg-primary rounded-full" />
            </div>
          )}
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
