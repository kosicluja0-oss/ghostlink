import { Link2, ExternalLink, Archive, RotateCcw, MousePointer, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GhostLink, TierType } from '@/types';

interface LinkCardProps {
  link: GhostLink;
  userTier: TierType;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
}

export function LinkCard({ link, userTier, onArchive, onRestore }: LinkCardProps) {
  const isFreeTier = userTier === 'free';
  const fullUrl = `ghost.link/${link.alias}`;

  return (
    <div className="bg-card rounded-lg border border-border p-4 transition-ghost hover:border-primary/30 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-foreground">{fullUrl}</span>
            {link.hasBridgePage && (
              <span className="bridge-indicator" title="Bridge Page Active">
                <Link2 className="h-3 w-3" />
                Bridge
              </span>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
          <a href={link.targetUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </a>
        </Button>
      </div>

      {/* Target URL */}
      <p className="text-xs text-muted-foreground truncate mb-4 font-mono">
        {link.targetUrl}
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <MousePointer className="h-3 w-3 text-chart-clicks" />
            <span className="text-xs text-muted-foreground">Clicks</span>
          </div>
          <p className="text-lg font-bold text-foreground">{link.clicks.toLocaleString()}</p>
        </div>
        
        <div className={cn('text-center', isFreeTier && 'tier-locked')}>
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="h-3 w-3 text-chart-leads" />
            <span className="text-xs text-muted-foreground">Leads</span>
          </div>
          <p className="text-lg font-bold text-foreground">{link.leads.toLocaleString()}</p>
        </div>
        
        <div className={cn('text-center', isFreeTier && 'tier-locked')}>
          <div className="flex items-center justify-center gap-1 mb-1">
            <DollarSign className="h-3 w-3 text-chart-sales" />
            <span className="text-xs text-muted-foreground">Sales</span>
          </div>
          <p className="text-lg font-bold text-foreground">{link.sales.toLocaleString()}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">
          Created {link.createdAt.toLocaleDateString()}
        </span>
        
        {link.status === 'active' ? (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs text-muted-foreground hover:text-destructive"
            onClick={() => onArchive(link.id)}
          >
            <Archive className="h-3 w-3 mr-1" />
            Archive
          </Button>
        ) : (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs text-muted-foreground hover:text-success"
            onClick={() => onRestore(link.id)}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Restore
          </Button>
        )}
      </div>
    </div>
  );
}
