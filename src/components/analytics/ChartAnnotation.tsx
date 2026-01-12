import { useState, useRef, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, X } from 'lucide-react';
import { format } from 'date-fns';

export interface Annotation {
  id: string;
  date: string; // ISO date string
  label: string;
}

interface ChartAnnotationProps {
  annotation: Annotation;
  chartWidth: number;
  chartHeight: number;
  dataLength: number;
  dateIndex: number; // Index of this annotation's date in the data array
  chartLeftMargin: number;
  chartRightMargin: number;
}

export function ChartAnnotation({
  annotation,
  chartWidth,
  chartHeight,
  dataLength,
  dateIndex,
  chartLeftMargin,
  chartRightMargin,
}: ChartAnnotationProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Calculate X position based on data index
  const usableWidth = chartWidth - chartLeftMargin - chartRightMargin;
  const xPosition = chartLeftMargin + (dateIndex / Math.max(1, dataLength - 1)) * usableWidth;
  
  // Don't render if position is invalid
  if (dateIndex < 0 || !isFinite(xPosition)) return null;

  const formattedDate = format(new Date(annotation.date), 'MMM d, yyyy');

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: xPosition,
        top: 5,
        height: chartHeight - 30,
        transform: 'translateX(-50%)',
      }}
    >
      {/* Dashed vertical line */}
      <svg
        className="absolute top-0 left-1/2 -translate-x-1/2"
        width="2"
        height="100%"
        style={{ overflow: 'visible' }}
      >
        <line
          x1="1"
          y1="12"
          x2="1"
          y2="100%"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          strokeOpacity="0.5"
        />
      </svg>

      {/* Interactive bubble at top */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className="pointer-events-auto absolute left-1/2 -translate-x-1/2 -top-1 group"
            onClick={() => setIsOpen(!isOpen)}
          >
            {/* Pulse ring animation */}
            <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: '2s' }} />
            
            {/* Main bubble */}
            <div className="relative w-5 h-5 rounded-full border-2 border-primary bg-card/90 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:scale-110 hover:bg-primary/20 shadow-lg shadow-primary/20">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            </div>
          </button>
        </PopoverTrigger>
        
        <PopoverContent
          side="top"
          align="center"
          sideOffset={8}
          className="w-auto max-w-[200px] p-0 bg-card/95 backdrop-blur-md border-primary/30 shadow-xl shadow-primary/10"
        >
          <div className="p-3">
            {/* Header with date */}
            <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-border/50">
              <Calendar className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-medium text-muted-foreground">{formattedDate}</span>
            </div>
            
            {/* Milestone label */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">Milestone</span>
              <p className="text-sm text-foreground font-medium leading-tight">{annotation.label}</p>
            </div>
          </div>
          
          {/* Close hint */}
          <div className="px-3 py-1.5 bg-muted/30 border-t border-border/30">
            <span className="text-[9px] text-muted-foreground">Click outside to close</span>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
