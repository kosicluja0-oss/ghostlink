import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface DataPoint {
  date: string;
  clicks: number;
}

interface MiniAreaChartProps {
  data: DataPoint[];
}

export function MiniAreaChart({ data }: MiniAreaChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[120px] flex items-center justify-center text-xs text-muted-foreground">
        No click data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="miniClickGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--chart-clicks))" stopOpacity={0.3} />
            <stop offset="100%" stopColor="hsl(var(--chart-clicks))" stopOpacity={0} />
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
          interval={Math.floor(data.length / 4)}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
          width={36}
          allowDecimals={false}
          tickFormatter={(val) => {
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
          formatter={(value: number) => [value, 'Clicks']}
        />
        <Area
          type="monotone"
          dataKey="clicks"
          stroke="hsl(var(--chart-clicks))"
          strokeWidth={1.5}
          fill="url(#miniClickGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
