

# Komplexni hodnoceni: Dashboard, Links, Integrations

## 1. Funkcni spolehlivost -- Shrnuti

### Kliky (Clicks) -- Funkcni, ale s limitem
- Redirect Edge Function spolehlive zachytava kazdy klik (302 redirect + DB insert)
- Realtime subscriptions zajistuji live aktualizace bez refreshe
- **Problem**: `useClicksRealtime` stahuje vsechny kliky bez limitu. Supabase ma default limit 1000 radku -- u aktivnich uctu s tisici kliky se data usekou a metriky budou chybne

### Leady a Sales -- Funkcni, atribuce zjednodusena
- Postback Edge Function spravne podporuje Token Mode (pro integrace) i Click ID Mode (pro vyvojare)
- Token Mode atribuuje konverzi k "poslednimu kliku" daneho linku -- to funguje pro vetsinu use-cases, ale pri vysokem trafficu muze priradit konverzi nespravnemu kliku
- Detekce typu (lead vs sale) je chytra: parsuje payload, hleda klicova slova, a defaultuje na "sale" pokud je hodnota > 0

### Geolokace -- Funkcni, risk u rate-limitu
- Redirect funkce pouziva free `ip-api.com` API pro detekci zeme
- 67 zemi ma vlajky a nazvy, ostatni se zobrazi jako "Unknown"
- **Risk**: ip-api.com ma rate limit (45 req/min na free tieru). Pri spicce trafficu muze blokovat pozadavky a zeme zustane prazdna

### Placement / Social site / Druh postu -- Plne funkcni
- 13 kombinaci v PLACEMENT_MAP (Instagram Story/Reels/Bio/Post, TikTok Video/Story/Bio, YouTube Video/Shorts/Bio, Pinterest, X Post/Bio)
- Data se zachytavaji automaticky pres Smart Copy URL parametr `?s=ig-story`
- End-to-end chain: Smart Copy -> Redirect Edge Function -> DB `source` column -> Dashboard widget

---

## 2. Vizualni nedostatky a navrhy vylepseni

### A) Dashboard -- Hlavni analyticky hub

**Aktualni stav**: Funkcni, ale vizualne "plochy". KPI karty, chart s navigatorem, Top Placements/Countries widgety, a Recent Activity tabulka.

**Navrhy**:

1. **KPI karty -- chybi Revenue karta**: Momentalne 5 karet (Clicks, Leads, Sales, CR, EPC), ale chybi celkovy Revenue/Earnings. Pro business uzivatele je to nejdulezitejsi metrika. Navrh: nahradit jednu z mene dulezitych (napr. CR nebo EPC -- ty jsou uz v Activity summary stripu) kartou "Total Revenue" se success barvou a dollar ikonou.

2. **Dashboard nema page header**: Kazda dalsi stranka (Links, Integrations) ma konzistentni header s ikonou + nadpisem + popisem. Dashboard skoci rovnou na KPI karty -- chybi identita stranky. Navrh: pridat jednoduchy "Dashboard" header s LayoutDashboard ikonou a "Your performance at a glance" popiskem pro konzistenci.

3. **Chart + widgety layout**: Na sirokem monitoru je chart jen 3/5 sirky a widgety Top Placements a Top Countries zabirajikazdy 1/5. Na desktopu jsou widgety zbytecne uzke. Navrh: zvysit pomer chartu na 3/5 a widgety sloucit do 2/5 (jeden sloupec, vertikalne).

4. **Recent Activity tabulka -- "Customer" column generic data**: U kliku se zobrazi "Link clicked" a u konverzi "Purchase completed" / "New subscriber" -- to jsou staticke texty, ne realna jmena. Tabulka vizualne psobí, jako by mela realna zakaznicka data, ale data jsou placeholdery. Navrh: zmenit na transparentnejsi labeling, napr. zobrazit link alias misto generickych popisu.

5. **Summary strip nad tabulkou**: Revenue, Sales a CR se pocitaji z `filteredTransactions`, ale KPI karty nahore z `analyticsData`. Tyto dva zdroje nemuseji byt synchronizovane (jiny scope). Navrh: sjednotit datovy zdroj.

### B) Links -- Management hub

**Aktualni stav**: Cista tabulka s favicon, alias, target URL, sparkline, clicks/leads/sales, Smart Copy a akce. Detail panel (Phase 4) otevre bocni Sheet.

**Navrhy**:

6. **Links page -- vizualne chude**: Pouze nadpis, pocitadlo linku, tlacitko "New Link" a tabulka. Zadne KPI, zadna segmentace. Navrh: pridat maly summary strip nad tabulku (celkove kliky, celkove earnings, celkove linky) jako rychly prehled.

7. **LinkTable max-height omezeni**: Tabulka ma `max-h-[400px]` s overflowem -- na vetsich monitorech to zanechava hodne prazdneho mista pod tabulkou. Navrh: dynamicka vyska tabulky pomoci `max-h-[calc(100vh-250px)]` nebo podobne.

8. **Detail panel -- chybi akce**: LinkDetailPanel zobrazuje analytiku, ale nenabizi zadne akce (editace URL, Smart Copy, smazani). Uzivatel musi zavrít panel, najit link v tabulce, a kliknout na dropdown. Navrh: pridat akcni tlacitka primo do headeru panelu.

9. **Sparklines v tabulce**: Momentalne zobrazuji 24h historii. Pro linky s nizkym trafficem je to casto rovná cara na nule. Navrh: zvysit na 7 dni pro informativnejsi zobrazeni.

### C) Integrations -- Marketplace

**Aktualni stav**: Kategorizovane karty s logy, status indikatory (Live/Pending), ConnectServiceModal se step-by-step instrukcemi. Funkcni a vizualne nejpropracovanejsi stranka.

**Navrhy**:

10. **Chybejici Manage modal**: Kliknuti na "Manage" u pripojene integrace otevre znovu Connect modal misto dedikovaného Manage view. Uzivatel nemuze vidět webhook URL, prirazeny link, ani integration manualne odpojit. Toto je kriticky chybejici flow. Navrh: novy `ManageIntegrationModal` se statusem, webhook URL (kopirovatelne), prirazenym linkem (zmenitelny), a "Disconnect" tlacitkem.

11. **Karty zabírají hodne mista**: Kazda karta je pomerne vysoka (logo + nazev + popis + status + tlacitko). Pri 25+ integracích se stranka hodne protahne. Navrh: kompaktnejsi layout s mensimi kartami, nebo seznam/tabulka misto grid.

12. **Connected Ecosystem Bar**: Jiz existuje a zobrazuje se pri aktivni integraci, ale nema interaktivitu -- kliknuti na logo nedela nic. Navrh: kliknuti na logo v baru otevre Manage modal pro danou integraci.

---

## 3. Technicke problemy ke sledovani

### Kriticke

- **1000-row limit**: `useClicksRealtime` nacita vsechny kliky bez paginace. Po 1000 kliknich se data orezes a dashboard metriky budou nespravne. Reseni: agregovat data na serveru (DB view/function) nebo pridat paginaci.

- **useLinks N+1 queries**: `useLinks` provadi pro kazdy link 3 separatni dotazy (count, click IDs, conversions). Pri 50 linkach = 150 DB dotazu. Reseni: single SQL dotaz s JOINy nebo DB view.

### Stredni

- **ip-api.com rate limit**: Free tier ma 45 req/min. Alternativa: pouzit Cloudflare headers (`cf-ipcountry`) pokud je k dispozici, nebo jiny geolocation service.

- **Duplicitni realtime channels**: `useClicksRealtime` a `useLinks` oba subscribuji na INSERT do tabulky `clicks` -- dvakrat stejna subscription zbytecne.

- **`useMemo` pouzity pro side-effect**: V Dashboard.tsx (radek 324-326) se `useMemo` pouziva k volani `setVisibleCount(10)` -- toto je anti-pattern. Melo by byt `useEffect`.

---

## 4. Prioritizace navrhu

| # | Navrh | Dopad | Narocnost | Priorita |
|---|-------|-------|-----------|----------|
| 1 | Revenue KPI karta na Dashboard | Vysoky | Nizka | P1 |
| 2 | Dashboard page header | Nizky | Nizka | P2 |
| 3 | Chart + widgety lepsi layout | Stredni | Nizka | P2 |
| 4 | Activity tabulka -- lepsi popisy | Nizky | Nizka | P3 |
| 5 | Summary strip datova synchronizace | Stredni | Stredni | P2 |
| 6 | Links page summary strip | Stredni | Nizka | P2 |
| 7 | LinkTable dynamicka vyska | Nizky | Nizka | P3 |
| 8 | Detail panel -- akce v headeru | Vysoky | Stredni | P1 |
| 9 | Sparklines 7d misto 24h | Nizky | Nizka | P3 |
| 10 | Manage Integration modal | Vysoky | Stredni | P1 |
| 11 | Kompaktnejsi integration karty | Nizky | Stredni | P3 |
| 12 | Ecosystem Bar interaktivita | Nizky | Nizka | P3 |

### Technicke dluhy

| Problem | Dopad | Priorita |
|---------|-------|----------|
| 1000-row limit v useClicksRealtime | Kriticky (data loss) | P0 |
| N+1 queries v useLinks | Vykon (pomale nacitani) | P1 |
| useMemo side-effect anti-pattern | Buggy behavior | P1 |
| Duplicitni realtime subscriptions | Zbytecna zatez | P2 |
| ip-api.com rate limit | Geolokace outage | P2 |

