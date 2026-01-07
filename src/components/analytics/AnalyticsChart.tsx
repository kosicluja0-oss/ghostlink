import { useState, useMemo } from 'react';
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
} from 'recharts';
import { TimeRangeSelector, type TimeRange } from './TimeRangeSelector';
import type { AnalyticsData } from '@/types';
import { format, subMinutes, subHours, subDays, subWeeks, subMonths, subYears } from 'date-fns';

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

export function AnalyticsChart({ data, showConversions = true, onTimeRangeChange }: AnalyticsChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('1m');
  const [visibleMetrics, setVisibleMetrics] = useState<Record<MetricKey, boolean>>({
    clicks: true,
    leads: true,
    sales: true,
  });

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
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
      }));
  }, [data, timeRange]);

  const toggleMetric = (metric: MetricKey) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric],
    }));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground capitalize">{entry.dataKey}:</span>
              <span className="font-medium text-foreground">{entry.value.toLocaleString()}</span>
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

  return (
    <div className="bg-card rounded-lg border border-border p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-foreground">Traffic Overview</h3>
        <TimeRangeSelector value={timeRange} onChange={handleTimeRangeChange} />
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
            
            {/* TradingView-style Brush / Mini-map */}
            <Brush 
              dataKey="dateFormatted" 
              height={40} 
              stroke="hsl(var(--border))"
              fill="hsl(var(--card))"
              travellerWidth={8}
              gap={1}
            >
              <LineChart data={chartData}>
                <Line
                  type="linear"
                  dataKey="clicks"
                  stroke={METRIC_COLORS.clicks}
                  strokeWidth={1}
                  dot={false}
                  strokeOpacity={0.6}
                />
              </LineChart>
            </Brush>

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
      </div>

      <CustomLegend />
    </div>
  );
}
