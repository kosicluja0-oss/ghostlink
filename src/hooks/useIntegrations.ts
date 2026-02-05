import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';

export type IntegrationStatus = 'not_connected' | 'pending' | 'connected' | 'error';

export interface UserIntegration {
  id: string;
  user_id: string;
  service_id: string;
  status: IntegrationStatus;
  webhook_url: string | null;
  config: Record<string, unknown>;
  connected_at: string | null;
  last_verified_at: string | null;
  created_at: string;
}

// Generate unique webhook URL for each service
function generateWebhookUrl(serviceId: string, userId: string): string {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  return `https://${projectId}.supabase.co/functions/v1/postback?source=${serviceId}&user_id=${userId}`;
}

// Helper to execute raw queries on the integrations table
async function queryIntegrations(
  userId: string,
  method: 'select' | 'upsert' | 'update' | 'delete',
  options?: {
    serviceId?: string;
    data?: Record<string, unknown>;
    returnData?: boolean;
  }
): Promise<{ data: UserIntegration[] | UserIntegration | null; error: Error | null }> {
  const client = supabase as unknown as {
    from: (table: string) => {
      select: (columns?: string) => { eq: (col: string, val: string) => Promise<{ data: unknown; error: Error | null }> };
      upsert: (data: unknown, opts?: unknown) => { select: () => { single: () => Promise<{ data: unknown; error: Error | null }> } };
      update: (data: unknown) => { eq: (col: string, val: string) => { eq: (col2: string, val2: string) => { select: () => { single: () => Promise<{ data: unknown; error: Error | null }> } } } };
      delete: () => { eq: (col: string, val: string) => { eq: (col2: string, val2: string) => Promise<{ error: Error | null }> } };
    };
  };

  try {
    if (method === 'select') {
      const result = await client.from('integrations').select('*').eq('user_id', userId);
      return { data: result.data as UserIntegration[], error: result.error };
    }
    
    if (method === 'upsert' && options?.data) {
      const result = await client.from('integrations')
        .upsert(options.data, { onConflict: 'user_id,service_id' })
        .select()
        .single();
      return { data: result.data as UserIntegration, error: result.error };
    }
    
    if (method === 'update' && options?.serviceId && options?.data) {
      const result = await client.from('integrations')
        .update(options.data)
        .eq('user_id', userId)
        .eq('service_id', options.serviceId)
        .select()
        .single();
      return { data: result.data as UserIntegration, error: result.error };
    }
    
    if (method === 'delete' && options?.serviceId) {
      const result = await client.from('integrations')
        .delete()
        .eq('user_id', userId)
        .eq('service_id', options.serviceId);
      return { data: null, error: result.error };
    }
    
    return { data: null, error: new Error('Invalid method') };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

export function useIntegrations() {
  const { user } = useAuth();
  const { isSubscribed, tier } = useSubscription();
  const queryClient = useQueryClient();

  // Fetch user's integrations from database
  const { data: dbIntegrations, isLoading } = useQuery({
    queryKey: ['integrations', user?.id],
    queryFn: async (): Promise<UserIntegration[]> => {
      const { data, error } = await queryIntegrations(user!.id, 'select');
      if (error) throw error;
      return (data as UserIntegration[]) || [];
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

  // Get full integration data for a service
  const getIntegration = (serviceId: string): UserIntegration | undefined => {
    return dbIntegrations?.find(i => i.service_id === serviceId);
  };

  // Connect a new integration
  const connectMutation = useMutation({
    mutationFn: async ({ serviceId, config }: { serviceId: string; config?: Record<string, unknown> }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const webhookUrl = generateWebhookUrl(serviceId, user.id);
      
      const { data, error } = await queryIntegrations(user.id, 'upsert', {
        data: {
          user_id: user.id,
          service_id: serviceId,
          status: 'pending',
          webhook_url: webhookUrl,
          config: config || {},
        }
      });
      
      if (error) throw error;
      return data as UserIntegration;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  // Update integration status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ serviceId, status }: { serviceId: string; status: IntegrationStatus }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const updateData: Record<string, unknown> = { status };
      if (status === 'connected') {
        updateData.connected_at = new Date().toISOString();
        updateData.last_verified_at = new Date().toISOString();
      }
      
      const { data, error } = await queryIntegrations(user.id, 'update', {
        serviceId,
        data: updateData
      });
      
      if (error) throw error;
      return data as UserIntegration;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  // Disconnect an integration
  const disconnectMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await queryIntegrations(user.id, 'delete', { serviceId });
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
    getIntegration,
    connect: connectMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    disconnect: disconnectMutation.mutateAsync,
    isConnecting: connectMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
    // Stripe-specific data
    stripeConnected: isSubscribed,
    stripeTier: tier,
  };
}
