import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type TimeRange = '30m' | '6h' | '1d' | '1w' | '1m' | '1y' | '3y';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '30m', label: '30 min' },
  { value: '6h', label: '6 hours' },
  { value: '1d', label: '1 day' },
  { value: '1w', label: '1 week' },
  { value: '1m', label: '1 month' },
  { value: '1y', label: '1 year' },
  { value: '3y', label: '3 years' },
];

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as TimeRange)}>
      <TabsList className="bg-muted/50 p-1">
        {TIME_RANGES.map((range) => (
          <TabsTrigger
            key={range.value}
            value={range.value}
            className="text-xs px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {range.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
