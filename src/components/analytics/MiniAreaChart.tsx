import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { format, parseISO } from 'date-fns';

export type ChartMetric = 'clicks' | 'leads' | 'sales' | 'epc' | 'cr';

interface DataPoint {
  date: string;
  clicks: number;
  leads: number;
  sales: number;
  earnings: number;
}

interface MiniAreaChartProps {
  data: DataPoint[];
  metric?: ChartMetric;
}

const METRIC_CONFIG: Record<ChartMetric, {
  color: string;
  label: string;
  format: (v: number) => string;
}> = {
  clicks: {
    color: 'hsl(var(--chart-clicks))',
    label: 'Clicks',
    format: (v) => v.toLocaleString(),
  },
  leads: {
    color: 'hsl(var(--chart-leads))',
    label: 'Leads',
    format: (v) => v.toLocaleString(),
  },
  sales: {
    color: 'hsl(var(--chart-sales))',
    label: 'Sales',
    format: (v) => v.toLocaleString(),
  },
  epc: {
    color: 'hsl(var(--chart-clicks))',
    label: 'EPC',
    format: (v) => `$${v.toFixed(2)}`,
  },
  cr: {
    color: 'hsl(var(--chart-clicks))',
    label: 'CR',
    format: (v) => `${v.toFixed(1)}%`,
  },
};

function computeValue(point: DataPoint, metric: ChartMetric): number {
  switch (metric) {
    case 'clicks': return point.clicks;
    case 'leads': return point.leads;
    case 'sales': return point.sales;
    case 'epc': return point.clicks > 0 ? point.earnings / point.clicks : 0;
    case 'cr': return point.clicks > 0 ? ((point.leads + point.sales) / point.clicks) * 100 : 0;
  }
}

export function MiniAreaChart({ data, metric = 'clicks' }: MiniAreaChartProps) {
  const config = METRIC_CONFIG[metric];

  if (!data || data.length === 0) {
    return (
      <div className="h-[120px] flex items-center justify-center text-xs text-muted-foreground">
        No data yet
      </div>
    );
  }

  const chartData = data.map((p) => ({
    date: p.date,
    value: computeValue(p, metric),
  }));

  const gradientId = `miniGradient-${metric}`;

  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={config.color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={config.color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
          tickFormatter={(val) => {
            try {
              return format(parseISO(val), 'd MMM');
            } catch {
              return val;
            }
          }}
          interval={Math.floor(chartData.length / 4)}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
          width={36}
          allowDecimals={metric === 'epc' || metric === 'cr'}
          tickFormatter={(val) => {
            if (metric === 'epc') return `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(val < 1 ? 2 : 0)}`;
            if (metric === 'cr') return `${val.toFixed(0)}%`;
            if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
            return String(val);
          }}
          tickCount={4}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '11px',
            padding: '6px 10px',
          }}
          labelFormatter={(val) => {
            try {
              return format(parseISO(val as string), 'MMM d, yyyy');
            } catch {
              return String(val);
            }
          }}
          formatter={(value: number) => [config.format(value), config.label]}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={config.color}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
