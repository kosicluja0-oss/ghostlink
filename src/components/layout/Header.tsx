import { Ghost, Plus, Settings, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TierType, UserTier } from '@/types';
import { TIERS } from '@/types';

interface HeaderProps {
  userTier: TierType;
  currentLinkCount: number;
  onCreateLink: () => void;
  onOpenSettings: () => void;
}

export function Header({ userTier, currentLinkCount, onCreateLink, onOpenSettings }: HeaderProps) {
  const tier = TIERS[userTier];

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
            <Ghost className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">Ghost Link</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Tier Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-ghost-surface border border-ghost-border-subtle">
            {userTier !== 'free' && <Crown className="h-3.5 w-3.5 text-primary" />}
            <span className="text-xs font-medium text-foreground capitalize">{userTier}</span>
            <span className="text-xs text-muted-foreground">
              {currentLinkCount}/{tier.maxLinks} links
            </span>
          </div>

          {/* Settings */}
          <Button variant="ghost" size="icon" onClick={onOpenSettings}>
            <Settings className="h-4 w-4" />
          </Button>

          {/* Create Link */}
          <Button variant="glow" size="sm" onClick={onCreateLink}>
            <Plus className="h-4 w-4 mr-1" />
            New Link
          </Button>
        </div>
      </div>
    </header>
  );
}
