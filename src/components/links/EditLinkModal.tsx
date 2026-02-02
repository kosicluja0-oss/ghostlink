import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Link2, ArrowRight } from 'lucide-react';
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

// Bridge Page Preview Component
function BridgePagePreview({ config }: { config: BridgePageConfig }) {
  return (
    <div className="relative rounded-lg overflow-hidden border border-border bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] p-6 min-h-[280px] flex items-center justify-center">
      {/* Preview Badge */}
      <div className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary font-medium">
        PREVIEW
      </div>
      
      <div className="text-center max-w-[280px] animate-fade-in">
        {/* Icon */}
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)]">
          <Link2 className="w-6 h-6 text-white" />
        </div>
        
        {/* Headline */}
        <h3 className="text-lg font-bold mb-2 bg-gradient-to-r from-white to-primary/80 bg-clip-text text-transparent">
          {config.headline || 'Your Headline'}
        </h3>
        
        {/* Description */}
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          {config.description || 'Your description text'}
        </p>
        
        {/* Countdown */}
        <p className="text-[10px] text-slate-500 mb-3">
          Redirecting in <span className="font-semibold text-purple-400">{config.delaySeconds}</span> seconds...
        </p>
        
        {/* Progress Bar */}
        <div className="w-full h-1 bg-white/10 rounded-full mb-4 overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-primary to-purple-500 rounded-full" />
        </div>
        
        {/* CTA Button */}
        <button className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-purple-500 rounded-lg shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:shadow-[0_6px_30px_rgba(99,102,241,0.5)] transition-all">
          {config.ctaText || 'Continue'}
          <ArrowRight className="w-4 h-4" />
        </button>
        
        {/* Footer */}
        <p className="mt-6 text-[9px] text-slate-600">
          Powered by <span className="text-primary">Ghost Link</span>
        </p>
      </div>
    </div>
  );
}

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
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Link</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          {/* Left: Form */}
          <div className="space-y-5">
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

          {/* Right: Preview */}
          <div className="space-y-3">
            <Label className="text-muted-foreground">Live Preview</Label>
            {hasBridgePage && canUseBridgePages ? (
              <BridgePagePreview config={bridgeConfig} />
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 min-h-[280px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Link2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">
                    {canUseBridgePages 
                      ? 'Enable Bridge Page to see preview' 
                      : 'Upgrade to Pro to use Bridge Pages'}
                  </p>
                </div>
              </div>
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
