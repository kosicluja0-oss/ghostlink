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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  // Count-up animation for numeric values
  useEffect(() => {
    const valStr = String(value);
    const prevStr = String(displayValue);
    if (valStr === prevStr) return;

    // Extract numeric part: supports "$1,234.56", "12.34%", "1,000", plain numbers
    const parseNum = (s: string) => {
      const match = s.match(/[\d,.]+/);
      return match ? parseFloat(match[0].replace(/,/g, '')) : null;
    };

    const targetNum = parseNum(valStr);
    const startNum = parseNum(prevStr);

    // If both are numeric, animate; otherwise snap
    if (targetNum === null || startNum === null || isNaN(targetNum) || isNaN(startNum)) {
      setDisplayValue(value);
      return;
    }

    // Determine formatting from target value string
    const prefix = valStr.match(/^[^0-9]*/)?.[0] || '';
    const suffix = valStr.match(/[^0-9.]*$/)?.[0] || '';
    const decimals = valStr.includes('.') ? (valStr.split('.')[1]?.replace(/[^0-9]/g, '').length || 0) : 0;
    const useCommas = valStr.includes(',');

    const formatAnimated = (n: number) => {
      let formatted = decimals > 0 ? n.toFixed(decimals) : Math.round(n).toString();
      if (useCommas) {
        const [int, dec] = formatted.split('.');
        formatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (dec ? '.' + dec : '');
      }
      return prefix + formatted + suffix;
    };

    const duration = 400; // ms
    const startTime = performance.now();
    const diff = targetNum - startNum;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startNum + diff * eased;
      setDisplayValue(formatAnimated(current));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        // Snap to exact target string to avoid formatting drift
        setDisplayValue(value);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

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
          )}
          style={customColor ? { color: customColor } : undefined}
        >
          {displayValue}
        </p>
        
        <div className={cn("flex items-center gap-1", compact ? "mt-1 h-4" : "mt-2 h-5")}>
          {trend && (
            <>
              <span className={cn(
                'text-xs font-medium',
                trend.isPositive ? 'text-success' : 'text-destructive',
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
