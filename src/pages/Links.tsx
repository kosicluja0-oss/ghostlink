import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, Plus } from 'lucide-react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SettingsDrawer } from '@/components/layout/SettingsDrawer';
import { LinkTable } from '@/components/links/LinkTable';
import { CreateLinkModal } from '@/components/links/CreateLinkModal';
import { useLinks } from '@/hooks/useLinks';
import { useAuth } from '@/hooks/useAuth';
import { useOpenTicketsCount } from '@/hooks/useOpenTicketsCount';
import type { TierType } from '@/types';
import { TIERS } from '@/types';
import { Button } from '@/components/ui/button';

const Links = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  const [userTier, setUserTier] = useState<TierType>('pro');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeLinkId, setActiveLinkId] = useState<string | null>(null);
  
  // Use real data hooks
  const { links, addLink, deleteLink } = useLinks();
  const openTicketsCount = useOpenTicketsCount();
  
  const tier = TIERS[userTier];
  const activeLinksCount = links.length;

  // Handle link selection
  const handleLinkSelect = useCallback((linkId: string) => {
    setActiveLinkId(prev => prev === linkId ? null : linkId);
  }, []);

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar
            userEmail={user?.email}
            userTier={userTier}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenDataIntegration={() => navigate('/integrations')}
            onSignOut={signOut}
            openTicketsCount={openTicketsCount}
          />
          
          <SidebarInset className="flex-1">
            <main className="p-4 lg:p-6">
              {/* Header */}
              <section className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                    <Link2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Your Links</h1>
                    <p className="text-sm text-muted-foreground">
                      Create and manage your tracking links
                    </p>
                  </div>
                </div>
              </section>

              {/* Link Management */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {activeLinksCount} of {tier.maxLinks} links active
                    </span>
                  </div>
                  <Button variant="glow" size="sm" onClick={() => setCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    New Link
                  </Button>
                </div>
                
                <LinkTable
                  links={links}
                  userTier={userTier}
                  onDeleteLink={deleteLink}
                  activeLinkId={activeLinkId}
                  onLinkSelect={handleLinkSelect}
                />
              </section>
            </main>
          </SidebarInset>
        </div>

        {/* Modals & Drawers */}
        <SettingsDrawer
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          userTier={userTier}
          onChangeTier={setUserTier}
        />

        <CreateLinkModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onSubmit={addLink}
          userTier={userTier}
          currentLinkCount={activeLinksCount}
          maxLinks={tier.maxLinks}
        />
      </SidebarProvider>
    </TooltipProvider>
  );
};

export default Links;