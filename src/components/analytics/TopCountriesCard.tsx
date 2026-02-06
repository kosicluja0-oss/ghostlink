import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe } from 'lucide-react';

// Country data with flags and full names
const COUNTRIES: Record<string, { flag: string; name: string }> = {
  US: { flag: '🇺🇸', name: 'United States' },
  GB: { flag: '🇬🇧', name: 'United Kingdom' },
  UK: { flag: '🇬🇧', name: 'United Kingdom' },
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
  PL: { flag: '🇵🇱', name: 'Poland' },
  SK: { flag: '🇸🇰', name: 'Slovakia' },
  AT: { flag: '🇦🇹', name: 'Austria' },
  CH: { flag: '🇨🇭', name: 'Switzerland' },
  BE: { flag: '🇧🇪', name: 'Belgium' },
  SE: { flag: '🇸🇪', name: 'Sweden' },
  NO: { flag: '🇳🇴', name: 'Norway' },
  DK: { flag: '🇩🇰', name: 'Denmark' },
  FI: { flag: '🇫🇮', name: 'Finland' },
  IE: { flag: '🇮🇪', name: 'Ireland' },
  PT: { flag: '🇵🇹', name: 'Portugal' },
  GR: { flag: '🇬🇷', name: 'Greece' },
  RU: { flag: '🇷🇺', name: 'Russia' },
  UA: { flag: '🇺🇦', name: 'Ukraine' },
  IN: { flag: '🇮🇳', name: 'India' },
  CN: { flag: '🇨🇳', name: 'China' },
  KR: { flag: '🇰🇷', name: 'South Korea' },
  MX: { flag: '🇲🇽', name: 'Mexico' },
  AR: { flag: '🇦🇷', name: 'Argentina' },
  ZA: { flag: '🇿🇦', name: 'South Africa' },
  AE: { flag: '🇦🇪', name: 'UAE' },
  SG: { flag: '🇸🇬', name: 'Singapore' },
  HK: { flag: '🇭🇰', name: 'Hong Kong' },
  NZ: { flag: '🇳🇿', name: 'New Zealand' },
  PH: { flag: '🇵🇭', name: 'Philippines' },
  ID: { flag: '🇮🇩', name: 'Indonesia' },
  TH: { flag: '🇹🇭', name: 'Thailand' },
  MY: { flag: '🇲🇾', name: 'Malaysia' },
  VN: { flag: '🇻🇳', name: 'Vietnam' },
  TR: { flag: '🇹🇷', name: 'Turkey' },
  IL: { flag: '🇮🇱', name: 'Israel' },
  SA: { flag: '🇸🇦', name: 'Saudi Arabia' },
  EG: { flag: '🇪🇬', name: 'Egypt' },
  NG: { flag: '🇳🇬', name: 'Nigeria' },
  KE: { flag: '🇰🇪', name: 'Kenya' },
  CL: { flag: '🇨🇱', name: 'Chile' },
  CO: { flag: '🇨🇴', name: 'Colombia' },
  PE: { flag: '🇵🇪', name: 'Peru' },
  RO: { flag: '🇷🇴', name: 'Romania' },
  HU: { flag: '🇭🇺', name: 'Hungary' },
  BG: { flag: '🇧🇬', name: 'Bulgaria' },
  HR: { flag: '🇭🇷', name: 'Croatia' },
  RS: { flag: '🇷🇸', name: 'Serbia' },
  SI: { flag: '🇸🇮', name: 'Slovenia' },
  LT: { flag: '🇱🇹', name: 'Lithuania' },
  LV: { flag: '🇱🇻', name: 'Latvia' },
  EE: { flag: '🇪🇪', name: 'Estonia' },
};

export interface CountryData {
  code: string;
  count: number;
  percentage: number;
}

interface TopCountriesCardProps {
  countries: CountryData[];
}

export const getCountryInfo = (code: string): { flag: string; name: string } => {
  const upperCode = code?.toUpperCase() || '';
  if (!upperCode || upperCode === 'XX' || upperCode === 'UNKNOWN') {
    return { flag: '🌍', name: 'Unknown' };
  }
  return COUNTRIES[upperCode] || { flag: '🌍', name: code };
};

export const TopCountriesCard = ({ countries }: TopCountriesCardProps) => {
  // Get top 5 countries
  const topCountries = countries.slice(0, 5);

  if (topCountries.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground">
            <Globe className="w-4 h-4 text-primary" />
            Top Countries
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">No country data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground">
          <Globe className="w-4 h-4 text-primary" />
          Top Countries
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {topCountries.map((country) => {
          const { flag, name } = getCountryInfo(country.code);
          return (
            <div key={country.code} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{flag}</span>
                  <span className="text-foreground font-medium">{name}</span>
                </div>
                <span className="text-muted-foreground font-mono">{country.percentage}%</span>
              </div>
              <Progress 
                value={country.percentage} 
                className="h-1.5 bg-muted"
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
