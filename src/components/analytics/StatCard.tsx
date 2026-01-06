import { cn } from '@/lib/utils';
import { LucideIcon, Lock } from 'lucide-react';

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
}

export function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  isLocked = false,
  accentColor = 'primary'
}: StatCardProps) {
  const colorClasses = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    'chart-conversions': 'text-chart-conversions',
  };

  return (
    <div className="relative bg-card rounded-lg border border-border p-5 transition-ghost hover:border-primary/30">
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <Icon className={cn('h-5 w-5', colorClasses[accentColor])} />
      </div>
      
      <div className={cn('relative', isLocked && 'tier-locked')}>
        <p className={cn('stat-number', colorClasses[accentColor])}>
          {value}
        </p>
        
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <span className={cn(
              'text-xs font-medium',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">vs last period</span>
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
    </div>
  );
}
