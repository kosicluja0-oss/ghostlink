// Get the base URL for tracking links
export function getTrackingBaseUrl(): string {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'mlgrbwkddyrazysxrlvo';
  return `https://${projectId}.supabase.co/functions/v1/redirect`;
}

// Generate a full tracking URL for a link alias
export function getTrackingUrl(alias: string): string {
  return `${getTrackingBaseUrl()}/${alias}`;
}

// Format for display (shorter version)
export function getDisplayUrl(alias: string): string {
  return `ghstlink.com/${alias}`;
}
