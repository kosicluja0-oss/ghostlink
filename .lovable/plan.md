
# Oprava Timezone Implementace

## Identifikované problémy

### 1. AnalyticsChart nepoužívá timezone
Soubor `src/components/analytics/AnalyticsChart.tsx` (řádky 140-174) používá plain `format()` z date-fns místo timezone-aware verze:

```typescript
// PROBLÉM - ignoruje uživatelův timezone
function formatDateForRange(date: Date, range: TimeRange): string {
  return format(date, 'HH:mm'); // Vždy v browser timezone!
}
```

### 2. Query cache nemusí být aktuální
Při změně timezone v Settings a návratu na Dashboard nemusí být profile query dostatečně rychle obnovena.

### 3. Sample data v Dashboard
Vzorová data (řádky 84-180) se generují lokálně a zobrazují se ve špatném timezone.

## Řešení

### Krok 1: Aktualizovat AnalyticsChart
**Soubor:** `src/components/analytics/AnalyticsChart.tsx`

Přidat timezone-aware formátování:
```typescript
import { useTimezone } from '@/hooks/useTimezone';

// V komponentě
const { formatInTimezone, timezone } = useTimezone();

function formatDateForRange(date: Date, range: TimeRange): string {
  switch (range) {
    case '30m':
    case '6h':
    case '1d':
      return formatInTimezone(date, 'HH:mm');
    case '1w':
      return formatInTimezone(date, 'EEE d');
    // ...
  }
}
```

### Krok 2: Přidat explicitní cache invalidaci
**Soubor:** `src/pages/Settings.tsx`

Po uložení timezone invalidovat všechny relevantní queries:
```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const handleTimezoneChange = async (newTimezone: string) => {
  await updateProfile({ timezone: newTimezone });
  // Force refetch všech dat závislých na timezone
  queryClient.invalidateQueries({ queryKey: ['profile'] });
};
```

### Krok 3: Aktualizovat useTimezone hook
**Soubor:** `src/hooks/useTimezone.ts`

Odstranit problematický useMemo a přidat debug logging:
```typescript
export function useTimezone() {
  const { profile, isLoading } = useProfile();
  const timezone = profile?.timezone || getBrowserTimezone();
  
  // Vytvořit funkce přímo (bez memoizace pro spolehlivost)
  return {
    timezone,
    isLoading,
    formatDate: (date: Date | string | number) => formatDate(date, timezone),
    formatDateTime: (date: Date | string | number) => formatDateTime(date, timezone),
    formatTime: (date: Date | string | number) => formatTime(date, timezone),
    formatInTimezone: (date: Date | string | number, formatStr: string) => 
      formatInTimezone(date, formatStr, timezone),
    formatRelative,
  };
}
```

### Krok 4: Přidat timezone indikátor do Dashboard
Pro lepší UX přidat malý indikátor aktuálního timezone:
```typescript
<span className="text-xs text-muted-foreground">
  Časy zobrazeny v {getTimezoneLabel(timezone)}
</span>
```

## Soubory k úpravě
1. `src/hooks/useTimezone.ts` - odstranit useMemo
2. `src/components/analytics/AnalyticsChart.tsx` - přidat timezone formátování
3. `src/pages/Settings.tsx` - přidat cache invalidaci
4. `src/pages/Dashboard.tsx` - přidat timezone indikátor (volitelné)

## Testování
Po implementaci:
1. Změnit timezone v Settings na jiný (např. Tokyo)
2. Přejít na Dashboard
3. Ověřit že časy v tabulce Recent Activity jsou v novém timezone
4. Ověřit že tooltip na grafu zobrazuje správný čas
