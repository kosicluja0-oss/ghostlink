
# Minimalizace GDPR Export sekce

## Cíl
Přesunout GDPR export z velké karty do nenápadného řádku přímo nad "Delete Account" tlačítko - obojí bude vizuálně podobné (ghost buttons).

## Změny

### Odstranění
- Celá "Data & Privacy" Card sekce (velká karta s ikonou, popisem a tlačítkem)

### Přidání
- Malé ghost tlačítko "Download My Data" na stejném řádku nebo těsně nad "Delete Account"
- Vizuálně podobný styl jako Delete Account (ghost, šedý text)

## Výsledný layout

```text
┌─────────────────────────────────────────┐
│         ... ostatní sekce ...           │
│                                         │
│    [Download My Data]  [Delete Account] │
│         (ghost btn)       (ghost btn)   │
└─────────────────────────────────────────┘
```

## Technické detaily

**Soubor:** `src/pages/Settings.tsx`

1. Odstranit Card s Data & Privacy (cca řádky 894-945)
2. Upravit footer div (řádek 1026) aby obsahoval dva ghost buttony vedle sebe:
   - "Download My Data" s ikonou Download
   - "Delete Account" (stávající)

Oba budou mít stejný vizuální styl - nenápadné, šedé, ale funkční pro právní compliance.
