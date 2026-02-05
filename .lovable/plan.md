

# Phase 4: Per-Link Analytics Detail Panel

## Co se zmeni

Kliknuti na radek linku v tabulce na strance `/links` otevre bocni panel (Sheet) s detailni analytikou pro dany link. Panel ukazuje:

- Mini KPI pruh (Clicks, Leads, Sales, EPC, CR)
- 30-denni area chart kliku
- Top Placements (odkud prichazi traffic)
- Top Countries (geografie)
- Conversion Funnel (Clicks -> Leads -> Sales)

Zadne zmeny v databazi nejsou potreba -- vsechna data uz existuji v tabulkach `clicks` a `conversions`.

---

## Nove soubory

### 1. `src/hooks/useLinkAnalytics.ts`

Dedikovaný hook, ktery pro zadane `linkId` nacte vsechna data jednim efektivnim dotazem:

- Nacte kliky za poslednich 30 dni (`clicks` tabulka, filtrovano podle `link_id`)
- Nacte konverze pres join s `clicks` tabulkou
- Vypocita:
  - Denni pocty kliku pro area chart (30 datovych bodu)
  - Placement breakdown (top 5) z pole `source` na clicks
  - Country breakdown (top 5) z pole `country` na clicks
  - Funnel stats: celkove kliky, leads, sales, EPC, conversion rate
- Pouzije `@tanstack/react-query` s klicem `['link-analytics', linkId]`
- Maximalne 2 databazove dotazy (clicks + conversions)

### 2. `src/components/links/LinkDetailPanel.tsx`

Hlavni komponenta -- bocni Sheet panel:

- Pouzije existujici `Sheet` komponentu (side="right"), sirsi nez default: `sm:max-w-lg`
- Header: favicon + alias + target URL
- KPI strip: 5 mini stat boxu v radku (Clicks, Leads, Sales, EPC, CR)
- 30-denni area chart (jednoduchy, jen clicks, bez navigatoru)
- Dva sloupce: Top Placements (levy) + Top Countries (pravy)
- Conversion Funnel (spodni cast)
- Pouzije `useLinkAnalytics` hook pro vsechna data
- Skeleton loading stavy pri nacitani

### 3. `src/components/analytics/MiniAreaChart.tsx`

Kompaktni area chart pro detail panel:

- Jedina metrika (clicks) s gradient fillem
- Zadna interaktivita (bez zoomu, bez navigatoru)
- 30-denni casovy rozsah, denni granularita
- Minimalni popisky os (jen datumy)
- Vyska ~120px
- Pouzije stejny gradient styling jako hlavni `AnalyticsChart`
- Jednoduchý Recharts `AreaChart` s `ResponsiveContainer`

### 4. `src/components/analytics/ConversionFunnel.tsx`

Horizontalni funnel vizualizace:

- Tri propojene segmenty: Clicks -> Leads -> Sales
- Kazdy segment ukazuje absolutni cislo a procentualni drop-off
- Barevne kodovani: Primary (clicks), Warning/Yellow (leads), Success/Green (sales)
- Sirka segmentu proporcionalni poctu
- Minimalisticky design odpovidajici zbytku aplikace

---

## Upravene soubory

### 5. `src/pages/Links.tsx`

- Pridat stav `detailLink` (typ `GhostLink | null`) pro otevreny detail panel
- Pridat stav `detailOpen` (boolean)
- Upravit `handleLinkSelect` tak, aby pri kliku nastavil `detailLink` a otevrel Sheet
- Renderovat `LinkDetailPanel` v JSX

### 6. `src/components/links/LinkTable.tsx`

- Pridat novou prop `onOpenDetail?: (link: GhostLink) => void`
- Propagovat ji do `LinkRow`
- V `LinkRow` pri kliku na radek zavolat `onOpenDetail(link)` misto puvodniho `onSelect`
- Zachovat vizualni zvyrazneni vybraneho radku

---

## Technicke detaily

### Data flow

```text
LinkTable (klik na radek)
  -> Links.tsx (setDetailLink + setDetailOpen)
    -> LinkDetailPanel (prijme GhostLink)
      -> useLinkAnalytics(link.id)
        -> Supabase: clicks WHERE link_id = X AND last 30 days
        -> Supabase: conversions JOIN clicks WHERE link_id = X
      -> MiniAreaChart (denni data)
      -> TopPlacementsCard (existujici komponenta, reuse)
      -> TopCountriesCard (existujici komponenta, reuse)
      -> ConversionFunnel (nove)
```

### Reuse existujicich komponent

- `TopPlacementsCard` -- uz existuje, prijima pole placement dat, pouzije se primo
- `TopCountriesCard` -- uz existuje, prijima pole country dat, pouzije se primo
- `parsePlacement()` z `PlacementBadge.tsx` -- pro mapovani `source` parametru na platformu/placement
- `getCountryInfo()` z `countries.ts` -- pro vlajky a nazvy zemi
- `Sheet` + `SheetContent` + `SheetHeader` z UI knihovny

### Pocet databazovych dotazu

Pro kazde otevreni panelu: 2 dotazy
1. `clicks` -- vsechny kliky pro dany link za 30 dni (source, country, created_at)
2. `conversions` -- vsechny konverze pro dany link pres click_id join

Cachovano pres react-query s `staleTime: 5 minut`.

