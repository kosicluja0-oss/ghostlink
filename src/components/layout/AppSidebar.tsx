import { Ghost, LayoutDashboard, Puzzle, Database, Settings, LogOut, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { TierType } from '@/types';

interface AppSidebarProps {
  userEmail?: string;
  userTier: TierType;
  onOpenSettings: () => void;
  onOpenDataIntegration: () => void;
  onSignOut: () => void;
}

export function AppSidebar({
  userEmail,
  userTier,
  onOpenSettings,
  onOpenDataIntegration,
  onSignOut,
}: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : 'U';

  const navItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      onClick: () => navigate('/dashboard'),
      path: '/dashboard',
    },
    {
      title: 'Data & Leads',
      icon: Database,
      onClick: () => navigate('/transactions'),
      path: '/transactions',
    },
    {
      title: 'Integrations',
      icon: Puzzle,
      onClick: () => navigate('/integrations'),
      path: '/integrations',
    },
    {
      title: 'Support',
      icon: HelpCircle,
      onClick: () => navigate('/support'),
      path: '/support',
    },
    {
      title: 'Settings',
      icon: Settings,
      onClick: () => navigate('/settings'),
      path: '/settings',
    },
  ];

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border bg-card/95 backdrop-blur-sm"
    >
      {/* Header with Logo & Toggle */}
      <SidebarHeader className="p-3">
        <div className={cn(
          "flex items-center",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          <div className="flex items-center gap-2">
            <Ghost className="h-6 w-6 text-white flex-shrink-0" />
            {!isCollapsed && (
              <span className="text-base font-bold text-foreground tracking-tight">
                Ghost Link
              </span>
            )}
          </div>
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={toggleSidebar}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
        {isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 mt-2 mx-auto"
            onClick={toggleSidebar}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </SidebarHeader>

      <SidebarSeparator />

      {/* Main Navigation */}
      <SidebarContent className="px-2 py-3">
        <SidebarMenu>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <SidebarMenuItem key={item.title}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      onClick={item.onClick}
                      isActive={isActive}
                      className={cn(
                        "transition-ghost relative",
                        isActive && "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r" />
                      )}
                      <item.icon className={cn(
                        "h-4 w-4 flex-shrink-0",
                        isActive && "text-primary"
                      )} />
                      <span className={cn(
                        "transition-opacity duration-0",
                        isCollapsed ? "hidden" : "block"
                      )}>
                        {item.title}
                      </span>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      {item.title}
                    </TooltipContent>
                  )}
                </Tooltip>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer with User Profile */}
      <SidebarFooter className="p-2">
        <SidebarSeparator className="mb-2" />
        <div className={cn(
          "flex items-center p-2 rounded-lg bg-ghost-surface",
          isCollapsed ? "justify-center" : "gap-2"
        )}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="h-8 w-8 flex-shrink-0 cursor-pointer">
                <AvatarFallback className="bg-primary/20 text-primary text-sm">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                {userEmail}
              </TooltipContent>
            )}
          </Tooltip>
          {!isCollapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate max-w-[100px]">
                  {userEmail}
                </p>
                <p className="text-[10px] text-muted-foreground capitalize">
                  {userTier} Plan
                </p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={onSignOut}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Sign Out
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
