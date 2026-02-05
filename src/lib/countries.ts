/**
 * Country data with flags and full names.
 * Used across Dashboard and analytics components.
 */
export const COUNTRIES: Record<string, { flag: string; name: string }> = {
  US: { flag: '🇺🇸', name: 'United States' },
  UK: { flag: '🇬🇧', name: 'United Kingdom' },
  GB: { flag: '🇬🇧', name: 'United Kingdom' }, // Alternative code
  DE: { flag: '🇩🇪', name: 'Germany' },
  FR: { flag: '🇫🇷', name: 'France' },
  CA: { flag: '🇨🇦', name: 'Canada' },
  AU: { flag: '🇦🇺', name: 'Australia' },
  JP: { flag: '🇯🇵', name: 'Japan' },
  BR: { flag: '🇧🇷', name: 'Brazil' },
  ES: { flag: '🇪🇸', name: 'Spain' },
  IT: { flag: '🇮🇹', name: 'Italy' },
  NL: { flag: '🇳🇱', name: 'Netherlands' },
  CZ: { flag: '🇨🇿', name: 'Czechia' },
  SK: { flag: '🇸🇰', name: 'Slovakia' },
  PL: { flag: '🇵🇱', name: 'Poland' },
  AT: { flag: '🇦🇹', name: 'Austria' },
  CH: { flag: '🇨🇭', name: 'Switzerland' },
  SE: { flag: '🇸🇪', name: 'Sweden' },
  NO: { flag: '🇳🇴', name: 'Norway' },
  DK: { flag: '🇩🇰', name: 'Denmark' },
  FI: { flag: '🇫🇮', name: 'Finland' },
  BE: { flag: '🇧🇪', name: 'Belgium' },
  PT: { flag: '🇵🇹', name: 'Portugal' },
  IE: { flag: '🇮🇪', name: 'Ireland' },
  MX: { flag: '🇲🇽', name: 'Mexico' },
  AR: { flag: '🇦🇷', name: 'Argentina' },
  CL: { flag: '🇨🇱', name: 'Chile' },
  CO: { flag: '🇨🇴', name: 'Colombia' },
  IN: { flag: '🇮🇳', name: 'India' },
  CN: { flag: '🇨🇳', name: 'China' },
  KR: { flag: '🇰🇷', name: 'South Korea' },
  SG: { flag: '🇸🇬', name: 'Singapore' },
  HK: { flag: '🇭🇰', name: 'Hong Kong' },
  TW: { flag: '🇹🇼', name: 'Taiwan' },
  NZ: { flag: '🇳🇿', name: 'New Zealand' },
  ZA: { flag: '🇿🇦', name: 'South Africa' },
  RU: { flag: '🇷🇺', name: 'Russia' },
  UA: { flag: '🇺🇦', name: 'Ukraine' },
  TR: { flag: '🇹🇷', name: 'Turkey' },
  IL: { flag: '🇮🇱', name: 'Israel' },
  AE: { flag: '🇦🇪', name: 'United Arab Emirates' },
  SA: { flag: '🇸🇦', name: 'Saudi Arabia' },
  TH: { flag: '🇹🇭', name: 'Thailand' },
  VN: { flag: '🇻🇳', name: 'Vietnam' },
  MY: { flag: '🇲🇾', name: 'Malaysia' },
  ID: { flag: '🇮🇩', name: 'Indonesia' },
  PH: { flag: '🇵🇭', name: 'Philippines' },
};

/**
 * Get country info with fallback for unknown codes
 */
export function getCountryInfo(code: string | null | undefined): { flag: string; name: string } | null {
  if (!code) return null;
  const upperCode = code.toUpperCase();
  return COUNTRIES[upperCode] || null;
}
