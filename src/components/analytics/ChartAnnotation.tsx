import { useState, useRef, useEffect, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Calendar, Trash2, GripVertical, Settings, Check } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { LinkSelector } from './LinkSelector';
import type { GhostLink } from '@/types';

// Movement threshold to distinguish click from drag (in pixels)
const DRAG_THRESHOLD = 5;

export type MilestoneColor = 'teal' | 'yellow' | 'red' | 'green' | 'purple' | 'pink' | 'orange' | 'white';
export type MilestoneSize = 'small' | 'medium' | 'large';

export interface Annotation {
  id: string;
  date: string; // ISO date string
  label: string;
  color?: MilestoneColor;
  size?: MilestoneSize;
  yOffset?: number; // 0-100 percentage from top
  linkedLinkIds?: string[]; // Empty = global, otherwise linked to specific links
}

// Color palette with HSL values
export const MILESTONE_COLORS: Record<MilestoneColor, { bg: string; border: string; line: string }> = {
  teal: { bg: 'hsl(var(--primary))', border: 'hsl(var(--primary))', line: 'hsl(var(--primary))' },
  yellow: { bg: 'hsl(45 93% 47%)', border: 'hsl(45 93% 47%)', line: 'hsl(45 93% 47%)' },
  red: { bg: 'hsl(0 84% 60%)', border: 'hsl(0 84% 60%)', line: 'hsl(0 84% 60%)' },
  green: { bg: 'hsl(142 71% 45%)', border: 'hsl(142 71% 45%)', line: 'hsl(142 71% 45%)' },
  purple: { bg: 'hsl(270 70% 60%)', border: 'hsl(270 70% 60%)', line: 'hsl(270 70% 60%)' },
  pink: { bg: 'hsl(330 80% 65%)', border: 'hsl(330 80% 65%)', line: 'hsl(330 80% 65%)' },
  orange: { bg: 'hsl(25 95% 53%)', border: 'hsl(25 95% 53%)', line: 'hsl(25 95% 53%)' },
  white: { bg: 'hsl(0 0% 98%)', border: 'hsl(0 0% 98%)', line: 'hsl(0 0% 80%)' },
};

// Size multipliers - exported for AddMilestoneDialog
export const SIZE_CONFIG: Record<MilestoneSize, { bubble: number; inner: number; label: string }> = {
  small: { bubble: 0.67, inner: 0.67, label: 'S' },
  medium: { bubble: 1, inner: 1, label: 'M' },
  large: { bubble: 1.33, inner: 1.33, label: 'L' },
};

interface ChartAnnotationProps {
  annotation: Annotation;
  chartWidth: number;
  chartHeight: number;
  dataLength: number;
  dateIndex: number;
  chartLeftMargin: number;
  chartRightMargin: number;
  links: GhostLink[];
  onDelete?: (id: string) => void;
  onUpdateYOffset?: (id: string, yOffset: number) => void;
  onUpdateColor?: (id: string, color: MilestoneColor) => void;
  onUpdateSize?: (id: string, size: MilestoneSize) => void;
  onToggleLinkedLink?: (id: string, linkId: string) => void;
}

export function ChartAnnotation({
  annotation,
  chartWidth,
  chartHeight,
  dataLength,
  dateIndex,
  chartLeftMargin,
  chartRightMargin,
  links,
  onDelete,
  onUpdateYOffset,
  onUpdateColor,
  onUpdateSize,
  onToggleLinkedLink,
}: ChartAnnotationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [pendingYOffset, setPendingYOffset] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ y: number; startOffset: number } | null>(null);
  
  const color = annotation.color || 'teal';
  const size = annotation.size || 'medium';
  const colorConfig = MILESTONE_COLORS[color];
  const sizeConfig = SIZE_CONFIG[size];
  const yOffset = annotation.yOffset ?? 0;
  
  // Base bubble size
  const baseBubbleSize = 20; // 5 * 4 = 20px (w-5)
  const baseInnerSize = 6; // 1.5 * 4 = 6px (w-1.5)
  const bubbleSize = Math.round(baseBubbleSize * sizeConfig.bubble);
  const innerSize = Math.round(baseInnerSize * sizeConfig.inner);
  
  // Calculate X position based on data index
  const usableWidth = chartWidth - chartLeftMargin - chartRightMargin;
  const xPosition = chartLeftMargin + (dateIndex / Math.max(1, dataLength - 1)) * usableWidth;
  
  // Calculate Y position based on offset (0 = top, 100 = near bottom)
  // Use pending offset during drag for immediate visual feedback
  const usableHeight = chartHeight - 50; // Leave space for axis
  const displayYOffset = pendingYOffset ?? yOffset;
  const yPosition = 5 + (displayYOffset / 100) * (usableHeight - 30);
  
  // Don't render if position is invalid
  if (dateIndex < 0 || !isFinite(xPosition)) return null;

  const formattedDate = format(new Date(annotation.date), 'MMM d, yyyy');

  const handleDelete = () => {
    onDelete?.(annotation.id);
    setIsOpen(false);
  };

  const handleColorSelect = (newColor: MilestoneColor) => {
    onUpdateColor?.(annotation.id, newColor);
  };

  const handleSizeSelect = (newSize: MilestoneSize) => {
    onUpdateSize?.(annotation.id, newSize);
  };

  const handleToggleLink = (linkId: string) => {
    onToggleLinkedLink?.(annotation.id, linkId);
  };

  // Handle drag start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    e.preventDefault();
    e.stopPropagation();
    
    dragStartRef.current = { y: e.clientY, startOffset: yOffset };
    setHasDragged(false);
    setIsDragging(true);
  }, [yOffset]);

  // Handle click - only open popover if no significant drag occurred
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasDragged) {
      setIsOpen(prev => !prev);
    }
  }, [hasDragged]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !dragStartRef.current) return;
      
      // Check if we've moved past the threshold
      const deltaY = Math.abs(e.clientY - dragStartRef.current.y);
      if (deltaY > DRAG_THRESHOLD) {
        setHasDragged(true);
      }
      
      // Only update visual position if we're actually dragging
      if (deltaY > DRAG_THRESHOLD) {
        const parent = containerRef.current.parentElement;
        if (!parent) return;

        const rect = parent.getBoundingClientRect();
        const relativeY = e.clientY - rect.top - 5;
        const maxY = usableHeight - 30;
        const newOffset = Math.max(0, Math.min(100, (relativeY / maxY) * 100));
        
        // Store pending offset for visual update, don't persist yet
        setPendingYOffset(Math.round(newOffset));
      }
    };

    const handleMouseUp = () => {
      // Only save to localStorage on mouse up if we actually dragged
      if (hasDragged && pendingYOffset !== null) {
        onUpdateYOffset?.(annotation.id, pendingYOffset);
      }
      
      setIsDragging(false);
      setPendingYOffset(null);
      dragStartRef.current = null;
      
      // Reset hasDragged after a small delay to allow click handler to check it
      setTimeout(() => setHasDragged(false), 10);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, hasDragged, pendingYOffset, annotation.id, onUpdateYOffset, usableHeight]);

  // Reset settings view when popover closes
  useEffect(() => {
    if (!isOpen) {
      setShowSettings(false);
    }
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className="absolute pointer-events-none animate-fade-in"
      style={{
        left: xPosition,
        top: 5,
        height: chartHeight - 30,
        transform: 'translateX(-50%)',
      }}
    >
      {/* Dashed vertical line - from bubble to bottom */}
      <svg
        className="absolute left-1/2 -translate-x-1/2"
        width="2"
        height="100%"
        style={{ overflow: 'visible', top: yPosition }}
      >
        <line
          x1="1"
          y1={bubbleSize / 2 + 2}
          x2="1"
          y2={chartHeight - 30 - yPosition - 10}
          stroke={colorConfig.line}
          strokeWidth="1.5"
          strokeDasharray="4 3"
          strokeOpacity="0.5"
        />
      </svg>

      {/* Interactive bubble - positioned by yOffset */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "pointer-events-auto absolute left-1/2 -translate-x-1/2 group",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            style={{ top: yPosition }}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
          >
            {/* Pulse ring animation */}
            <div 
              className="absolute inset-0 rounded-full animate-ping" 
              style={{ 
                backgroundColor: colorConfig.bg,
                opacity: 0.3,
                animationDuration: '2s',
                width: bubbleSize,
                height: bubbleSize,
              }} 
            />
            
            {/* Main bubble */}
            <div 
              className="relative rounded-full border-2 bg-card/90 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:scale-125 shadow-lg"
              style={{ 
                borderColor: colorConfig.border,
                boxShadow: `0 4px 12px ${colorConfig.bg}33`,
                width: bubbleSize,
                height: bubbleSize,
              }}
            >
              <div 
                className="rounded-full" 
                style={{ 
                  backgroundColor: colorConfig.bg,
                  width: innerSize,
                  height: innerSize,
                }}
              />
            </div>
            
            {/* Drag handle indicator on hover */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-70 transition-opacity">
              <GripVertical className="w-3 h-3 text-muted-foreground" />
            </div>
          </button>
        </PopoverTrigger>
        
        <PopoverContent
          side="top"
          align="center"
          sideOffset={8}
          className="w-auto min-w-[220px] max-w-[280px] p-0 bg-card/95 backdrop-blur-md shadow-xl"
          style={{ borderColor: `${colorConfig.border}50` }}
        >
          <div className="p-3 space-y-3">
            {/* Header with date, settings, and delete */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/50">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3" style={{ color: colorConfig.bg }} />
                <span className="text-[10px] font-medium text-muted-foreground">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={cn(
                    "p-1 rounded transition-colors",
                    showSettings 
                      ? "bg-primary/20 text-primary" 
                      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  )}
                  title="Settings"
                >
                  <Settings className="w-3 h-3" />
                </button>
                {onDelete && (
                  <button
                    onClick={handleDelete}
                    className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete note"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Primary view: Note label */}
            {!showSettings && (
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: colorConfig.bg }}>
                  Note
                </span>
                <p className="text-sm text-foreground font-medium leading-tight">{annotation.label}</p>

                {/* Link associations */}
                <div className="pt-2 border-t border-border/30 mt-2">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5 block">Applies to</Label>
                  <LinkSelector
                    links={links}
                    selectedLinkIds={annotation.linkedLinkIds || []}
                    onToggleLink={handleToggleLink}
                  />
                </div>
              </div>
            )}

            {/* Settings panel */}
            {showSettings && (
              <div className="space-y-4">
                {/* Color palette */}
                <div className="space-y-2">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Color</Label>
                  <div className="flex flex-wrap gap-1.5">
                {(Object.keys(MILESTONE_COLORS) as MilestoneColor[]).map((c) => {
                      const isWhite = c === 'white';
                      const isSelected = color === c;
                      return (
                        <button
                          key={c}
                          onClick={() => handleColorSelect(c)}
                          className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110",
                            isSelected && "ring-2 ring-offset-1 ring-offset-card"
                          )}
                          style={{ 
                            backgroundColor: MILESTONE_COLORS[c].bg,
                            borderColor: isWhite ? 'hsl(0 0% 70%)' : 'transparent',
                            ...(isSelected && { '--tw-ring-color': MILESTONE_COLORS[c].bg } as React.CSSProperties),
                          }}
                          title={c.charAt(0).toUpperCase() + c.slice(1)}
                        >
                          {isSelected && (
                            <Check className={cn("w-3 h-3", isWhite || c === 'yellow' ? "text-gray-800" : "text-white")} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Size selector */}
                <div className="space-y-2">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Size</Label>
                  <div className="flex gap-1">
                    {(Object.keys(SIZE_CONFIG) as MilestoneSize[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSizeSelect(s)}
                        className={cn(
                          "flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                          size === s
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {SIZE_CONFIG[s].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Close hint */}
          <div className="px-3 py-1.5 bg-muted/30 border-t border-border/30">
            <span className="text-[9px] text-muted-foreground">
              {showSettings ? 'Click gear to return • ' : ''}Drag bubble to reposition
            </span>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
