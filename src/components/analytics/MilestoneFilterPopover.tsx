import { useMemo } from 'react';
import { Filter, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MILESTONE_COLORS, type MilestoneColor, type Annotation } from './ChartAnnotation';
import { cn } from '@/lib/utils';
import type { GhostLink } from '@/types';

interface MilestoneFilterPopoverProps {
  milestones: Annotation[];
  links: GhostLink[];
  colorFilters: Set<MilestoneColor>;
  linkFilters: Set<string | 'global'>;
  onToggleColorFilter: (color: MilestoneColor) => void;
  onToggleLinkFilter: (linkId: string | 'global') => void;
  onSelectAllColors: () => void;
  onClearAllColors: () => void;
  isFilterActive: boolean;
}

const ALL_COLORS: MilestoneColor[] = ['teal', 'yellow', 'red', 'green', 'purple', 'pink', 'orange', 'white'];

export function MilestoneFilterPopover({
  milestones,
  links,
  colorFilters,
  linkFilters,
  onToggleColorFilter,
  onToggleLinkFilter,
  onSelectAllColors,
  onClearAllColors,
  isFilterActive,
}: MilestoneFilterPopoverProps) {
  // Get unique links that have milestones assigned
  const linksWithMilestones = useMemo(() => {
    const linkIdsWithMilestones = new Set<string>();
    let hasGlobalMilestones = false;

    milestones.forEach(m => {
      const linkedIds = m.linkedLinkIds || [];
      if (linkedIds.length === 0) {
        hasGlobalMilestones = true;
      } else {
        linkedIds.forEach(id => linkIdsWithMilestones.add(id));
      }
    });

    const associatedLinks = links.filter(l => linkIdsWithMilestones.has(l.id));
    
    return { associatedLinks, hasGlobalMilestones };
  }, [milestones, links]);

  // Get colors that are actually used in milestones
  const usedColors = useMemo(() => {
    const colors = new Set<MilestoneColor>();
    milestones.forEach(m => colors.add(m.color || 'teal'));
    return colors;
  }, [milestones]);

  const allColorsSelected = ALL_COLORS.every(c => colorFilters.has(c));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "relative flex items-center justify-center p-1 rounded transition-colors",
            isFilterActive
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
          title="Filter milestones"
        >
          <Filter className="w-3.5 h-3.5" />
          {isFilterActive && (
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
          )}
        </button>
      </PopoverTrigger>
      
      <PopoverContent
        side="top"
        align="center"
        sideOffset={8}
        className="w-[220px] p-0 bg-card/95 backdrop-blur-md border-border/80"
      >
        <div className="p-3 space-y-4">
          {/* Filter by Color */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                By Color
              </span>
              <button
                onClick={allColorsSelected ? onClearAllColors : onSelectAllColors}
                className="text-[10px] text-primary hover:text-primary/80 transition-colors"
              >
                {allColorsSelected ? 'Clear' : 'Select All'}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {ALL_COLORS.map((color) => {
                const isSelected = colorFilters.has(color);
                const isUsed = usedColors.has(color);
                const isWhite = color === 'white';
                
                return (
                  <button
                    key={color}
                    onClick={() => onToggleColorFilter(color)}
                    disabled={!isUsed}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                      isSelected && isUsed && "ring-2 ring-offset-1 ring-offset-card",
                      !isUsed && "opacity-20 cursor-not-allowed",
                      isUsed && "hover:scale-110"
                    )}
                    style={{
                      backgroundColor: MILESTONE_COLORS[color].bg,
                      borderColor: isWhite ? 'hsl(0 0% 70%)' : 'transparent',
                      ...(isSelected && isUsed && { '--tw-ring-color': MILESTONE_COLORS[color].bg } as React.CSSProperties),
                    }}
                    title={`${color.charAt(0).toUpperCase() + color.slice(1)}${!isUsed ? ' (not used)' : ''}`}
                  >
                    {isSelected && isUsed && (
                      <Check className={cn("w-3 h-3", isWhite || color === 'yellow' ? "text-gray-800" : "text-white")} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter by Link */}
          {(linksWithMilestones.associatedLinks.length > 0 || linksWithMilestones.hasGlobalMilestones) && (
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                By Link
              </span>
              
              <div className="max-h-[140px] overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {/* Global / Unassigned option */}
                {linksWithMilestones.hasGlobalMilestones && (
                  <button
                    onClick={() => onToggleLinkFilter('global')}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors text-left",
                      linkFilters.has('global')
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <div className={cn(
                      "w-3.5 h-3.5 rounded border-2 flex items-center justify-center flex-shrink-0",
                      linkFilters.has('global')
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/40"
                    )}>
                      {linkFilters.has('global') && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                    </div>
                    <span className="truncate italic">Global (Unassigned)</span>
                  </button>
                )}
                
                {/* Links with milestones */}
                {linksWithMilestones.associatedLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => onToggleLinkFilter(link.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors text-left",
                      linkFilters.has(link.id)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <div className={cn(
                      "w-3.5 h-3.5 rounded border-2 flex items-center justify-center flex-shrink-0",
                      linkFilters.has(link.id)
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/40"
                    )}>
                      {linkFilters.has(link.id) && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                    </div>
                    <span className="truncate">{link.alias}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="px-3 py-1.5 bg-muted/30 border-t border-border/30">
          <span className="text-[9px] text-muted-foreground">
            Toggle to show/hide milestones
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
