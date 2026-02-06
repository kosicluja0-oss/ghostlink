import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, Plus } from 'lucide-react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SettingsDrawer } from '@/components/layout/SettingsDrawer';
import { LinkTable } from '@/components/links/LinkTable';
import { CreateLinkModal } from '@/components/links/CreateLinkModal';
import { EditLinkModal } from '@/components/links/EditLinkModal';
import { LinkDetailPanel } from '@/components/links/LinkDetailPanel';
import { useLinks } from '@/hooks/useLinks';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useOpenTicketsCount } from '@/hooks/useOpenTicketsCount';
import type { GhostLink } from '@/types';
import { TIERS } from '@/types';
import { Button } from '@/components/ui/button';
const Links = () => {
  const navigate = useNavigate();
  const {
    user,
    signOut
  } = useAuth();
  const {
    tier: userTier
  } = useSubscription();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<GhostLink | null>(null);
  const [activeLinkId, setActiveLinkId] = useState<string | null>(null);
  const [detailLink, setDetailLink] = useState<GhostLink | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Use real data hooks
  const {
    links,
    addLink,
    updateLink,
    deleteLink
  } = useLinks();
  const openTicketsCount = useOpenTicketsCount();
  const tier = TIERS[userTier];
  const activeLinksCount = links.length;

  // Handle link selection
  const handleLinkSelect = useCallback((linkId: string) => {
    setActiveLinkId(prev => prev === linkId ? null : linkId);
  }, []);
  const handleOpenDetail = useCallback((link: GhostLink) => {
    setDetailLink(link);
    setDetailOpen(true);
    setActiveLinkId(link.id);
  }, []);
  const handleEditLink = useCallback((link: GhostLink) => {
    setEditingLink(link);
    setEditModalOpen(true);
  }, []);
  const handleSaveLink = useCallback(async (id: string, updates: {
    targetUrl: string;
  }) => {
    await updateLink(id, updates);
  }, [updateLink]);
  return <TooltipProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar userEmail={user?.email} userTier={userTier} onOpenSettings={() => setSettingsOpen(true)} onOpenDataIntegration={() => navigate('/integrations')} onSignOut={signOut} openTicketsCount={openTicketsCount} />
          
          <SidebarInset className="flex-1">
            <main className="p-4 lg:p-6">
              {/* Header */}
              <section className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  
                  <div>
                    <h1 className="text-foreground font-semibold text-sm">Your Links</h1>
                    <p className="text-sm text-muted-foreground">
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
                
                <LinkTable links={links} userTier={userTier} onDeleteLink={deleteLink} onEditLink={handleEditLink} activeLinkId={activeLinkId} onLinkSelect={handleLinkSelect} onOpenDetail={handleOpenDetail} onCreateLink={() => setCreateModalOpen(true)} />
              </section>
            </main>
          </SidebarInset>
        </div>

        {/* Modals & Drawers */}
        <SettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} userTier={userTier} onChangeTier={() => {}} />

        <CreateLinkModal open={createModalOpen} onOpenChange={setCreateModalOpen} onSubmit={addLink} userTier={userTier} currentLinkCount={activeLinksCount} maxLinks={tier.maxLinks} />

        <EditLinkModal open={editModalOpen} onOpenChange={setEditModalOpen} link={editingLink} userTier={userTier} onSave={handleSaveLink} />

        <LinkDetailPanel link={detailLink} open={detailOpen} onOpenChange={setDetailOpen} />
      </SidebarProvider>
    </TooltipProvider>;
};
export default Links;