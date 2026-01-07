import { useState, useMemo } from 'react';
import { Link2, ExternalLink, Archive, RotateCcw, Copy, Pencil, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { GhostLink, TierType } from '@/types';
import { toast } from 'sonner';

interface LinkTableProps {
  links: GhostLink[];
  userTier: TierType;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  activeLinkId?: string | null;
  onLinkSelect?: (linkId: string) => void;
}

interface LinkRowProps {
  link: GhostLink;
  userTier: TierType;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (linkId: string) => void;
}

function LinkRow({ 
  link, 
  userTier, 
  onArchive, 
  onRestore,
  isSelected = false,
  onSelect
}: LinkRowProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isFreeTier = userTier === 'free';
  const fullUrl = `ghost.link/${link.alias}`;

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`https://${fullUrl}`);
    toast.success('Link copied to clipboard');
  };

  return (
    <div 
      className={cn(
        "flex items-center gap-4 px-3 py-2.5 border-b border-border/50 transition-all cursor-pointer group",
        isSelected 
          ? "bg-primary/5 border-l-2 border-l-primary" 
          : "hover:bg-muted/30 border-l-2 border-l-transparent"
      )}
      onClick={() => onSelect?.(link.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Link Info - Left */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex items-center justify-center w-8 h-8 rounded bg-muted/50 shrink-0">
          <Link2 className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-foreground truncate">{fullUrl}</span>
            {link.hasBridgePage && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                Bridge
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground truncate font-mono">
            {link.targetUrl}
          </p>
        </div>
      </div>

      {/* Metrics - Middle */}
      <div className="flex items-center gap-6 shrink-0">
        <div className="text-center w-16">
          <p className="text-[13px] font-semibold text-foreground tabular-nums">{link.clicks.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Clicks</p>
        </div>
        <div className={cn("text-center w-16", isFreeTier && "opacity-40")}>
          <p className="text-[13px] font-semibold text-foreground tabular-nums">{link.leads.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Leads</p>
        </div>
        <div className={cn("text-center w-16", isFreeTier && "opacity-40")}>
          <p className="text-[13px] font-semibold text-foreground tabular-nums">{link.sales.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Sales</p>
        </div>
      </div>

      {/* Actions - Right */}
      <div className={cn(
        "flex items-center gap-1 shrink-0 transition-opacity",
        isHovered || isSelected ? "opacity-100" : "opacity-0"
      )}>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7"
          onClick={handleCopyLink}
        >
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7"
          onClick={(e) => e.stopPropagation()}
        >
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7" 
          asChild
          onClick={(e) => e.stopPropagation()}
        >
          <a href={link.targetUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </a>
        </Button>
        {link.status === 'active' ? (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onArchive(link.id);
            }}
          >
            <Archive className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        ) : (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 hover:text-success"
            onClick={(e) => {
              e.stopPropagation();
              onRestore(link.id);
            }}
          >
            <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function LinkTable({ 
  links, 
  userTier, 
  onArchive, 
  onRestore,
  activeLinkId,
  onLinkSelect
}: LinkTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const filteredLinks = useMemo(() => {
    let filtered = links;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(link => 
        link.alias.toLowerCase().includes(query) ||
        link.targetUrl.toLowerCase().includes(query)
      );
    }
    
    // Filter by status
    if (!showArchived) {
      filtered = filtered.filter(link => link.status === 'active');
    }
    
    return filtered;
  }, [links, searchQuery, showArchived]);

  const activeCount = links.filter(l => l.status === 'active').length;
  const archivedCount = links.filter(l => l.status === 'archived').length;

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Header with Search */}
      <div className="flex items-center justify-between gap-4 px-3 py-2.5 border-b border-border bg-muted/20">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search links..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-[13px] bg-background border-border/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchived(false)}
            className={cn(
              "text-[12px] px-2.5 py-1 rounded transition-colors",
              !showArchived 
                ? "bg-primary/10 text-primary font-medium" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={cn(
              "text-[12px] px-2.5 py-1 rounded transition-colors",
              showArchived 
                ? "bg-muted text-foreground font-medium" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Archived ({archivedCount})
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="flex items-center gap-4 px-3 py-2 border-b border-border/50 bg-muted/10 text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
        <div className="flex-1">Link</div>
        <div className="flex items-center gap-6 shrink-0">
          <div className="text-center w-16">Clicks</div>
          <div className="text-center w-16">Leads</div>
          <div className="text-center w-16">Sales</div>
        </div>
        <div className="w-[132px] shrink-0 text-right">Actions</div>
      </div>

      {/* Rows */}
      <div className="max-h-[280px] overflow-y-auto">
        {filteredLinks.length > 0 ? (
          filteredLinks.map((link) => (
            <LinkRow
              key={link.id}
              link={link}
              userTier={userTier}
              onArchive={onArchive}
              onRestore={onRestore}
              isSelected={activeLinkId === link.id}
              onSelect={onLinkSelect}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-[13px] text-muted-foreground">
              {searchQuery ? 'No links match your search' : showArchived ? 'No archived links' : 'No active links yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
