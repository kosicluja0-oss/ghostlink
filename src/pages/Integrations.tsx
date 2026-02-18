import { useState, useMemo, useCallback } from 'react';
import { CreditCard, Users, ShoppingBag, TrendingUp, Zap, Mail, ChevronDown } from 'lucide-react';

// Brand logos
import whopLogo from '@/assets/logos/whop.png';
import hotmartLogo from '@/assets/logos/hotmart.png';
import thrivecartLogo from '@/assets/logos/thrivecart.png';
import samcartLogo from '@/assets/logos/samcart.png';
import clickbankLogo from '@/assets/logos/clickbank.png';
import digistore24Logo from '@/assets/logos/digistore24.png';
import gohighlevelLogo from '@/assets/logos/gohighlevel.png';
import beehiivLogo from '@/assets/logos/beehiiv.png';
import convertkitLogo from '@/assets/logos/convertkit.png';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SettingsDrawer } from '@/components/layout/SettingsDrawer';
import { IntegrationCard, type Integration } from '@/components/integrations/IntegrationCard';
import { ConnectedEcosystemBar } from '@/components/integrations/ConnectedEcosystemBar';
import { IntegrationDetailPanel } from '@/components/integrations/IntegrationDetailPanel';
import { DeveloperWebhookCard } from '@/components/integrations/DeveloperWebhookCard';
import { useAuth } from '@/hooks/useAuth';
import { useLinks } from '@/hooks/useLinks';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';

// Integration data with reliable SimpleIcons CDN logos
const INTEGRATIONS: Integration[] = [
  // Payment Platforms
  { id: 'gumroad', name: 'Gumroad', description: 'Sell digital products and track sales automatically.', logo: 'https://cdn.simpleicons.org/gumroad/FF90E8', status: 'not_connected', category: 'payment' },
  { id: 'stripe', name: 'Stripe', description: 'Accept payments and track conversions globally.', logo: 'https://cdn.simpleicons.org/stripe/635BFF', status: 'not_connected', category: 'payment' },
  { id: 'lemonsqueezy', name: 'Lemon Squeezy', description: 'Digital commerce platform for creators.', logo: 'https://cdn.simpleicons.org/lemonsqueezy/FFC233', status: 'not_connected', category: 'payment' },
  { id: 'paddle', name: 'Paddle', description: 'Complete payments infrastructure for SaaS.', logo: 'https://cdn.simpleicons.org/paddle/FFCC00', status: 'not_connected', category: 'payment' },
  { id: 'paypal', name: 'PayPal', description: 'Global payments platform for any business.', logo: 'https://cdn.simpleicons.org/paypal/003087', status: 'not_connected', category: 'payment' },
  { id: 'whop', name: 'Whop', description: 'Sell digital products, memberships, and courses.', logo: whopLogo, status: 'not_connected', category: 'payment' },
  { id: 'hotmart', name: 'Hotmart', description: 'Digital product marketplace for creators.', logo: hotmartLogo, status: 'not_connected', category: 'payment' },
  { id: 'thrivecart', name: 'ThriveCart', description: 'High-converting checkout pages for digital sales.', logo: thrivecartLogo, status: 'not_connected', category: 'payment' },
  { id: 'samcart', name: 'SamCart', description: 'E-commerce platform for digital creators.', logo: samcartLogo, status: 'not_connected', category: 'payment' },
  // Creator Economy
  { id: 'kofi', name: 'Ko-fi', description: 'Get support from fans and sell products.', logo: 'https://cdn.simpleicons.org/kofi/FF5E5B', status: 'not_connected', category: 'creator' },
  { id: 'patreon', name: 'Patreon', description: 'Membership platform for creators.', logo: 'https://cdn.simpleicons.org/patreon/FF424D', status: 'not_connected', category: 'creator' },
  { id: 'buymeacoffee', name: 'Buy Me a Coffee', description: 'Support creators with one-time tips.', logo: 'https://cdn.simpleicons.org/buymeacoffee/FFDD00', status: 'not_connected', category: 'creator' },
  // E-commerce
  { id: 'shopify', name: 'Shopify', description: 'E-commerce platform for online stores.', logo: 'https://cdn.simpleicons.org/shopify/7AB55C', status: 'not_connected', category: 'ecommerce' },
  { id: 'woocommerce', name: 'WooCommerce', description: 'Open-source e-commerce for WordPress.', logo: 'https://cdn.simpleicons.org/woocommerce/96588A', status: 'not_connected', category: 'ecommerce' },
  // Affiliate Networks
  { id: 'clickbank', name: 'ClickBank', description: 'Leading affiliate marketplace worldwide.', logo: clickbankLogo, status: 'not_connected', category: 'affiliate' },
  { id: 'digistore24', name: 'Digistore24', description: 'European affiliate network for digital products.', logo: digistore24Logo, status: 'not_connected', category: 'affiliate' },
  // Automation
  { id: 'zapier', name: 'Zapier', description: 'Connect apps and automate workflows.', logo: 'https://cdn.simpleicons.org/zapier/FF4A00', status: 'not_connected', category: 'automation' },
  { id: 'make', name: 'Make', description: 'Visual automation platform for any workflow.', logo: 'https://cdn.simpleicons.org/make/6D00CC', status: 'not_connected', category: 'automation' },
  // Marketing & CRM
  { id: 'gohighlevel', name: 'GoHighLevel', description: 'All-in-one marketing platform for agencies.', logo: gohighlevelLogo, status: 'not_connected', category: 'marketing' },
  { id: 'beehiiv', name: 'Beehiiv', description: 'Newsletter platform for growth-focused creators.', logo: beehiivLogo, status: 'not_connected', category: 'marketing' },
  { id: 'convertkit', name: 'ConvertKit', description: 'Email marketing for online creators.', logo: convertkitLogo, status: 'not_connected', category: 'marketing' },
  { id: 'substack', name: 'Substack', description: 'Subscription newsletter publishing platform.', logo: 'https://cdn.simpleicons.org/substack/FF6719', status: 'not_connected', category: 'marketing' },
];

// Category configuration
const CATEGORIES = [
  { id: 'payment', label: 'Payment Platforms', icon: CreditCard, description: 'Connect your payment processors to track sales' },
  { id: 'creator', label: 'Creator Economy', icon: Users, description: 'For content creators and membership platforms' },
  { id: 'ecommerce', label: 'E-commerce', icon: ShoppingBag, description: 'Online store platforms' },
  { id: 'affiliate', label: 'Affiliate Networks', icon: TrendingUp, description: 'Track affiliate commissions and sales' },
  { id: 'automation', label: 'Automation', icon: Zap, description: 'Connect with automation tools' },
  { id: 'marketing', label: 'Marketing & CRM', icon: Mail, description: 'Sync leads and subscribers automatically' },
];

const Integrations = () => {
  const { user, signOut } = useAuth();
  const { links } = useLinks();
  const { tier: userTier } = useSubscription();
  const {
    getIntegrationStatus,
    getIntegration,
    getAssignedLinkIds,
    connect,
    disconnect,
    updateLinks,
    isConnecting,
    isLoading: integrationsLoading,
  } = useIntegrations();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Panel state (replaces modal state)
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<'connect' | 'manage'>('connect');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const linkOptions = useMemo(() =>
    links.filter((l) => l.status === 'active').map((l) => ({ id: l.id, alias: l.alias })),
    [links]
  );

  const integrationsWithStatus = useMemo(() =>
    INTEGRATIONS.map((integration) => ({
      ...integration,
      status: getIntegrationStatus(integration.id),
    })),
    [getIntegrationStatus]
  );

  const groupedIntegrations = useMemo(() => {
    const grouped: Record<string, Integration[]> = {};
    CATEGORIES.forEach((cat) => {
      grouped[cat.id] = integrationsWithStatus.filter((i) => i.category === cat.id);
    });
    return grouped;
  }, [integrationsWithStatus]);

  // Route clicks: connected/pending → Manage panel, not_connected → Connect panel
  const handleConnect = useCallback((integrationId: string) => {
    const integration = integrationsWithStatus.find((i) => i.id === integrationId);
    if (!integration || integration.comingSoon) return;

    // Toggle if same integration clicked
    if (selectedIntegration?.id === integrationId && panelOpen) {
      setPanelOpen(false);
      setSelectedIntegration(null);
      return;
    }

    setSelectedIntegration(integration);
    if (integration.status === 'connected' || integration.status === 'pending') {
      setPanelMode('manage');
    } else {
      setPanelMode('connect');
    }
    setPanelOpen(true);
  }, [integrationsWithStatus, selectedIntegration, panelOpen]);

  const handleClosePanel = useCallback(() => {
    setPanelOpen(false);
    setSelectedIntegration(null);
  }, []);

  const handleConfirmConnection = useCallback(async (integrationId: string, linkId: string | null, webhookToken: string) => {
    try {
      await connect({ serviceId: integrationId, linkId, webhookToken });
      toast.success('Integration connected! Waiting for first event...');
    } catch (error) {
      console.error('Error connecting integration:', error);
      toast.error('Failed to connect integration');
    }
  }, [connect]);

  const handleDisconnect = useCallback(async (serviceId: string) => {
    await disconnect(serviceId);
    handleClosePanel();
  }, [disconnect, handleClosePanel]);

  const handleUpdateLinks = useCallback(async (serviceId: string, linkIds: string[]) => {
    await updateLinks({ serviceId, linkIds });
  }, [updateLinks]);

  const connectedCount = integrationsWithStatus.filter((i) => i.status === 'connected').length;
  const pendingCount = integrationsWithStatus.filter((i) => i.status === 'pending').length;

  const selectedDbIntegration = selectedIntegration ? getIntegration(selectedIntegration.id) : undefined;

  return (
    <TooltipProvider>
      <>
        <div className="h-screen overflow-hidden bg-background">
          <AppSidebar />

          <main className="ml-[15vw] p-4 lg:p-6 h-screen overflow-hidden flex flex-col">
            {/* Header */}
            <section className="mb-6 shrink-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-foreground text-sm font-semibold">Data Integrations</h1>
              </div>
              <div className="flex items-center gap-4">
                {connectedCount > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-success">
                    <span className="w-2 h-2 rounded-full bg-success" />
                    {connectedCount} Active
                  </div>
                )}
                {pendingCount > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-warning">
                    <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                    {pendingCount} Pending
                  </div>
                )}
              </div>
            </section>

            {/* Content + Detail Panel side by side */}
            <div className="flex-1 min-h-0 overflow-hidden flex gap-0">
              {/* Left: Integration cards */}
              <section className="w-[60%] flex flex-col shrink-0 overflow-y-auto pr-2">
                <ConnectedEcosystemBar integrations={integrationsWithStatus} />

                {CATEGORIES.map((category) => {
                  const categoryIntegrations = groupedIntegrations[category.id];
                  if (!categoryIntegrations || categoryIntegrations.length === 0) return null;
                  const Icon = category.icon;
                  const hasComingSoon = categoryIntegrations.some((i) => i.comingSoon);
                  const isExpanded = expandedCategories[category.id];
                  const hasMoreThanThree = categoryIntegrations.length > 3;
                  const visibleIntegrations = hasMoreThanThree && !isExpanded ? categoryIntegrations.slice(0, 3) : categoryIntegrations;
                  const hiddenCount = categoryIntegrations.length - 3;

                  return (
                    <div key={category.id} className="mb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-primary" />
                        <h2 className="text-sm font-semibold text-foreground">{category.label}</h2>
                        {hasComingSoon && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-muted text-muted-foreground">NEW</span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {visibleIntegrations.map((integration) => (
                          <IntegrationCard key={integration.id} integration={integration} onConnect={handleConnect} />
                        ))}
                      </div>

                      {hasMoreThanThree && (
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className="mt-3 flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50 group"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                          <span>{isExpanded ? 'Show less' : `Show ${hiddenCount} more`}</span>
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Developer Section */}
                <div className="mt-4">
                  <DeveloperWebhookCard />
                </div>

                {/* Trademark Disclaimer */}
                <footer className="mt-8 pt-4 border-t border-border mb-4">
                  <p className="text-xs text-muted-foreground/60 text-center">
                    All product names, logos, and brands are property of their respective owners.
                    Ghost Link is not affiliated with or endorsed by any of the above companies.
                  </p>
                </footer>
              </section>

              {/* Right: Inline Detail Panel */}
              <div className={`${panelOpen ? 'w-[50%]' : 'w-0'} transition-all duration-200 overflow-hidden`}>
                <IntegrationDetailPanel
                  open={panelOpen}
                  onClose={handleClosePanel}
                  mode={panelMode}
                  integration={selectedIntegration}
                  dbIntegration={selectedDbIntegration}
                  links={linkOptions}
                  assignedLinkIds={selectedDbIntegration ? getAssignedLinkIds(selectedDbIntegration.id) : []}
                  onConfirmConnection={handleConfirmConnection}
                  onDisconnect={handleDisconnect}
                  onUpdateLinks={handleUpdateLinks}
                />
              </div>
            </div>
          </main>
        </div>

        <SettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} userTier={userTier} onChangeTier={() => {}} />
      </>
    </TooltipProvider>
  );
};

export default Integrations;
