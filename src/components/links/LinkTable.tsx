import { useState, useMemo } from 'react';
import { ExternalLink, Archive, RotateCcw, Copy, Pencil, Search, MoreHorizontal, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getTrackingUrl, getDisplayUrl } from '@/lib/trackingUrl';
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

// Extract domain from URL for favicon
function getDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname;
  } catch {
    return '';
  }
}

// Mini sparkline component for click trends
function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((val - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 100" className="w-16 h-6" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Favicon component with fallback
function Favicon({ url }: { url: string }) {
  const [hasError, setHasError] = useState(false);
  const domain = getDomain(url);
  
  if (hasError || !domain) {
    return (
      <div className="flex items-center justify-center w-5 h-5 rounded bg-muted/60 shrink-0">
        <ExternalLink className="w-3 h-3 text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
      alt=""
      className="w-5 h-5 rounded shrink-0"
      onError={() => setHasError(true)}
    />
  );
}

function LinkRow({ 
  link, 
  userTier, 
  onArchive, 
  onRestore,
  isSelected = false,
  onSelect
}: LinkRowProps) {
  const isFreeTier = userTier === 'free';
  const displayUrl = getDisplayUrl(link.alias);
  const trackingUrl = getTrackingUrl(link.alias);
  
  // Generate mock sparkline data (last 24 hours trend)
  const sparklineData = useMemo(() => {
    // Simple mock: create 12 data points based on clicks with some variance
    const baseValue = link.clicks / 24;
    return Array.from({ length: 12 }, (_, i) => 
      Math.max(0, Math.round(baseValue * (0.5 + Math.random())))
    );
  }, [link.clicks]);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(trackingUrl);
    toast.success('Tracking URL copied to clipboard');
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div 
        className={cn(
          "flex items-center gap-3 px-3 py-2 border-b border-border/40 transition-all cursor-pointer group",
          isSelected 
            ? "bg-primary/8 border-l-2 border-l-primary" 
            : "hover:bg-muted/40 border-l-2 border-l-transparent"
        )}
        onClick={() => onSelect?.(link.id)}
      >
        {/* Link Info - Left */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <Favicon url={link.targetUrl} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-foreground truncate">{displayUrl}</span>
              {link.hasBridgePage && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium uppercase tracking-wide">
                  Bridge
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground/70 truncate max-w-[200px]">
              {link.targetUrl}
            </p>
          </div>
        </div>

        {/* Sparkline - Trend */}
        <div className="shrink-0 hidden lg:block">
          <Sparkline data={sparklineData} />
        </div>

        {/* Metrics - Middle */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right w-14">
            <p className="text-[13px] font-semibold text-foreground tabular-nums">{link.clicks.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">Clicks</p>
          </div>
          <div className={cn("text-right w-14", isFreeTier && "opacity-40")}>
            <p className="text-[13px] font-semibold text-foreground tabular-nums">{link.leads.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">Leads</p>
          </div>
          <div className={cn("text-right w-14", isFreeTier && "opacity-40")}>
            <p className="text-[13px] font-semibold text-foreground tabular-nums">{link.sales.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">Sales</p>
          </div>
        </div>

        {/* Actions - Right */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Copy Button - Always visible on hover */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className={cn(
                  "h-7 px-2.5 text-[11px] gap-1.5 transition-opacity",
                  "opacity-0 group-hover:opacity-100",
                  isSelected && "opacity-100"
                )}
                onClick={handleCopyLink}
              >
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Copy link to clipboard
            </TooltipContent>
          </Tooltip>

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                      "h-7 w-7 transition-opacity",
                      "opacity-0 group-hover:opacity-100",
                      isSelected && "opacity-100"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                More actions
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                <Pencil className="h-3.5 w-3.5 mr-2" />
                Edit Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => e.stopPropagation()} asChild>
                <a href={link.targetUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-2" />
                  Open Target
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                <BarChart3 className="h-3.5 w-3.5 mr-2" />
                Reset Stats
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {link.status === 'active' ? (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive(link.id);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Archive className="h-3.5 w-3.5 mr-2" />
                  Archive Link
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore(link.id);
                  }}
                  className="text-success focus:text-success"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-2" />
                  Restore Link
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
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
      {/* Header with Search - Pinned */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-3 py-2 border-b border-border bg-card">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search links..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-8 text-[12px] bg-muted/30 border-border/50 focus:bg-background"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowArchived(false)}
            className={cn(
              "text-[11px] px-2 py-1 rounded transition-colors",
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
              "text-[11px] px-2 py-1 rounded transition-colors",
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
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-border/40 bg-muted/20 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
        <div className="flex-1">Link</div>
        <div className="w-16 shrink-0 hidden lg:block text-center">Trend</div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right w-14">Clicks</div>
          <div className="text-right w-14">Leads</div>
          <div className="text-right w-14">Sales</div>
        </div>
        <div className="w-20 shrink-0"></div>
      </div>

      {/* Rows */}
      <div className="max-h-[260px] overflow-y-auto">
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
            <p className="text-[12px] text-muted-foreground">
              {searchQuery ? 'No links match your search' : showArchived ? 'No archived links' : 'No active links yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}