import { Crown, Check } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { TierType } from '@/types';
import { TIERS } from '@/types';
import { cn } from '@/lib/utils';

interface SettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userTier: TierType;
  onChangeTier: (tier: TierType) => void;
}

export function SettingsDrawer({ open, onOpenChange, userTier, onChangeTier }: SettingsDrawerProps) {
  const tiers: { type: TierType; features: string[] }[] = [
    { 
      type: 'free', 
      features: ['5 active links', 'Click tracking only', 'Basic analytics'] 
    },
    { 
      type: 'pro', 
      features: ['25 active links', 'Full analytics', 'Bridge pages', 'Priority support'] 
    },
    { 
      type: 'business', 
      features: ['100 active links', 'All PRO features', 'API access', 'Custom branding'] 
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto scrollbar-hide">
        <SheetHeader>
          <SheetTitle className="text-foreground">Settings</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Plan Selection */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Your Plan</h4>
            <div className="space-y-3">
              {tiers.map(({ type, features }) => {
                const tier = TIERS[type];
                const isActive = userTier === type;
                
                return (
                  <button
                    key={type}
                    onClick={() => onChangeTier(type)}
                    className={cn(
                      'w-full p-4 rounded-lg border text-left transition-ghost',
                      isActive 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border bg-ghost-surface hover:bg-ghost-surface-hover'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {type !== 'free' && <Crown className="h-4 w-4 text-primary" />}
                        <span className="font-semibold text-foreground capitalize">{type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {tier.price ? (
                          <span className="text-sm font-medium text-foreground">
                            ${tier.price}/mo
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Free</span>
                        )}
                        {isActive && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                    <ul className="space-y-1">
                      {features.map((feature, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
