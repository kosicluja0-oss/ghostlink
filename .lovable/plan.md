

# Oprava Overview dashboardu -- 3 problémy

## Problem 1: Top Placements ukazuje "Direct" víckrát

### Příčina
Databáze obsahuje zdroje ve dvou formátech:
- **Shortcode placements** (z tracking URL parametru `?s=`): `ig-reels`, `tt-video`, `yt-shorts` -- ty `parsePlacement()` správně rozpozná
- **Generic sources** (z mockovaných/starých dat): `instagram`, `email`, `tiktok`, `google`, `facebook` -- ty `parsePlacement()` NEZNÁ, vrátí `null`, a UI je zobrazí jako "Direct"
- Navíc `source = NULL` a `source = 'direct'` jsou v DB dva různé řádky

Výsledek: 3+ řádků "Direct" s různými hodnotami.

### Oprava

**`get_traffic_distribution` RPC funkce** -- sjednotit zdroje na úrovni SQL:
- Sloučit `NULL` a `'direct'` do jedné skupiny
- Namapovat generické názvy (`instagram`, `facebook` atd.) na odpovídající platformy přímo v SQL, aby se nesloučily pod "direct"

**`parsePlacement()` v `PlacementBadge.tsx`** -- rozšířit mapu o generické názvy:
- Přidat `instagram` -> `{ platform: 'instagram', placement: 'Instagram' }`
- Přidat `facebook`, `tiktok`, `youtube`, `twitter`, `google`, `email`, `reddit`, `newsletter`
- Zachovat existující shortcodes beze změny

**Dashboard.tsx `placementAnalytics`** -- po rozpoznání agregovat duplicity:
- Seskupit řádky se stejným `platform + placement` a sečíst metriky

---

## Problem 2: CR graf zkreslený test webhooky

### Příčina
Test webhooky vytvářejí reálné konverze (leads/sales) v databázi. Na dnech s málo kliky to způsobuje extrémní CR skoky (1400%+).

### Oprava -- mazání testovacích dat

**Postback Edge Function**: Označit testovací konverze přidáním pole do tabulky conversions:
- Přidat sloupec `is_test` (boolean, default false) do tabulky `conversions`
- Když postback přijme `event: 'test'` nebo `source: 'ghost_link_test'`, nastavit `is_test = true`

**ManageIntegrationModal.tsx**: Po úspěšném test webhooku zobrazit tlačítko "Delete test data":
- Nová funkce pro smazání testovacích konverzí (a příslušných clicků)
- Informační text pod Test Webhook tlačítkem: "Test data will appear in your dashboard. You can delete it after testing."

**RPC funkce**: Vyfiltrovat `is_test = true` konverze ze všech analytických dotazů:
- `get_user_stats`, `get_daily_analytics`, `get_traffic_distribution`, `get_link_analytics`, `get_recent_activity`

---

## Problem 3: Placements a Countries nereagují na time range

### Příčina
`get_traffic_distribution` je ALL-TIME agregace bez parametru pro časový filtr. Widgety Top Countries a Top Placements na Overview vždy ukazují celkovou historii, i když je vybrán "1 day" nebo "1 week".

### Oprava
Přidat parametr `p_days` do `get_traffic_distribution` RPC a předat ho z frontendu na základě zvoleného time range.

---

## Technické detaily

### DB migrace
```text
1. ALTER TABLE conversions ADD COLUMN is_test boolean DEFAULT false;
2. UPDATE conversions SET is_test = true 
   WHERE click_id IN (SELECT id FROM clicks WHERE source = 'ghost_link_test');
3. Přepsat get_traffic_distribution s p_days parametrem + COALESCE pro source sjednocení
4. Přidat WHERE is_test = false do všech analytických RPC funkcí
5. Přidat RLS policy pro DELETE na conversions (vlastník linku)
```

### PlacementBadge.tsx
Rozšířit PLACEMENT_MAP o:
```text
'instagram' -> { platform: 'instagram', placement: 'Instagram' }
'facebook'  -> { platform: 'facebook', placement: 'Facebook' }
'tiktok'    -> { platform: 'tiktok', placement: 'TikTok' }
'youtube'   -> { platform: 'youtube', placement: 'YouTube' }
'twitter'   -> { platform: 'x', placement: 'X / Twitter' }
'google'    -> { platform: 'google', placement: 'Google' }
'email'     -> { platform: 'email', placement: 'Email' }
'reddit'    -> { platform: 'reddit', placement: 'Reddit' }
'newsletter'-> { platform: 'email', placement: 'Newsletter' }
```

### Dashboard.tsx
- V `placementAnalytics` useMemo přidat agregaci duplicit (GROUP BY platform+placement, SUM metrik)
- Předat `timeRange` do `useDashboardData` a použít v `get_traffic_distribution`

### ManageIntegrationModal.tsx
- Pod Test Webhook tlačítko přidat varování: "Test events create real data. Delete after testing."
- Po úspěšném testu zobrazit "Delete test data" tlačítko
- Delete funkce: smaže conversions WHERE is_test = true pro danou integraci

### Postback Edge Function
- Detekovat test event (`event === 'test'` nebo `source === 'ghost_link_test'`)
- Při insertu konverze nastavit `is_test = true`

---

## Soubory k úpravě

1. **DB migrace** -- nový sloupec, opravené RPC funkce, RLS pro delete
2. `supabase/functions/postback/index.ts` -- označení testovacích konverzí
3. `src/components/analytics/PlacementBadge.tsx` -- rozšíření PLACEMENT_MAP
4. `src/pages/Dashboard.tsx` -- agregace duplicit, time range pro distribuce
5. `src/hooks/useDashboardData.ts` -- p_days parametr pro distribuce
6. `src/components/integrations/ManageIntegrationModal.tsx` -- delete test data UI

## Pořadí implementace

1. DB migrace (sloupec + RPC opravy)
2. Postback (is_test flag)
3. PlacementBadge (rozšířená mapa)
4. Dashboard + hooks (agregace, time range)
5. ManageIntegrationModal (delete test data)

