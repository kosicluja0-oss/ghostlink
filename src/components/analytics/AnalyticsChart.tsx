import { useState, useMemo, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Brush,
  ReferenceArea,
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

// Full date for tooltip - always shows exact date
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
      return format(date, 'd MMM yyyy');
    default:
      return format(date, 'd MMM yyyy');
  }
}

export function AnalyticsChart({ data, showConversions = true, onTimeRangeChange }: AnalyticsChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('1m');
  const [visibleMetrics, setVisibleMetrics] = useState<Record<MetricKey, boolean>>({
    clicks: true,
    leads: true,
    sales: true,
  });
  
  // Brush state for update-on-release behavior
  const [brushIndices, setBrushIndices] = useState<{ startIndex?: number; endIndex?: number }>({});
  const [isDragging, setIsDragging] = useState(false);
  const [tempBrushIndices, setTempBrushIndices] = useState<{ startIndex?: number; endIndex?: number }>({});

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    // Reset brush when changing time range
    setBrushIndices({});
    setTempBrushIndices({});
    if (onTimeRangeChange) {
      const startDate = getDateRangeStart(range);
      const filtered = data.filter(item => new Date(item.date) >= startDate);
      onTimeRangeChange(range, filtered);
    }
  };

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

  // Data to display in main chart (respects brush selection)
  const displayData = useMemo(() => {
    if (brushIndices.startIndex !== undefined && brushIndices.endIndex !== undefined) {
      return chartData.slice(brushIndices.startIndex, brushIndices.endIndex + 1);
    }
    return chartData;
  }, [chartData, brushIndices]);

  const toggleMetric = (metric: MetricKey) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric],
    }));
  };

  // Handle brush change - only store temp values while dragging
  const handleBrushChange = useCallback((newIndex: { startIndex?: number; endIndex?: number }) => {
    if (isDragging) {
      setTempBrushIndices(newIndex);
    } else {
      setBrushIndices(newIndex);
    }
  }, [isDragging]);

  // Mouse down on brush - start dragging
  const handleBrushMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  // Mouse up anywhere - apply the brush indices
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      if (tempBrushIndices.startIndex !== undefined) {
        setBrushIndices(tempBrushIndices);
      }
    }
  }, [isDragging, tempBrushIndices]);

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
    <div className="absolute bottom-14 right-4 flex items-center gap-1.5 opacity-25 pointer-events-none select-none">
      <Ghost className="w-4 h-4 text-foreground" />
      <span className="text-xs font-medium text-foreground tracking-wide">Ghost Link</span>
    </div>
  );

  return (
    <div className="bg-card rounded-lg border border-border p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-foreground">Traffic Overview</h3>
        <TimeRangeSelector value={timeRange} onChange={handleTimeRangeChange} />
      </div>

      <div 
        className="h-[350px] w-full relative"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="brushGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
              </linearGradient>
            </defs>
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
        
        <Watermark />
      </div>

      {/* Separate Brush / Mini-map below main chart */}
      <div 
        className="h-[50px] w-full mt-2"
        onMouseDown={handleBrushMouseDown}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <XAxis 
              dataKey="dateFormatted" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={80}
            />
            <Brush 
              dataKey="dateFormatted" 
              height={35}
              stroke="hsl(var(--border))"
              fill="hsl(var(--muted))"
              travellerWidth={10}
              gap={1}
              onChange={handleBrushChange}
              startIndex={isDragging ? tempBrushIndices.startIndex : brushIndices.startIndex}
              endIndex={isDragging ? tempBrushIndices.endIndex : brushIndices.endIndex}
            >
              <LineChart data={chartData}>
                <Line
                  type="linear"
                  dataKey="clicks"
                  stroke={METRIC_COLORS.clicks}
                  strokeWidth={1}
                  dot={false}
                  strokeOpacity={0.5}
                  isAnimationActive={false}
                />
              </LineChart>
            </Brush>
          </LineChart>
        </ResponsiveContainer>
      </div>

      <CustomLegend />
    </div>
  );
}
