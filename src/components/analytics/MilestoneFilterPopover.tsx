import { useState, useMemo, useEffect, useRef } from 'react';
import { Filter, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MILESTONE_COLORS, SIZE_CONFIG, type MilestoneColor, type MilestoneSize, type Annotation } from './ChartAnnotation';
import { cn } from '@/lib/utils';

interface MilestoneFilterPopoverProps {
  milestones: Annotation[];
  colorFilters: Set<MilestoneColor>;
  sizeFilters: Set<MilestoneSize>;
  onToggleColorFilter: (color: MilestoneColor) => void;
  onToggleSizeFilter: (size: MilestoneSize) => void;
  onSelectAllColors: () => void;
  onClearAllColors: () => void;
  onSelectAllSizes: () => void;
  onClearAllSizes: () => void;
  isFilterActive: boolean;
}

const ALL_COLORS: MilestoneColor[] = ['teal', 'yellow', 'red', 'green', 'purple', 'pink', 'orange', 'white'];
const ALL_SIZES: MilestoneSize[] = ['small', 'medium', 'large'];

export function MilestoneFilterPopover({
  milestones,
  colorFilters,
  sizeFilters,
  onToggleColorFilter,
  onToggleSizeFilter,
  onSelectAllColors,
  onClearAllColors,
  onSelectAllSizes,
  onClearAllSizes,
  isFilterActive,
}: MilestoneFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Get colors that are actually used in milestones
  const usedColors = useMemo(() => {
    const colors = new Set<MilestoneColor>();
    milestones.forEach(m => colors.add(m.color || 'teal'));
    return colors;
  }, [milestones]);

  // Get sizes that are actually used in milestones
  const usedSizes = useMemo(() => {
    const sizes = new Set<MilestoneSize>();
    milestones.forEach(m => sizes.add(m.size || 'medium'));
    return sizes;
  }, [milestones]);

  const allColorsSelected = ALL_COLORS.every(c => colorFilters.has(c));
  const allSizesSelected = ALL_SIZES.every(s => sizeFilters.has(s));

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      
      // Check if click is inside content or trigger
      if (contentRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      
      // Click is outside, close the popover
      setIsOpen(false);
    };

    // Use timeout to avoid immediate close on open click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleTriggerClick = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <Popover open={isOpen} modal={false}>
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          onClick={handleTriggerClick}
          className={cn(
            "relative flex items-center justify-center p-1 rounded transition-colors",
            isFilterActive
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
          title="Filter notes"
        >
          <Filter className="w-3.5 h-3.5" />
          {isFilterActive && (
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
          )}
        </button>
      </PopoverTrigger>
      
      <PopoverContent
        ref={contentRef}
        side="top"
        align="center"
        sideOffset={8}
        className="w-[220px] p-0 bg-card/95 backdrop-blur-md border-border/80"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onFocusOutside={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div 
          className="p-3 space-y-4"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Filter by Color */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                By Color
              </span>
              <button
                type="button"
                onClick={() => {
                  allColorsSelected ? onClearAllColors() : onSelectAllColors();
                }}
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
                    type="button"
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

          {/* Filter by Size */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                By Size
              </span>
              <button
                type="button"
                onClick={() => {
                  allSizesSelected ? onClearAllSizes() : onSelectAllSizes();
                }}
                className="text-[10px] text-primary hover:text-primary/80 transition-colors"
              >
                {allSizesSelected ? 'Clear' : 'Select All'}
              </button>
            </div>
            
            <div className="flex gap-1.5">
              {ALL_SIZES.map((size) => {
                const isSelected = sizeFilters.has(size);
                const isUsed = usedSizes.has(size);
                
                return (
                  <button
                    type="button"
                    key={size}
                    onClick={() => onToggleSizeFilter(size)}
                    disabled={!isUsed}
                    className={cn(
                      "flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all border",
                      isSelected && isUsed
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/30 text-muted-foreground border-border/50",
                      !isUsed && "opacity-30 cursor-not-allowed",
                      isUsed && !isSelected && "hover:bg-muted/50 hover:text-foreground hover:border-border"
                    )}
                    title={`${SIZE_CONFIG[size].label}${!isUsed ? ' (not used)' : ''}`}
                  >
                    {SIZE_CONFIG[size].label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="px-3 py-1.5 bg-muted/30 border-t border-border/30">
          <span className="text-[9px] text-muted-foreground">
            Toggle to show/hide notes
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
