import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { GhostLink } from '@/types';

interface EditLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link: GhostLink | null;
  userTier: string;
  onSave: (id: string, updates: { targetUrl: string }) => Promise<void>;
}

export function EditLinkModal({ 
  open, 
  onOpenChange, 
  link, 
  onSave 
}: EditLinkModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  const [error, setError] = useState('');

  // Reset form when link changes
  useEffect(() => {
    if (link) {
      setTargetUrl(link.targetUrl);
      setError('');
    }
  }, [link]);

  const handleSave = async () => {
    if (!link) return;
    
    // Validate URL
    if (!targetUrl.trim()) {
      setError('Target URL is required');
      return;
    }
    
    try {
      new URL(targetUrl);
    } catch {
      setError('Please enter a valid URL');
      return;
    }
    
    setIsLoading(true);
    try {
      await onSave(link.id, { targetUrl });
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!link) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Link</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Alias (read-only) */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Alias</Label>
            <Input 
              value={link.alias} 
              disabled 
              className="bg-muted/50"
            />
            <p className="text-xs text-muted-foreground">Alias cannot be changed after creation</p>
          </div>

          {/* Target URL */}
          <div className="space-y-2">
            <Label htmlFor="targetUrl">Target URL</Label>
            <Input
              id="targetUrl"
              value={targetUrl}
              onChange={(e) => {
                setTargetUrl(e.target.value);
                setError('');
              }}
              placeholder="https://example.com/offer"
            />
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
