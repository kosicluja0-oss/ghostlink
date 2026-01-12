import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Flag } from 'lucide-react';
import { format } from 'date-fns';

interface AddMilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string | null;
  onAdd: (date: string, label: string) => void;
}

export function AddMilestoneDialog({ open, onOpenChange, date, onAdd }: AddMilestoneDialogProps) {
  const [label, setLabel] = useState('');
  const maxLength = 200;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (date && label.trim()) {
      onAdd(date, label.trim());
      setLabel('');
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setLabel('');
    onOpenChange(false);
  };

  const formattedDate = date ? format(new Date(date), 'MMM d, yyyy') : '';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px] bg-card/95 backdrop-blur-md border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Flag className="w-4 h-4 text-primary" />
            Add Milestone
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
          
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!label.trim()}>
              Add Milestone
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
