import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Puzzle, Sparkles } from 'lucide-react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SettingsDrawer } from '@/components/layout/SettingsDrawer';
import { IntegrationCard, type Integration } from '@/components/integrations/IntegrationCard';
import { ConnectServiceModal } from '@/components/integrations/ConnectServiceModal';
import { DeveloperWebhookCard } from '@/components/integrations/DeveloperWebhookCard';
import { useAuth } from '@/hooks/useAuth';
import { useLinks } from '@/hooks/useLinks';
import type { TierType } from '@/types';

// Integration data with logos (using placeholder SVGs for demo)
const INTEGRATIONS: Integration[] = [
  {
    id: 'gumroad',
    name: 'Gumroad',
    description: 'Sell digital products and track sales automatically.',
    logo: 'https://assets.gumroad.com/packs/static/8c2752c01ea70fe3a4cc.svg',
    status: 'not_connected',
    category: 'payment'
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Accept payments and track conversions globally.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg',
    status: 'not_connected',
    category: 'payment'
  },
  {
    id: 'lemonsqueezy',
    name: 'Lemon Squeezy',
    description: 'Digital commerce platform for creators.',
    logo: 'https://www.lemonsqueezy.com/favicon.svg',
    status: 'not_connected',
    category: 'payment'
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'E-commerce platform for online stores.',
    logo: 'https://cdn.shopify.com/s/files/1/0070/7032/files/shopify_logo.svg',
    status: 'not_connected',
    category: 'ecommerce'
  },
];

const Integrations = () => {
  const navigate = useNavigate();
  const { user, session, isLoading: authLoading, signOut } = useAuth();
  const { links } = useLinks();
  
  const [userTier, setUserTier] = useState<TierType>('pro');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>(INTEGRATIONS);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [connectModalOpen, setConnectModalOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/auth');
    }
  }, [authLoading, session, navigate]);

  // Prepare links for dropdown
  const linkOptions = useMemo(() => 
    links
      .filter(l => l.status === 'active')
      .map(l => ({ id: l.id, alias: l.alias })),
    [links]
  );

  const handleConnect = (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    if (integration) {
      setSelectedIntegration(integration);
      setConnectModalOpen(true);
    }
  };

  const handleConfirmConnection = (integrationId: string, _linkId: string | null) => {
    setIntegrations(prev => 
      prev.map(i => 
        i.id === integrationId 
          ? { ...i, status: 'pending' as const }
          : i
      )
    );
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!session) {
    return null;
  }

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const pendingCount = integrations.filter(i => i.status === 'pending').length;

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
          />
          
          <SidebarInset className="flex-1">
            <main className="p-4 lg:p-6 max-w-5xl mx-auto">
              {/* Hero Section */}
              <section className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                    <Puzzle className="w-5 h-5 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground">Data Integrations</h1>
                </div>
                <p className="text-muted-foreground max-w-lg">
                  Connect your favorite tools to track sales automatically. No coding required.
                </p>
                
                {/* Quick Stats */}
                <div className="flex items-center gap-4 mt-4">
                  {connectedCount > 0 && (
                    <div className="flex items-center gap-1.5 text-sm text-success">
                      <span className="w-2 h-2 rounded-full bg-success" />
                      {connectedCount} Active
                    </div>
                  )}
                  {pendingCount > 0 && (
                    <div className="flex items-center gap-1.5 text-sm text-warning">
                      <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                      {pendingCount} Pending verification
                    </div>
                  )}
                </div>
              </section>

              {/* Popular Integrations */}
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Popular Integrations</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {integrations.map(integration => (
                    <IntegrationCard
                      key={integration.id}
                      integration={integration}
                      onConnect={handleConnect}
                    />
                  ))}
                </div>
              </section>

              {/* Developer Section */}
              <section>
                <DeveloperWebhookCard />
              </section>
            </main>
          </SidebarInset>
        </div>

        {/* Modals */}
        <SettingsDrawer
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          userTier={userTier}
          onChangeTier={setUserTier}
        />

        <ConnectServiceModal
          open={connectModalOpen}
          onOpenChange={setConnectModalOpen}
          integration={selectedIntegration}
          links={linkOptions}
          onConfirmConnection={handleConfirmConnection}
        />
      </SidebarProvider>
    </TooltipProvider>
  );
};

export default Integrations;
