import { Ghost, LayoutDashboard, Puzzle, Link2, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar } from
'@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AppSidebarProps {
  onOpenSettings: () => void;
  onOpenDataIntegration: () => void;
}

export function AppSidebar({
  onOpenSettings,
  onOpenDataIntegration,
}: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const navItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    onClick: () => navigate('/dashboard'),
    path: '/dashboard',
    badge: undefined as number | undefined
  },
  {
    title: 'Links',
    icon: Link2,
    onClick: () => navigate('/links'),
    path: '/links',
    badge: undefined as number | undefined
  },
  {
    title: 'Integrations',
    icon: Puzzle,
    onClick: () => navigate('/integrations'),
    path: '/integrations',
    badge: undefined as number | undefined
  },
  {
    title: 'Settings',
    icon: Settings,
    onClick: () => navigate('/settings'),
    path: '/settings',
    badge: undefined as number | undefined
  }];


  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border bg-card/95 backdrop-blur-sm">

      {/* Header with Logo & Toggle */}
      <SidebarHeader className="p-3">
        <div className={cn(
          "flex items-center",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          <div className="flex items-center gap-2">
            <Ghost className="h-6 w-6 text-white flex-shrink-0" />
            {!isCollapsed &&
            <span className="text-base font-bold text-foreground tracking-tight">
                Ghost Link
              </span>
            }
          </div>
          {!isCollapsed &&
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={toggleSidebar}>

              <ChevronLeft className="h-4 w-4" />
            </Button>
          }
        </div>
        {isCollapsed &&
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 mt-2 mx-auto"
          onClick={toggleSidebar}>

            <ChevronRight className="h-4 w-4" />
          </Button>
        }
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
                      )}>

                      {isActive

                      }
                      <div className="relative">
                        <item.icon className={cn(
                          "h-4 w-4 flex-shrink-0",
                          isActive && "text-primary"
                        )} />
                        {isCollapsed && item.badge &&
                        <span className="absolute -top-1.5 -right-1.5 w-2 h-2 bg-destructive rounded-full" />
                        }
                      </div>
                      <span className={cn(
                        "transition-opacity duration-0 flex-1",
                        isCollapsed ? "hidden" : "block"
                      )}>
                        {item.title}
                      </span>
                      {!isCollapsed && item.badge &&
                      <span className="ml-auto bg-destructive text-destructive-foreground text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1.5 font-medium">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      }
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  {isCollapsed &&
                  <TooltipContent side="right">
                      {item.title}
                    </TooltipContent>
                  }
                </Tooltip>
              </SidebarMenuItem>);

          })}
        </SidebarMenu>
      </SidebarContent>

    </Sidebar>);

}