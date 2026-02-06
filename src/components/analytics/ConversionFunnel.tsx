import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ConversionFunnelProps {
  clicks: number;
  leads: number;
  sales: number;
}

export const ConversionFunnel = forwardRef<HTMLDivElement, ConversionFunnelProps>(
  function ConversionFunnel({ clicks, leads, sales }, ref) {
    const max = Math.max(clicks, 1);

    const stages = [
      {
        label: 'Clicks',
        value: clicks,
        width: 100,
        color: 'bg-primary',
        textColor: 'text-primary',
      },
      {
        label: 'Leads',
        value: leads,
        width: Math.max((leads / max) * 100, 8),
        color: 'bg-[hsl(var(--chart-leads))]',
        textColor: 'text-[hsl(var(--chart-leads))]',
      },
      {
        label: 'Sales',
        value: sales,
        width: Math.max((sales / max) * 100, 8),
        color: 'bg-[hsl(var(--chart-sales))]',
        textColor: 'text-[hsl(var(--chart-sales))]',
      },
    ];

    return (
      <div ref={ref} className="space-y-2.5">
        {stages.map((stage, i) => {
          const prevValue = i > 0 ? stages[i - 1].value : null;
          const dropOff =
            prevValue && prevValue > 0
              ? `${((stage.value / prevValue) * 100).toFixed(1)}%`
              : null;

          return (
            <div key={stage.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={cn('font-medium', stage.textColor)}>
                    {stage.label}
                  </span>
                  {dropOff && (
                    <span className="text-muted-foreground/60 text-[10px]">
                      ({dropOff} of {stages[i - 1].label.toLowerCase()})
                    </span>
                  )}
                </div>
                <span className="font-semibold text-foreground tabular-nums">
                  {stage.value.toLocaleString()}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted/30 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', stage.color)}
                  style={{ width: `${stage.width}%`, opacity: 0.85 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);
