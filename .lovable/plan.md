
# Fáze 3: Integrations - Persistence a Skutečná Funkcionalita

## Přehled

Tato fáze zavede databázovou persistenci pro integrace třetích stran a propojí existující Stripe subscription stav s UI. Stripe bude speciální případ - využije existující data z `profiles` tabulky.

---

## 3.1 Databázová tabulka pro integrace

### SQL Migrace

```sql
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  webhook_url TEXT,
  config JSONB DEFAULT '{}',
  connected_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, service_id)
);

-- RLS politiky
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own integrations"
  ON public.integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations"
  ON public.integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
  ON public.integrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations"
  ON public.integrations FOR DELETE
  USING (auth.uid() = user_id);
```

**Sloupce:**
- `service_id` - identifikátor služby (např. "gumroad", "discord", "zapier")
- `status` - stav připojení: `pending` | `connected` | `error`
- `webhook_url` - vygenerovaná URL pro danou integraci
- `config` - JSONB pro dodatečná nastavení (API klíče, channel IDs apod.)
- `last_verified_at` - poslední úspěšný ping/verifikace

---

## 3.2 Hook: useIntegrations()

### Nový soubor: `src/hooks/useIntegrations.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';

export type IntegrationStatus = 'not_connected' | 'pending' | 'connected' | 'error';

export interface UserIntegration {
  id: string;
  serviceId: string;
  status: IntegrationStatus;
  webhookUrl: string | null;
  config: Record<string, unknown>;
  connectedAt: string | null;
  lastVerifiedAt: string | null;
}

export function useIntegrations() {
  const { user } = useAuth();
  const { isSubscribed, tier } = useSubscription();
  const queryClient = useQueryClient();

  // Fetch user's integrations from database
  const { data: dbIntegrations, isLoading } = useQuery({
    queryKey: ['integrations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user!.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Get integration status for a service (including Stripe special case)
  const getIntegrationStatus = (serviceId: string): IntegrationStatus => {
    // Special case: Stripe uses subscription data from profiles
    if (serviceId === 'stripe') {
      return isSubscribed ? 'connected' : 'not_connected';
    }
    
    const integration = dbIntegrations?.find(i => i.service_id === serviceId);
    return (integration?.status as IntegrationStatus) || 'not_connected';
  };

  // Connect a new integration
  const connectMutation = useMutation({
    mutationFn: async ({ serviceId, config }: { serviceId: string; config?: Record<string, unknown> }) => {
      const webhookUrl = generateWebhookUrl(serviceId, user!.id);
      
      const { data, error } = await supabase
        .from('integrations')
        .upsert({
          user_id: user!.id,
          service_id: serviceId,
          status: 'pending',
          webhook_url: webhookUrl,
          config: config || {},
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  // Disconnect an integration
  const disconnectMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('user_id', user!.id)
        .eq('service_id', serviceId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  return {
    integrations: dbIntegrations || [],
    isLoading,
    getIntegrationStatus,
    connect: connectMutation.mutate,
    disconnect: disconnectMutation.mutate,
    isConnecting: connectMutation.isPending,
    // Stripe-specific data
    stripeConnected: isSubscribed,
    stripeTier: tier,
  };
}

// Generate unique webhook URL for each service
function generateWebhookUrl(serviceId: string, userId: string): string {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  return `https://${projectId}.supabase.co/functions/v1/postback?source=${serviceId}&user_id=${userId}`;
}
```

---

## 3.3 Úprava Integrations stránky

### Změny v `src/pages/Integrations.tsx`

```typescript
// Import nového hooku
import { useIntegrations } from '@/hooks/useIntegrations';
import { useSubscription } from '@/hooks/useSubscription';

const Integrations = () => {
  // Nové hooky
  const { 
    getIntegrationStatus, 
    connect, 
    disconnect,
    isLoading: integrationsLoading 
  } = useIntegrations();
  
  const { tier, isSubscribed } = useSubscription();

  // Dynamicky přiřadit status z databáze/subscription
  const integrationsWithStatus = useMemo(() => {
    return INTEGRATIONS.map(integration => ({
      ...integration,
      status: getIntegrationStatus(integration.id),
    }));
  }, [getIntegrationStatus, INTEGRATIONS]);

  // Handler pro connect - speciální logika pro Stripe
  const handleConnect = (integrationId: string) => {
    if (integrationId === 'stripe') {
      // Přesměrovat na ceník nebo billing portal
      if (isSubscribed) {
        openCustomerPortal(); // Existující funkce
      } else {
        navigate('/settings'); // Nebo modal s plány
      }
      return;
    }
    
    // Pro ostatní služby - otevřít modal
    const integration = integrationsWithStatus.find(i => i.id === integrationId);
    if (integration) {
      setSelectedIntegration(integration);
      setConnectModalOpen(true);
    }
  };

  // Handler po potvrzení v modalu - uložit do DB
  const handleConfirmConnection = async (integrationId: string, _linkId: string | null) => {
    await connect({ serviceId: integrationId });
  };
};
```

---

## 3.4 Vizuální úpravy IntegrationCard pro Stripe

### Speciální zobrazení pro Stripe kartu:

Když je Stripe `connected`:
- Zobrazit aktuální tier (Pro/Business) jako badge
- Tlačítko "Manage" místo "Connect"
- Zelený glow efekt (již implementováno)

Když není connected:
- Tlačítko "Upgrade" s přesměrováním na plány

---

## Souhrn změn

| Soubor | Akce |
|--------|------|
| `supabase/migrations/xxx_create_integrations.sql` | Nový - tabulka + RLS |
| `src/hooks/useIntegrations.ts` | Nový - CRUD hook |
| `src/pages/Integrations.tsx` | Upravit - použít hook, dynamické statusy |
| `src/components/integrations/IntegrationCard.tsx` | Upravit - speciální UI pro Stripe |
| `src/integrations/supabase/types.ts` | Auto-generováno po migraci |

---

## Poznámky k implementaci

1. **Stripe je výjimka** - neukládá se do `integrations` tabulky, využívá existující `profiles.subscription_status`

2. **Webhook URL generování** - každá integrace dostane unikátní URL s `source` parametrem pro identifikaci služby

3. **Verifikace** - bod 3.2 z původní roadmapy (webhook ping) bude implementován ve Fázi 4, protože vyžaduje edge function pro každou službu
