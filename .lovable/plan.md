
# Odstraneni "Show all" tlacitek z Top karet

## Co se zmeni

Ze tri karet (Top Links, Top Placements, Top Countries) se odstrani:
- State `showAll` a jeho setter
- Import `ChevronDown` a `ChevronUp` ikon (pokud se nepouzivaji jinde)
- Tlacitko "Show all / Show less" a jeho podminkove renderovani
- Promenna `hasMore`
- Podminkove tridy pro scrollovani (`overflow-y-auto max-h-[240px]`)

Zobrazovat se bude vzdy jen prvnich 5 polozek (`.slice(0, 5)`).

## Dotcene soubory

1. **`src/components/analytics/TopLinksCard.tsx`**
   - Odebrat `useState` pro `showAll`
   - Odebrat import `ChevronDown`, `ChevronUp`, `Button`
   - `topLinks` = `allSorted.slice(0, 5)` (bez podminky)
   - Odebrat `hasMore`
   - Odebrat tlacitko "Show all/Show less"
   - Odebrat tridu `overflow-y-auto max-h-[240px]` z kontejneru

2. **`src/components/analytics/TopPlacementsCard.tsx`**
   - Stejna uprava jako TopLinksCard

3. **`src/components/analytics/TopCountriesCard.tsx`**
   - Stejna uprava jako TopLinksCard (pouze v list view casti)

## Co se NEMENI

- Zadna jina logika, styling, props ani struktura karet
- Heat mapa zustava beze zmeny
- Razeni a vypocty metrik zustavaji beze zmeny
