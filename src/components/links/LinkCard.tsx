import { Link2, ExternalLink, Archive, RotateCcw, MousePointer, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GhostLink, TierType } from '@/types';

interface LinkCardProps {
  link: GhostLink;
  userTier: TierType;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (linkId: string) => void;
}

export function LinkCard({ 
  link, 
  userTier, 
  onArchive, 
  onRestore,
  isSelected = false,
  onSelect
}: LinkCardProps) {
  const isFreeTier = userTier === 'free';
  const fullUrl = `ghost.link/${link.alias}`;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger selection if clicking on buttons or links
    if ((e.target as HTMLElement).closest('button, a')) return;
    onSelect?.(link.id);
  };

  return (
    <div 
      className={cn(
        "bg-card rounded-lg border p-3 transition-all cursor-pointer animate-fade-in",
        isSelected 
          ? "border-primary bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.3)]" 
          : "border-border hover:border-primary/30"
      )}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{fullUrl}</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6" 
          asChild
          onClick={(e) => e.stopPropagation()}
        >
          <a href={link.targetUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>
        </Button>
      </div>

      {/* Target URL */}
      <p className="text-xs text-muted-foreground truncate mb-3 font-mono">
        {link.targetUrl}
      </p>

      {/* Stats Grid - Compact */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <MousePointer className="h-2.5 w-2.5 text-chart-clicks" />
            <span className="text-[10px] text-muted-foreground">Clicks</span>
          </div>
          <p className="text-base font-bold text-foreground tabular-nums">{link.clicks.toLocaleString()}</p>
        </div>
        
        <div className={cn('text-center', isFreeTier && 'tier-locked')}>
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Users className="h-2.5 w-2.5 text-chart-leads" />
            <span className="text-[10px] text-muted-foreground">Leads</span>
          </div>
          <p className="text-base font-bold text-foreground tabular-nums">{link.leads.toLocaleString()}</p>
        </div>
        
        <div className={cn('text-center', isFreeTier && 'tier-locked')}>
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <DollarSign className="h-2.5 w-2.5 text-chart-sales" />
            <span className="text-[10px] text-muted-foreground">Sales</span>
          </div>
          <p className="text-base font-bold text-foreground tabular-nums">{link.sales.toLocaleString()}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-[10px] text-muted-foreground">
          Created {link.createdAt.toLocaleDateString()}
        </span>
        
        {link.status === 'active' ? (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 text-[10px] text-muted-foreground hover:text-destructive px-2"
            onClick={(e) => {
              e.stopPropagation();
              onArchive(link.id);
            }}
          >
            <Archive className="h-2.5 w-2.5 mr-1" />
            Archive
          </Button>
        ) : (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 text-[10px] text-muted-foreground hover:text-success px-2"
            onClick={(e) => {
              e.stopPropagation();
              onRestore(link.id);
            }}
          >
            <RotateCcw className="h-2.5 w-2.5 mr-1" />
            Restore
          </Button>
        )}
      </div>
    </div>
  );
}
