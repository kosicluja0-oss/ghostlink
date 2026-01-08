import { Ghost, Plus, Settings, Crown, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { TierType } from '@/types';
import { TIERS } from '@/types';

interface DashboardHeaderProps {
  userTier: TierType;
  currentLinkCount: number;
  userEmail?: string;
  onCreateLink: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
}

export function DashboardHeader({ 
  userTier, 
  currentLinkCount, 
  userEmail,
  onCreateLink, 
  onOpenSettings,
  onSignOut 
}: DashboardHeaderProps) {
  const tier = TIERS[userTier];
  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : 'U';

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

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/20 text-primary text-sm">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-foreground truncate">{userEmail}</p>
                <p className="text-xs text-muted-foreground capitalize">{userTier} Plan</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onOpenSettings}>
                <User className="h-4 w-4 mr-2" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
