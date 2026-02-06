import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe } from 'lucide-react';
import { CircleFlag } from '@/components/ui/circle-flag';
import { COUNTRIES } from '@/lib/countries';

export interface CountryData {
  code: string;
  count: number;
  percentage: number;
}

interface TopCountriesCardProps {
  countries: CountryData[];
}

export const getCountryInfo = (code: string): { name: string } => {
  const upperCode = code?.toUpperCase() || '';
  if (!upperCode || upperCode === 'XX' || upperCode === 'UNKNOWN') {
    return { name: 'Unknown' };
  }
  return COUNTRIES[upperCode] || { name: code };
};

export const TopCountriesCard = ({ countries }: TopCountriesCardProps) => {
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
          const { name } = getCountryInfo(country.code);
          return (
            <div key={country.code} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CircleFlag code={country.code} size={18} />
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
