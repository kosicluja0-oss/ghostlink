import { format as dateFnsFormat, formatDistanceToNow } from 'date-fns';
import { toZonedTime, format as tzFormat } from 'date-fns-tz';

// Common timezones grouped by region
export const TIMEZONES = [
  // Americas
  { value: 'America/New_York', label: 'New York (EST/EDT)', region: 'Americas' },
  { value: 'America/Chicago', label: 'Chicago (CST/CDT)', region: 'Americas' },
  { value: 'America/Denver', label: 'Denver (MST/MDT)', region: 'Americas' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)', region: 'Americas' },
  { value: 'America/Toronto', label: 'Toronto (EST/EDT)', region: 'Americas' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)', region: 'Americas' },
  
  // Europe
  { value: 'Europe/London', label: 'London (GMT/BST)', region: 'Europe' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Prague', label: 'Prague (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Rome', label: 'Rome (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)', region: 'Europe' },
  
  // Asia & Pacific
  { value: 'Asia/Dubai', label: 'Dubai (GST)', region: 'Asia/Pacific' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)', region: 'Asia/Pacific' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)', region: 'Asia/Pacific' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', region: 'Asia/Pacific' },
  { value: 'Asia/Seoul', label: 'Seoul (KST)', region: 'Asia/Pacific' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)', region: 'Asia/Pacific' },
  { value: 'Asia/Kolkata', label: 'Mumbai (IST)', region: 'Asia/Pacific' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)', region: 'Asia/Pacific' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)', region: 'Asia/Pacific' },
  
  // UTC
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', region: 'UTC' },
] as const;

export type TimezoneValue = typeof TIMEZONES[number]['value'];

// Group timezones by region
export const TIMEZONE_GROUPS = TIMEZONES.reduce((acc, tz) => {
  if (!acc[tz.region]) {
    acc[tz.region] = [];
  }
  acc[tz.region].push(tz);
  return acc;
}, {} as Record<string, typeof TIMEZONES[number][]>);

// Get timezone label by value
export function getTimezoneLabel(value: string): string {
  const tz = TIMEZONES.find(t => t.value === value);
  return tz?.label || value;
}

// Format a date in user's timezone
export function formatInTimezone(
  date: Date | string | number,
  formatStr: string,
  timezone: string
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const zonedDate = toZonedTime(d, timezone);
  return tzFormat(zonedDate, formatStr, { timeZone: timezone });
}

// Format date for display (common formats)
export function formatDate(date: Date | string | number, timezone: string): string {
  return formatInTimezone(date, 'd MMM yyyy', timezone);
}

export function formatDateTime(date: Date | string | number, timezone: string): string {
  return formatInTimezone(date, 'd MMM yyyy, HH:mm', timezone);
}

export function formatTime(date: Date | string | number, timezone: string): string {
  return formatInTimezone(date, 'HH:mm', timezone);
}

export function formatRelative(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

// Get browser's default timezone
export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
