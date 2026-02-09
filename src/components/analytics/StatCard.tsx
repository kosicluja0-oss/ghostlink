import { cn } from '@/lib/utils';
import { LucideIcon, Lock } from 'lucide-react';
import { useState, useRef, useCallback } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isLocked?: boolean;
  accentColor?: 'primary' | 'success' | 'warning' | 'chart-conversions';
  compact?: boolean;
  tooltip?: string;
}

export function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  isLocked = false,
  accentColor = 'primary',
  compact = false,
  tooltip
}: StatCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (!tooltip) return;
    timerRef.current = setTimeout(() => setShowTooltip(true), 2000);
  }, [tooltip]);

  const handleMouseLeave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowTooltip(false);
  }, []);

  const colorClasses = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    'chart-conversions': 'text-chart-conversions',
  };

  return (
    <div
      className={cn(
        "relative bg-card rounded-lg border border-border transition-ghost hover:border-primary/30",
        compact ? "p-3" : "p-5"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={cn("flex items-start justify-between", compact ? "mb-1.5" : "mb-3")}>
        <span className={cn("font-medium text-muted-foreground", compact ? "text-xs" : "text-sm")}>{label}</span>
        <Icon className={cn(colorClasses[accentColor], compact ? "h-4 w-4" : "h-5 w-5")} />
      </div>
      
      <div className={cn('relative', isLocked && 'tier-locked')}>
        <p className={cn(
          colorClasses[accentColor],
          compact ? "text-xl font-bold tabular-nums" : "stat-number"
        )}>
          {value}
        </p>
        
        {trend && (
          <div className={cn("flex items-center gap-1", compact ? "mt-1" : "mt-2")}>
            <span className={cn(
              'text-xs font-medium',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            {!compact && <span className="text-xs text-muted-foreground">vs last period</span>}
          </div>
        )}
      </div>

      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/50 rounded-lg backdrop-blur-[2px]">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span className="text-xs font-medium">PRO</span>
          </div>
        </div>
      )}

      {/* Delayed hover tooltip */}
      {tooltip && showTooltip && (
        <div className="absolute z-50 left-0 right-0 top-full mt-2 animate-fade-in">
          <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
            <p className="text-xs text-popover-foreground leading-relaxed">{tooltip}</p>
          </div>
        </div>
      )}
    </div>
  );
}
