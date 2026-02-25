import { Ghost, LayoutDashboard, Puzzle, Link2, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { title: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
  { title: 'Links', icon: Link2, path: '/links' },
  { title: 'Integrations', icon: Puzzle, path: '/integrations' },
  { title: 'Settings', icon: Settings, path: '/settings' },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      {/* Desktop sidebar - hidden on mobile */}
      <nav className="hidden md:flex fixed left-0 top-0 h-screen w-16 flex-col items-center z-50 py-6">
        {/* Logo at top */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-auto"
        >
          <Ghost className="h-6 w-6 text-foreground/80 hover:text-foreground transition-colors" />
        </button>

        {/* Nav icons centered at ~65% from top */}
        <div className="absolute top-[60%] -translate-y-1/2 flex flex-col items-center gap-6">
          {navItems.slice(0, 3).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Tooltip key={item.title}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-6 w-6" strokeWidth={isActive ? 2.2 : 1.5} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {item.title}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Settings at bottom */}
        <div className="mt-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate('/settings')}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  location.pathname === '/settings'
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Settings className="h-6 w-6" strokeWidth={location.pathname === '/settings' ? 2.2 : 1.5} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Settings
            </TooltipContent>
          </Tooltip>
        </div>
      </nav>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around h-14 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.title}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-0",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.5} />
                <span className="text-[10px] font-medium truncate">{item.title}</span>
              </button>
            );
          })}
        </div>
        {/* Safe area for iOS */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </>
  );
}
