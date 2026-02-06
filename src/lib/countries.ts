/**
 * Country data with names.
 * Used across Dashboard and analytics components.
 * Flags are rendered via the CircleFlag component (circle-flags CDN).
 */
export const COUNTRIES: Record<string, { name: string }> = {
  US: { name: 'United States' },
  UK: { name: 'United Kingdom' },
  GB: { name: 'United Kingdom' },
  DE: { name: 'Germany' },
  FR: { name: 'France' },
  CA: { name: 'Canada' },
  AU: { name: 'Australia' },
  JP: { name: 'Japan' },
  BR: { name: 'Brazil' },
  ES: { name: 'Spain' },
  IT: { name: 'Italy' },
  NL: { name: 'Netherlands' },
  CZ: { name: 'Czechia' },
  SK: { name: 'Slovakia' },
  PL: { name: 'Poland' },
  AT: { name: 'Austria' },
  CH: { name: 'Switzerland' },
  SE: { name: 'Sweden' },
  NO: { name: 'Norway' },
  DK: { name: 'Denmark' },
  FI: { name: 'Finland' },
  BE: { name: 'Belgium' },
  PT: { name: 'Portugal' },
  IE: { name: 'Ireland' },
  GR: { name: 'Greece' },
  MX: { name: 'Mexico' },
  AR: { name: 'Argentina' },
  CL: { name: 'Chile' },
  CO: { name: 'Colombia' },
  PE: { name: 'Peru' },
  IN: { name: 'India' },
  CN: { name: 'China' },
  KR: { name: 'South Korea' },
  SG: { name: 'Singapore' },
  HK: { name: 'Hong Kong' },
  TW: { name: 'Taiwan' },
  NZ: { name: 'New Zealand' },
  ZA: { name: 'South Africa' },
  RU: { name: 'Russia' },
  UA: { name: 'Ukraine' },
  TR: { name: 'Turkey' },
  IL: { name: 'Israel' },
  AE: { name: 'United Arab Emirates' },
  SA: { name: 'Saudi Arabia' },
  TH: { name: 'Thailand' },
  VN: { name: 'Vietnam' },
  MY: { name: 'Malaysia' },
  ID: { name: 'Indonesia' },
  PH: { name: 'Philippines' },
  EG: { name: 'Egypt' },
  NG: { name: 'Nigeria' },
  KE: { name: 'Kenya' },
  RO: { name: 'Romania' },
  HU: { name: 'Hungary' },
  BG: { name: 'Bulgaria' },
  HR: { name: 'Croatia' },
  RS: { name: 'Serbia' },
  SI: { name: 'Slovenia' },
  LT: { name: 'Lithuania' },
  LV: { name: 'Latvia' },
  EE: { name: 'Estonia' },
};

/**
 * Get country name with fallback for unknown codes
 */
export function getCountryInfo(code: string | null | undefined): { name: string } | null {
  if (!code) return null;
  const upperCode = code.toUpperCase();
  return COUNTRIES[upperCode] || null;
}
