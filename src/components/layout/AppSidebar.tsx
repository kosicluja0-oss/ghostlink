import { Ghost, LayoutDashboard, Puzzle, Link2, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { title: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
  { title: 'Links', icon: Link2, path: '/links' },
  { title: 'Integrations', icon: Puzzle, path: '/integrations' },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed left-0 top-0 h-screen w-16 flex flex-col items-center z-50 py-6">
      {/* Logo at top */}
      <button
        onClick={() => navigate('/dashboard')}
        className="mb-auto"
      >
        <Ghost className="h-6 w-6 text-foreground/80 hover:text-foreground transition-colors" />
      </button>

      {/* Nav icons centered at ~65% from top */}
      <div className="absolute top-[60%] -translate-y-1/2 flex flex-col items-center gap-6">
        {navItems.map((item) => {
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
  );
}
