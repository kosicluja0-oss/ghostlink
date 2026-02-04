
# Upozornění na neuložené změny v Settings

## Popis
Přidáme vizuální indikátor, který uživateli připomene, že provedl změny v profilu nebo preferencích a musí kliknout na "Save Changes" pro jejich uložení.

## Navrhované řešení

### Přístup: Kontextový indikátor u tlačítka Save
Nejlepší UX je zobrazit malé upozornění přímo u tlačítka "Save Changes" - uživatel tak okamžitě vidí, že má neuložené změny a kde je uložit.

### Vizuální návrh
```text
┌─────────────────────────────────────────────┐
│  Profile                                    │
│  ─────────────────────────────────────────  │
│  [Avatar]  Display Name: John              │
│            Email: john@example.com          │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ ● You have unsaved changes          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [ Save Changes ]                           │
└─────────────────────────────────────────────┘
```

## Technická implementace

### Krok 1: Detekce změn
Přidáme computed hodnotu `hasUnsavedChanges` která porovná:
- `displayName` vs `profile.display_name`
- `currency` vs `profile.currency`  
- `timezone` vs `profile.timezone`

```typescript
const hasUnsavedChanges = 
  displayName !== (profile?.display_name || '') ||
  currency !== (profile?.currency || 'usd') ||
  timezone !== (profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
```

### Krok 2: UI komponenta
Zobrazíme malý alert box nad tlačítkem Save s:
- Žlutou/oranžovou barvou (warning)
- Ikonou tečky nebo varování
- Textem "You have unsaved changes"
- Animací fade-in pro plynulý přechod

### Krok 3: Vylepšení tlačítka
Tlačítko "Save Changes" bude:
- Zvýrazněné (primary color) když jsou změny
- Šedé/disabled vzhled když nejsou změny k uložení

## Soubory k úpravě
- `src/pages/Settings.tsx` - přidání detekce změn a UI indikátoru

## Výsledek
Uživatel vždy jasně uvidí:
1. Zda provedl nějaké změny
2. Kde tyto změny uložit
3. Vizuální feedback po úspěšném uložení (zmizení indikátoru)
