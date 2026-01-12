import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Flag, Check } from 'lucide-react';
import { format } from 'date-fns';
import { type MilestoneColor, type MilestoneSize, MILESTONE_COLORS, SIZE_CONFIG } from './ChartAnnotation';
import { cn } from '@/lib/utils';

interface AddMilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string | null;
  onAdd: (date: string, label: string, color: MilestoneColor, size: MilestoneSize) => void;
}

const COLOR_OPTIONS: { value: MilestoneColor; label: string }[] = [
  { value: 'teal', label: 'Teal' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'purple', label: 'Purple' },
  { value: 'pink', label: 'Pink' },
  { value: 'orange', label: 'Orange' },
  { value: 'white', label: 'White' },
];

const SIZE_OPTIONS: { value: MilestoneSize; label: string }[] = [
  { value: 'small', label: 'S' },
  { value: 'medium', label: 'M' },
  { value: 'large', label: 'L' },
];

export function AddMilestoneDialog({ open, onOpenChange, date, onAdd }: AddMilestoneDialogProps) {
  const [label, setLabel] = useState('');
  const [selectedColor, setSelectedColor] = useState<MilestoneColor>('teal');
  const [selectedSize, setSelectedSize] = useState<MilestoneSize>('medium');
  const maxLength = 200;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (date && label.trim()) {
      onAdd(date, label.trim(), selectedColor, selectedSize);
      setLabel('');
      setSelectedColor('teal');
      setSelectedSize('medium');
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setLabel('');
    setSelectedColor('teal');
    setSelectedSize('medium');
    onOpenChange(false);
  };

  const formattedDate = date ? format(new Date(date), 'MMM d, yyyy') : '';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px] bg-card/95 backdrop-blur-md border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Flag className="w-4 h-4 text-primary" />
            Add Note
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Date:</span>
              <span className="font-medium text-foreground">{formattedDate}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="milestone-label" className="text-foreground">
              Note
            </Label>
            <Input
              id="milestone-label"
              value={label}
              onChange={(e) => setLabel(e.target.value.slice(0, maxLength))}
              placeholder="e.g., Started New Campaign"
              className="bg-background/50 border-border/50 focus:border-primary/50"
              autoFocus
            />
            <div className="flex justify-end">
              <span className="text-[10px] text-muted-foreground">
                {label.length}/{maxLength}
              </span>
            </div>
          </div>
          
          {/* Size Selector */}
          <div className="space-y-2">
            <Label className="text-foreground">Size</Label>
            <div className="flex gap-1">
              {SIZE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedSize(option.value)}
                  className={cn(
                    "flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    selectedSize === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Color Picker */}
          <div className="space-y-2">
            <Label className="text-foreground">Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((option) => {
                const colorConfig = MILESTONE_COLORS[option.value];
                const isSelected = selectedColor === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedColor(option.value)}
                    className={cn(
                      "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                      "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
                      isSelected ? "ring-2 ring-offset-2 ring-offset-background" : "border-transparent"
                    )}
                    style={{ 
                      backgroundColor: colorConfig.bg,
                      borderColor: isSelected ? colorConfig.border : 'transparent',
                      boxShadow: isSelected ? `0 0 8px ${colorConfig.bg}66` : undefined
                    }}
                    title={option.label}
                  >
                    {isSelected && (
                      <Check className={cn(
                        "w-3.5 h-3.5",
                        option.value === 'white' ? "text-gray-800" : "text-white"
                      )} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!label.trim()}>
              Add Note
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
