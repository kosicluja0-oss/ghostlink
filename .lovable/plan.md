
# Komplexní Roadmapa: Dashboard, Links & Integrations

## Executive Summary

Tři klíčové stránky aplikace potřebují systematické vylepšení od odstranění mock dat po skutečnou funkcionalitu. Roadmapa je rozdělena do 4 fází s prioritami.

---

## Fáze 1: Čištění a Stabilizace ✅ DOKONČENO

### 1.1 Dashboard - Odstranění fake dat ✅
- ✅ Vytvořen `useTrends` hook pro výpočet reálných trendů
- ✅ Odstraněna `generateSampleData()` funkce
- ✅ Opraven `userTier` state → používá `subscriptionTier`

### 1.2 Links - Reálné sparklines ✅
- ✅ Vytvořeny `useClickHistory` a `useMultipleLinksClickHistory` hooky
- ✅ LinkTable načítá skutečné hourly clicks z databáze

### 1.3 Dashboard - Modularizace ✅
- ✅ COUNTRIES mapping přesunut do `src/lib/countries.ts`

---

## Fáze 2: UX Vylepšení ✅ DOKONČENO

### 2.1 Links - Empty State & Onboarding ✅
- ✅ Vytvořena `LinksEmptyState` komponenta s CTA a feature pills
- ✅ Tlačítka "Create Link" a "Watch Tutorial"
- ✅ Pro tip o Smart Copy funkci

### 2.2 Links - Rozšířené funkce ✅
- ✅ **Sorting:** Klikatelné hlavičky (Clicks, Leads, Sales) s šipkami
- ✅ Výchozí řazení podle data vytvoření (nejnovější první)
- ✅ Zvětšena max výška tabulky na 400px

### 2.3 Dashboard - Activity tabulka ✅
- ✅ Odstraněn fixní max-h → dynamická výška
- ✅ **Pagination:** "Load more" pattern (10 položek, pak načíst další)
- ✅ Reset stránkování při změně filtrů

---

## Fáze 3: Integrations - Skutečná funkcionalita

### 3.1 Persistence připojení
**Problém:** `handleConfirmConnection` pouze nastaví lokální "pending" status.

**Řešení:**
- Vytvořit tabulku `integrations` v databázi
- Ukládat skutečný stav připojení
- Zobrazovat reálný status při načtení stránky

### 3.2 Webhook verifikace
- Endpoint pro testovací ping od služeb
- Automatická změna statusu `pending` → `connected`

### 3.3 Stripe Integration (priorita)
- Propojit s Integrations stránkou
- Zobrazit skutečný stav Stripe subscription

---

## Fáze 4: Advanced Analytics

### 4.1 Per-Link Analytics Detail
Kliknutím na link v tabulce otevřít detail panel s mini-chartem, Top Placements, Top Countries a Conversions funnel.

### 4.2 Export & Reporting
- CSV export pro vybrané období
- Plánované email reporty

### 2.2 Links - Rozšířené funkce
- **Sorting:** Klikatelné hlavičky (Clicks, Leads, Sales, Date)
- **Bulk actions:** Checkbox pro hromadné mazání
- **Per-link detail:** Klik na řádek → slide-out panel s analytikou daného linku

### 2.3 Dashboard - Activity tabulka
**Problém:** Fixní `max-h-[260px]` vytváří nested scrolling.

**Řešení:**
- Dynamická výška podle viewportu
- Lazy loading / virtualizace pro velké datasety
- Pagination nebo "Load more" pattern

---

## Fáze 3: Integrations - Skutečná funkcionalita

### 3.1 Persistence připojení
**Problém:** `handleConfirmConnection` pouze nastaví lokální "pending" status.

**Řešení:**
- Vytvořit tabulku `integrations` v databázi:
  ```sql
  CREATE TABLE integrations (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    service_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    webhook_url TEXT,
    api_key_encrypted TEXT,
    connected_at TIMESTAMPTZ,
    last_sync_at TIMESTAMPTZ
  );
  ```
- Ukládat skutečný stav připojení
- Zobrazovat reálný status při načtení stránky

### 3.2 Webhook verifikace
- Endpoint pro testovací ping od služeb
- Automatická změna statusu `pending` → `connected` po úspěšném pingu
- Notifikace uživateli při úspěšném připojení

### 3.3 Stripe Integration (priorita)
- Již máte edge functions pro Stripe
- Propojit s Integrations stránkou
- Zobrazit skutečný stav Stripe subscription

---

## Fáze 4: Advanced Analytics

### 4.1 Per-Link Analytics Detail
Kliknutím na link v tabulce otevřít detail panel:
```text
┌─────────────────────────────────────────┐
│  ghost.link/ebook                   [X] │
├─────────────────────────────────────────┤
│  Mini-chart (30 dní)                    │
│  ▁▂▄▆█▇▅▃▂▁▃▅▇█▆▄▂▁▃▅▇█              │
├─────────────────────────────────────────┤
│  Top Placements      Top Countries      │
│  IG Story  45%       US  32%           │
│  TT Bio    28%       DE  18%           │
│  YT Shorts 15%       UK  12%           │
├─────────────────────────────────────────┤
│  Conversions funnel                     │
│  Clicks → Leads → Sales                 │
│   1,234     89      23                  │
└─────────────────────────────────────────┘
```

### 4.2 Export & Reporting
- CSV export pro vybrané období
- Plánované email reporty (týdenní/měsíční)

---

## Prioritní matice

| Úkol | Dopad | Náročnost | Priorita |
|------|-------|-----------|----------|
| Odstranit fake trendy v KPI | Vysoký | Nízká | P1 |
| Reálné sparklines | Střední | Střední | P1 |
| Dashboard modularizace | Střední | Nízká | P1 |
| Links empty state | Vysoký | Nízká | P2 |
| Links sorting | Střední | Nízká | P2 |
| Integrations persistence | Vysoký | Střední | P2 |
| Per-link detail panel | Vysoký | Vysoká | P3 |
| Bulk actions | Nízký | Střední | P3 |
| Webhook verifikace | Střední | Vysoká | P4 |

---

## Doporučený postup

**Týden 1:** Fáze 1 - Čištění (fake data, modularizace)
**Týden 2:** Fáze 2.1-2.2 - Links UX
**Týden 3:** Fáze 3.1 - Integrations persistence
**Týden 4:** Fáze 4.1 - Per-link analytics

---

## Technické poznámky

### Nové databázové tabulky potřebné:
1. `integrations` - stav připojení služeb
2. `click_hourly_stats` - agregovaná data pro sparklines (nebo query přímo z clicks)

### Nové hooks potřebné:
1. `useClickHistory(linkId, range)` - pro sparklines
2. `useTrendCalculation(current, previous)` - pro KPI trendy
3. `useIntegrations()` - CRUD pro integrace

### Edge functions potřebné:
1. `verify-webhook` - pro ověření připojení služeb
