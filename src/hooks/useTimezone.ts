import { useMemo } from 'react';
import { useProfile } from './useProfile';
import { formatDate, formatDateTime, formatTime, formatRelative, formatInTimezone, getBrowserTimezone } from '@/lib/timezone';

export function useTimezone() {
  const { profile, isLoading } = useProfile();
  
  // Use profile timezone or fall back to browser's timezone
  const timezone = profile?.timezone || getBrowserTimezone();
  
  // Memoize functions to ensure they update when timezone changes
  const formatters = useMemo(() => ({
    formatDate: (date: Date | string | number) => formatDate(date, timezone),
    formatDateTime: (date: Date | string | number) => formatDateTime(date, timezone),
    formatTime: (date: Date | string | number) => formatTime(date, timezone),
    formatInTimezone: (date: Date | string | number, formatStr: string) => 
      formatInTimezone(date, formatStr, timezone),
  }), [timezone]);
  
  return {
    timezone,
    isLoading,
    ...formatters,
    formatRelative,
  };
}
