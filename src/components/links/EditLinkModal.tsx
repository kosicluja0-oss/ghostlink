import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import type { GhostLink, BridgePageConfig, TierType } from '@/types';
import { TIERS } from '@/types';

interface EditLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link: GhostLink | null;
  userTier: TierType;
  onSave: (id: string, updates: { 
    targetUrl: string;
    hasBridgePage: boolean; 
    bridgePageConfig?: BridgePageConfig 
  }) => Promise<void>;
}

const DEFAULT_BRIDGE_CONFIG: BridgePageConfig = {
  headline: 'You\'re Being Redirected',
  description: 'Please wait while we take you to your destination.',
  ctaText: 'Continue Now',
  delaySeconds: 5,
};

export function EditLinkModal({ 
  open, 
  onOpenChange, 
  link, 
  userTier,
  onSave 
}: EditLinkModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  const [hasBridgePage, setHasBridgePage] = useState(false);
  const [bridgeConfig, setBridgeConfig] = useState<BridgePageConfig>(DEFAULT_BRIDGE_CONFIG);

  const tier = TIERS[userTier];
  const canUseBridgePages = tier.hasBridgePages;

  // Reset form when link changes
  useEffect(() => {
    if (link) {
      setTargetUrl(link.targetUrl);
      setHasBridgePage(link.hasBridgePage);
      setBridgeConfig(link.bridgePageConfig || DEFAULT_BRIDGE_CONFIG);
    }
  }, [link]);

  const handleSave = async () => {
    if (!link) return;
    
    setIsLoading(true);
    try {
      await onSave(link.id, {
        targetUrl,
        hasBridgePage,
        bridgePageConfig: hasBridgePage ? bridgeConfig : undefined,
      });
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!link) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Link</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://example.com/offer"
            />
          </div>

          {/* Bridge Page Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Bridge Page</Label>
              <p className="text-xs text-muted-foreground">
                {canUseBridgePages 
                  ? 'Show an intermediate page before redirecting' 
                  : 'Upgrade to Pro or Business to use bridge pages'}
              </p>
            </div>
            <Switch
              checked={hasBridgePage}
              onCheckedChange={setHasBridgePage}
              disabled={!canUseBridgePages}
            />
          </div>

          {/* Bridge Page Config */}
          {hasBridgePage && canUseBridgePages && (
            <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h4 className="text-sm font-medium">Bridge Page Settings</h4>
              
              <div className="space-y-2">
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  value={bridgeConfig.headline}
                  onChange={(e) => setBridgeConfig(prev => ({ ...prev, headline: e.target.value }))}
                  placeholder="You're Being Redirected"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={bridgeConfig.description}
                  onChange={(e) => setBridgeConfig(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Please wait while we take you to your destination."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ctaText">CTA Button Text</Label>
                <Input
                  id="ctaText"
                  value={bridgeConfig.ctaText}
                  onChange={(e) => setBridgeConfig(prev => ({ ...prev, ctaText: e.target.value }))}
                  placeholder="Continue Now"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Redirect Delay</Label>
                  <span className="text-sm text-muted-foreground">{bridgeConfig.delaySeconds}s</span>
                </div>
                <Slider
                  value={[bridgeConfig.delaySeconds]}
                  onValueChange={([value]) => setBridgeConfig(prev => ({ ...prev, delaySeconds: value }))}
                  min={3}
                  max={15}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
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
