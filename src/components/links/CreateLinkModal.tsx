import { useState } from 'react';
import { X, Link2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { GhostLink, TierType } from '@/types';

interface CreateLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (link: Omit<GhostLink, 'id' | 'clicks' | 'leads' | 'sales' | 'earnings' | 'createdAt'>) => void;
  userTier: TierType;
  currentLinkCount: number;
  maxLinks: number;
}

export function CreateLinkModal({ 
  open, 
  onOpenChange, 
  onSubmit, 
  userTier, 
  currentLinkCount, 
  maxLinks 
}: CreateLinkModalProps) {
  const [targetUrl, setTargetUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [hasBridgePage, setHasBridgePage] = useState(false);
  const [errors, setErrors] = useState<{ targetUrl?: string; alias?: string }>({});

  const canCreateLinks = currentLinkCount < maxLinks;
  const canUseBridgePage = userTier !== 'free';

  const validateForm = () => {
    const newErrors: { targetUrl?: string; alias?: string } = {};
    
    if (!targetUrl.trim()) {
      newErrors.targetUrl = 'Target URL is required';
    } else {
      try {
        new URL(targetUrl);
      } catch {
        newErrors.targetUrl = 'Please enter a valid URL';
      }
    }

    if (!alias.trim()) {
      newErrors.alias = 'Alias is required';
    } else if (!/^[a-z0-9-]+$/.test(alias)) {
      newErrors.alias = 'Use only lowercase letters, numbers, and hyphens';
    } else if (alias.length < 3 || alias.length > 30) {
      newErrors.alias = 'Alias must be 3-30 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canCreateLinks) return;
    if (!validateForm()) return;

    onSubmit({
      alias: alias.toLowerCase().trim(),
      targetUrl: targetUrl.trim(),
      hasBridgePage: canUseBridgePage ? hasBridgePage : false,
      status: 'active',
      ...(hasBridgePage && canUseBridgePage && {
        bridgePageConfig: {
          headline: 'You\'re being redirected',
          description: 'Click below to continue',
          ctaText: 'Continue',
          delaySeconds: 3,
        },
      }),
    });

    // Reset form
    setTargetUrl('');
    setAlias('');
    setHasBridgePage(false);
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create New Link</DialogTitle>
        </DialogHeader>

        {!canCreateLinks ? (
          <div className="py-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Link Limit Reached</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You've used {currentLinkCount} of {maxLinks} links on your {userTier} plan.
            </p>
            <Button variant="glow">Upgrade Plan</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Target URL */}
            <div className="space-y-2">
              <Label htmlFor="targetUrl" className="text-sm font-medium text-foreground">
                Target URL
              </Label>
              <Input
                id="targetUrl"
                type="url"
                placeholder="https://example.com/your-affiliate-link"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
              {errors.targetUrl && (
                <p className="text-xs text-destructive">{errors.targetUrl}</p>
              )}
            </div>

            {/* Alias */}
            <div className="space-y-2">
              <Label htmlFor="alias" className="text-sm font-medium text-foreground">
                Custom Alias
              </Label>
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-l-md border border-r-0 border-border">
                  ghost.link/
                </span>
                <Input
                  id="alias"
                  type="text"
                  placeholder="your-brand"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value.toLowerCase())}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground rounded-l-none"
                />
              </div>
              {errors.alias && (
                <p className="text-xs text-destructive">{errors.alias}</p>
              )}
            </div>

            {/* Bridge Page Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-ghost-surface border border-ghost-border-subtle">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded bg-primary/10">
                  <Link2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">Bridge Page</span>
                    {!canUseBridgePage && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        PRO
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Add an intermediate landing page
                  </span>
                </div>
              </div>
              <Switch
                checked={hasBridgePage}
                onCheckedChange={setHasBridgePage}
                disabled={!canUseBridgePage}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="glow" className="flex-1">
                Create Link
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
