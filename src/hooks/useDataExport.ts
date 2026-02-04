import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { toast } from 'sonner';

interface ExportedLink {
  alias: string;
  targetUrl: string;
  createdAt: string;
  totalClicks: number;
  totalConversions: number;
  totalEarnings: number;
}

interface DataExport {
  exportedAt: string;
  account: {
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    createdAt: string;
  };
  preferences: {
    currency: string | null;
    timezone: string | null;
    marketingEmails: boolean | null;
    securityAlerts: boolean | null;
  };
  links: ExportedLink[];
  totalStats: {
    links: number;
    clicks: number;
    conversions: number;
    earnings: number;
  };
}

export function useDataExport() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [isExporting, setIsExporting] = useState(false);

  const exportData = async () => {
    if (!user) {
      toast.error('You must be logged in to export data');
      return;
    }

    setIsExporting(true);
    try {
      // Fetch all user's links
      const { data: links, error: linksError } = await supabase
        .from('links')
        .select('id, custom_alias, target_url, created_at')
        .eq('user_id', user.id);

      if (linksError) throw linksError;

      // Fetch all clicks for user's links
      const linkIds = links?.map(l => l.id) || [];
      
      let clicks: { link_id: string; id: string }[] = [];
      let conversions: { click_id: string; value: number }[] = [];

      if (linkIds.length > 0) {
        const { data: clicksData, error: clicksError } = await supabase
          .from('clicks')
          .select('id, link_id')
          .in('link_id', linkIds);

        if (clicksError) throw clicksError;
        clicks = clicksData || [];

        // Fetch conversions for those clicks
        const clickIds = clicks.map(c => c.id);
        if (clickIds.length > 0) {
          const { data: conversionsData, error: conversionsError } = await supabase
            .from('conversions')
            .select('click_id, value')
            .in('click_id', clickIds);

          if (conversionsError) throw conversionsError;
          conversions = conversionsData || [];
        }
      }

      // Aggregate stats per link
      const exportedLinks: ExportedLink[] = (links || []).map(link => {
        const linkClicks = clicks.filter(c => c.link_id === link.id);
        const linkClickIds = linkClicks.map(c => c.id);
        const linkConversions = conversions.filter(c => linkClickIds.includes(c.click_id));
        const earnings = linkConversions.reduce((sum, c) => sum + Number(c.value), 0);

        return {
          alias: link.custom_alias,
          targetUrl: link.target_url,
          createdAt: link.created_at,
          totalClicks: linkClicks.length,
          totalConversions: linkConversions.length,
          totalEarnings: earnings,
        };
      });

      // Calculate totals
      const totalStats = {
        links: exportedLinks.length,
        clicks: clicks.length,
        conversions: conversions.length,
        earnings: conversions.reduce((sum, c) => sum + Number(c.value), 0),
      };

      // Build export object
      const exportData: DataExport = {
        exportedAt: new Date().toISOString(),
        account: {
          email: user.email || '',
          displayName: profile?.display_name || null,
          avatarUrl: profile?.avatar_url || null,
          createdAt: profile?.created_at || user.created_at || '',
        },
        preferences: {
          currency: profile?.currency || null,
          timezone: profile?.timezone || null,
          marketingEmails: profile?.marketing_emails ?? null,
          securityAlerts: profile?.security_alerts ?? null,
        },
        links: exportedLinks,
        totalStats,
      };

      // Generate and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const date = new Date().toISOString().split('T')[0];
      const filename = `ghostlink-data-export-${date}.json`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (error: any) {
      console.error('[DATA-EXPORT] Error:', error);
      toast.error(error.message || 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportData,
    isExporting,
  };
}
