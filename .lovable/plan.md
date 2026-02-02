
# Admin Tier Switcher - Testování všech plánů

## Přehled
Přidám speciální sekci do Settings stránky, která bude viditelná **pouze pro adminy** a umožní okamžité přepínání mezi všemi tarify (Free, Pro, Business) bez nutnosti platby.

## Co se změní

### 1. Settings stránka (`src/pages/Settings.tsx`)
Přidám novou kartu "Developer Tools" s tier switcherem:
- Viditelná pouze pokud `isAdmin === true`
- Dropdown pro výběr tarifu (Free / Pro / Business)
- Tlačítko "Apply" pro okamžitou změnu
- Barevné označení aktuálního tarifu

### 2. Jak to bude fungovat
```text
┌─────────────────────────────────────┐
│ 🔧 Developer Tools (Admin Only)     │
├─────────────────────────────────────┤
│ Test Tier Switching                 │
│                                     │
│ [  Free  ▼ ] [Apply]                │
│  ○ Free (25 links)                  │
│  ○ Pro (100 links)                  │
│  ○ Business (175 links)             │
│                                     │
│ Current: Business ✓                 │
└─────────────────────────────────────┘
```

### 3. Bezpečnost
- Tier se mění přímo v `profiles` tabulce přes Supabase
- RLS politiky povolují uživateli měnit vlastní profil
- UI sekce je podmíněna `useUserRole().isAdmin`
- Žádné bezpečnostní riziko - admin mění pouze svůj vlastní tier

## Technické detaily

### Import hook
```typescript
import { useUserRole } from '@/hooks/useUserRole';
```

### Podmíněné renderování
```typescript
const { isAdmin } = useUserRole();

{isAdmin && (
  <Card>
    <CardHeader>
      <CardTitle>Developer Tools</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Tier switcher UI */}
    </CardContent>
  </Card>
)}
```

### Změna tarifu
```typescript
const handleTierChange = async (newTier: TierType) => {
  await supabase
    .from('profiles')
    .update({ tier: newTier })
    .eq('id', user.id);
  refetchSubscription();
};
```

## Výsledek
Po implementaci budeš moci:
1. Jít do Settings
2. Vidět sekci "Developer Tools" (pouze ty jako admin)
3. Vybrat libovolný tier a aplikovat
4. Okamžitě testovat všechny funkce daného plánu
