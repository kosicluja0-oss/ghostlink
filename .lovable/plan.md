

# Oprava integrací a analytiky -- 3 problémy

## Problem 1: Konverze se nezobrazují v detail panelu ani na overview

### Příčina
RPC funkce `get_link_analytics` seskupuje konverze podle data KLIKU (`DATE(c.created_at)`), ne podle data konverze. Konverze z 17.2. jsou navázané na click z 7.2. -- při filtrování na "7d" nebo "24h" click vypadne z rozsahu a konverze s ním.

### Oprava
Přepsat `get_link_analytics` tak, aby `daily_clicks` CTE používal dvě separátní agregace (clicks + conversions) spojené přes FULL OUTER JOIN -- stejný pattern, jaký už funguje v `get_daily_analytics`:

```text
click_agg:  GROUP BY DATE(c.created_at)   -- clicks podle data kliku
conv_agg:   GROUP BY DATE(cv.created_at)  -- konverze podle data konverze
FULL OUTER JOIN na date
```

Totéž pro `placements` a `countries` sekce -- konverze se musí filtrovat podle `cv.created_at`, ne `c.created_at`.

Funnel sekce zůstane beze změny (počítá celkové sumy, ne denní).

### Soubor
- DB migrace: `ALTER FUNCTION get_link_analytics` s přepsaným SQL

---

## Problem 2: Chybějící realtime refresh

### Příčina
Hook `useLinkAnalytics` nemá žádnou realtime subscription. Po test webhooku se data v detail panelu neaktualizují, dokud nevyprší 5min cache.

Hook `useDashboardData` má realtime subscription na `conversions`, ale s 3s debounce -- a neinvaliduje `link-analytics` query key.

### Oprava

**`src/hooks/useLinkAnalytics.ts`:**
- Přidat realtime subscription na tabulku `conversions` (INSERT event)
- Při nové konverzi invalidovat query cache pro aktuální link

**`src/hooks/useDashboardData.ts`:**
- Rozšířit `invalidateAll` o invalidaci `link-analytics` a `link-recent-activity` query keys
- Snížit debounce z 3s na 1s

---

## Problem 3: Pouze jeden link na integraci

### Příčina
Tabulka `integrations` má sloupec `link_id` (jeden UUID). Nelze přiřadit víc linků jedné integraci.

### Oprava

**Databáze:**
- Vytvořit tabulku `integration_links` (integration_id, link_id) s RLS
- Migrovat existující `integrations.link_id` data do nové tabulky

**`supabase/functions/postback/index.ts`:**
- Místo čtení `integration.link_id` načíst všechny link_id z `integration_links`
- Hledat nejnovější click napříč přiřazenými linky (pokud empty = global mode)

**`src/components/integrations/ManageIntegrationModal.tsx`:**
- Nahradit Select za multi-select s checkboxy
- "All Links (Global)" jako výchozí, jinak výběr konkrétních linků

**`src/hooks/useIntegrations.ts`:**
- Upravit CRUD operace pro novou tabulku

---

## Pořadí implementace

1. DB migrace (nová tabulka + opravená RPC funkce)
2. Postback edge function (multi-link attribution)
3. Frontend hooks (realtime subscriptions)
4. UI (multi-select v Manage modalu)
5. Test end-to-end

## Soubory k úpravě

- DB migrace (SQL): nová tabulka `integration_links`, přepsaná funkce `get_link_analytics`
- `supabase/functions/postback/index.ts` -- multi-link logika
- `src/hooks/useLinkAnalytics.ts` -- realtime subscription
- `src/hooks/useDashboardData.ts` -- rozšířená invalidace
- `src/components/integrations/ManageIntegrationModal.tsx` -- multi-select UI
- `src/hooks/useIntegrations.ts` -- CRUD pro integration_links

