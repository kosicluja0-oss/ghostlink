import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Puzzle, CreditCard, Users, ShoppingBag, TrendingUp, Zap } from 'lucide-react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SettingsDrawer } from '@/components/layout/SettingsDrawer';
import { IntegrationCard, type Integration } from '@/components/integrations/IntegrationCard';
import { ConnectServiceModal } from '@/components/integrations/ConnectServiceModal';
import { DeveloperWebhookCard } from '@/components/integrations/DeveloperWebhookCard';
import { useAuth } from '@/hooks/useAuth';
import { useLinks } from '@/hooks/useLinks';
import { useOpenTicketsCount } from '@/hooks/useOpenTicketsCount';
import type { TierType } from '@/types';

// Integration data with reliable SimpleIcons CDN logos
const INTEGRATIONS: Integration[] = [
  // Payment Platforms
  {
    id: 'gumroad',
    name: 'Gumroad',
    description: 'Sell digital products and track sales automatically.',
    logo: 'https://cdn.simpleicons.org/gumroad/FF90E8',
    status: 'not_connected',
    category: 'payment'
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Accept payments and track conversions globally.',
    logo: 'https://cdn.simpleicons.org/stripe/635BFF',
    status: 'not_connected',
    category: 'payment'
  },
  {
    id: 'lemonsqueezy',
    name: 'Lemon Squeezy',
    description: 'Digital commerce platform for creators.',
    logo: 'https://cdn.simpleicons.org/lemonsqueezy/FFC233',
    status: 'not_connected',
    category: 'payment'
  },
  {
    id: 'paddle',
    name: 'Paddle',
    description: 'Complete payments infrastructure for SaaS.',
    logo: 'https://cdn.simpleicons.org/paddle/FFCC00',
    status: 'not_connected',
    category: 'payment'
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Global payments platform for any business.',
    logo: 'https://cdn.simpleicons.org/paypal/003087',
    status: 'not_connected',
    category: 'payment'
  },
  // Creator Economy
  {
    id: 'kofi',
    name: 'Ko-fi',
    description: 'Get support from fans and sell products.',
    logo: 'https://cdn.simpleicons.org/kofi/FF5E5B',
    status: 'not_connected',
    category: 'creator'
  },
  {
    id: 'patreon',
    name: 'Patreon',
    description: 'Membership platform for creators.',
    logo: 'https://cdn.simpleicons.org/patreon/FF424D',
    status: 'not_connected',
    category: 'creator'
  },
  {
    id: 'buymeacoffee',
    name: 'Buy Me a Coffee',
    description: 'Support creators with one-time tips.',
    logo: 'https://cdn.simpleicons.org/buymeacoffee/FFDD00',
    status: 'not_connected',
    category: 'creator'
  },
  // E-commerce
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'E-commerce platform for online stores.',
    logo: 'https://cdn.simpleicons.org/shopify/7AB55C',
    status: 'not_connected',
    category: 'ecommerce'
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'Open-source e-commerce for WordPress.',
    logo: 'https://cdn.simpleicons.org/woocommerce/96588A',
    status: 'not_connected',
    category: 'ecommerce'
  },
  // Affiliate Networks
  {
    id: 'clickbank',
    name: 'ClickBank',
    description: 'Leading affiliate marketplace worldwide.',
    logo: 'https://cdn.simpleicons.org/clickup/7B68EE',
    status: 'not_connected',
    category: 'affiliate'
  },
  {
    id: 'digistore24',
    name: 'Digistore24',
    description: 'European affiliate network for digital products.',
    logo: 'https://cdn.simpleicons.org/docusign/FFCC00',
    status: 'not_connected',
    category: 'affiliate'
  },
  // Automation
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect apps and automate workflows.',
    logo: 'https://cdn.simpleicons.org/zapier/FF4A00',
    status: 'not_connected',
    category: 'automation'
  },
  {
    id: 'make',
    name: 'Make',
    description: 'Visual automation platform for any workflow.',
    logo: 'https://cdn.simpleicons.org/make/6D00CC',
    status: 'not_connected',
    category: 'automation'
  },
];

// Category configuration
const CATEGORIES = [
  { 
    id: 'payment', 
    label: 'Payment Platforms', 
    icon: CreditCard,
    description: 'Connect your payment processors to track sales'
  },
  { 
    id: 'creator', 
    label: 'Creator Economy', 
    icon: Users,
    description: 'For content creators and membership platforms'
  },
  { 
    id: 'ecommerce', 
    label: 'E-commerce', 
    icon: ShoppingBag,
    description: 'Online store platforms'
  },
  { 
    id: 'affiliate', 
    label: 'Affiliate Networks', 
    icon: TrendingUp,
    description: 'Track affiliate commissions and sales'
  },
  { 
    id: 'automation', 
    label: 'Automation', 
    icon: Zap,
    description: 'Connect with automation tools'
  },
];

const Integrations = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { links } = useLinks();
  const openTicketsCount = useOpenTicketsCount();
  
  const [userTier, setUserTier] = useState<TierType>('pro');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>(INTEGRATIONS);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [connectModalOpen, setConnectModalOpen] = useState(false);

  // Prepare links for dropdown
  const linkOptions = useMemo(() => 
    links
      .filter(l => l.status === 'active')
      .map(l => ({ id: l.id, alias: l.alias })),
    [links]
  );

  // Group integrations by category
  const groupedIntegrations = useMemo(() => {
    const grouped: Record<string, Integration[]> = {};
    CATEGORIES.forEach(cat => {
      grouped[cat.id] = integrations.filter(i => i.category === cat.id);
    });
    return grouped;
  }, [integrations]);

  const handleConnect = (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    if (integration && !integration.comingSoon) {
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
            openTicketsCount={openTicketsCount}
          />
          
          <SidebarInset className="flex-1">
            <main className="p-4 lg:p-6 max-w-6xl mx-auto">
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

              {/* Integration Categories */}
              {CATEGORIES.map(category => {
                const categoryIntegrations = groupedIntegrations[category.id];
                if (!categoryIntegrations || categoryIntegrations.length === 0) return null;

                const Icon = category.icon;
                const hasComingSoon = categoryIntegrations.some(i => i.comingSoon);

                return (
                  <section key={category.id} className="mb-8">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-primary" />
                      <h2 className="text-sm font-semibold text-foreground">{category.label}</h2>
                      {hasComingSoon && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-muted text-muted-foreground">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">{category.description}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {categoryIntegrations.map(integration => (
                        <IntegrationCard
                          key={integration.id}
                          integration={integration}
                          onConnect={handleConnect}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}

              {/* Developer Section */}
              <section className="mt-10">
                <DeveloperWebhookCard />
              </section>

              {/* Trademark Disclaimer */}
              <footer className="mt-12 pt-6 border-t border-border">
                <p className="text-xs text-muted-foreground/60 text-center">
                  All product names, logos, and brands are property of their respective owners. 
                  Ghost Link is not affiliated with or endorsed by any of the above companies.
                </p>
              </footer>
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
