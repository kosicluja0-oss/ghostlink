import { cn } from '@/lib/utils';
import { LucideIcon, Lock } from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';

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
  customColor?: string;
  compact?: boolean;
  tooltip?: string;
  isActive?: boolean;
  onClick?: () => void;
}

export function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  isLocked = false,
  accentColor = 'primary',
  customColor,
  compact = false,
  tooltip,
  isActive = false,
  onClick
}: StatCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevValueRef = useRef(value);

  // Animate value changes
  useEffect(() => {
    if (prevValueRef.current === value) return;
    prevValueRef.current = value;
    setIsTransitioning(true);
    const t = setTimeout(() => {
      setDisplayValue(value);
      setIsTransitioning(false);
    }, 150);
    return () => clearTimeout(t);
  }, [value]);

  // ... keep existing code (handleMouseEnter, handleMouseLeave, colorClasses)
  const handleMouseEnter = useCallback(() => {
    if (!tooltip) return;
    timerRef.current = setTimeout(() => setShowTooltip(true), 1000);
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
        "relative bg-card rounded-xl border transition-all duration-200",
        isActive ? "border-primary/60 ring-1 ring-primary/20" : "border-border hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-sm",
        onClick && "cursor-pointer",
        compact ? "p-3" : "p-5"
      )}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={cn("flex items-start justify-between", compact ? "mb-1.5" : "mb-3")}>
        <span className={cn("font-medium text-muted-foreground", compact ? "text-xs" : "text-sm")}>{label}</span>
        <Icon className={cn(compact ? "h-4 w-4" : "h-5 w-5", !customColor && colorClasses[accentColor])} style={customColor ? { color: customColor } : undefined} />
      </div>
      
      <div className={cn('relative', isLocked && 'tier-locked')}>
        <p
          className={cn(
            !customColor && colorClasses[accentColor],
            compact ? "text-xl font-bold tabular-nums" : "stat-number",
            "transition-all duration-200",
            isTransitioning ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"
          )}
          style={customColor ? { color: customColor } : undefined}
        >
          {displayValue}
        </p>
        
        <div className={cn("flex items-center gap-1", compact ? "mt-1 h-4" : "mt-2 h-5")}>
          {trend && (
            <>
              <span className={cn(
                'text-xs font-medium transition-all duration-200',
                trend.isPositive ? 'text-success' : 'text-destructive',
                isTransitioning ? 'opacity-0' : 'opacity-100'
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              {!compact && <span className="text-xs text-muted-foreground">vs last period</span>}
            </>
          )}
        </div>
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
