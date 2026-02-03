
# Vylepšený Analytics Export - Branded Report

## Současný stav
- CSV export existuje, ale je velmi základní (jen raw data bez formátování)
- Žádný PDF export neexistuje
- Export obsahuje pouze: Time, Type, Description, Link, Source, Location, Amount

## Navrhované řešení: Printable HTML Report

Místo generování PDF pomocí knihovny (složité, nová závislost) vytvoříme **tisknutelnou HTML stránku**, kterou uživatel může:
1. Otevřít v novém okně
2. Vytisknout jako PDF (Ctrl+P → Save as PDF)
3. Sdílet screenshot

### Výhody tohoto přístupu
| Aspekt | Benefit |
|--------|---------|
| Branding | Plné využití GhostLink loga a barev |
| Design | Využívá existující Tailwind styling |
| Bez závislostí | Žádná nová knihovna (jsPDF, html2canvas) |
| Kvalita | Vektorová grafika, čistý text |

## Struktura reportu

```text
┌─────────────────────────────────────────────────┐
│  🔗 GhostLink Logo                              │
│  Performance Report                              │
│  Generated: Feb 3, 2026 • Period: Last 7 days   │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ │
│  │ Clicks  │ │ Leads   │ │ Sales   │ │Revenue │ │
│  │  2,847  │ │   342   │ │   89    │ │ $1,247 │ │
│  └─────────┘ └─────────┘ └─────────┘ └────────┘ │
│                                                  │
│  Conversion Rate: 3.1%                          │
├─────────────────────────────────────────────────┤
│  Top Performing Links                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  1. summer-sale    1,523 clicks  $892.30       │
│  2. tech-deals       956 clicks  $558.00       │
│  3. fitness-guide    368 clicks  $197.20       │
├─────────────────────────────────────────────────┤
│  Top Sources (Placements)                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  📸 Instagram Story     42%                     │
│  🎵 TikTok Bio          28%                     │
│  ▶️ YouTube Shorts       18%                     │
│  🌐 Direct/Other        12%                     │
├─────────────────────────────────────────────────┤
│  Recent Activity (Last 20 transactions)        │
│  ┌─────────────────────────────────────────┐   │
│  │ Time    │ Type │ Link    │ Amount      │   │
│  ├─────────────────────────────────────────┤   │
│  │ 10:30   │ Sale │ ebook   │ $49.00      │   │
│  │ 08:15   │ Lead │ signup  │ -           │   │
│  │ ...     │ ...  │ ...     │ ...         │   │
│  └─────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│  ghostlink.lovable.app • Powered by GhostLink  │
└─────────────────────────────────────────────────┘
```

## Technická implementace

### 1. Nový soubor: `src/components/analytics/PerformanceReport.tsx`
Standalone React komponenta pro tisknutelný report s:
- GhostLink logo (SVG)
- Hlavička s datem a obdobím
- Summary karty (Clicks, Leads, Sales, Revenue)
- Top Links tabulka
- Top Placements breakdown
- Recent Activity (omezeno na 20-50 položek)
- Patička s brandem

### 2. Print-optimized CSS
- `@media print` pravidla pro čistý tisk
- Skryje navigaci a zbytečné elementy
- Zachová barvy a brand

### 3. Aktualizace Dashboard.tsx
- Změnit "Export CSV" na dropdown s možnostmi:
  - "Download CSV" (stávající funkcionalita)
  - "View Report" (otevře nové okno s reportem)

### 4. Nová stránka: `src/pages/Report.tsx`
- Route `/report` pro standalone report view
- Přijímá query params pro filtrování (date range, type)
- Automaticky načte data a zobrazí report

## Soubory k vytvoření/úpravě

| Soubor | Akce |
|--------|------|
| `src/components/analytics/PerformanceReport.tsx` | Nový - hlavní report komponenta |
| `src/pages/Report.tsx` | Nový - standalone stránka |
| `src/pages/Dashboard.tsx` | Úprava - dropdown pro export |
| `src/App.tsx` | Úprava - přidat route `/report` |
| `src/index.css` | Úprava - print media queries |

## UI změny na Dashboardu

Aktuální:
```
[Export CSV] button
```

Nové:
```
[📥 Export ▼] dropdown
  ├─ 📄 Download CSV
  └─ 📊 View Report (opens new tab)
```

## Bonusové vylepšení CSV

Přidáme do CSV:
1. **Hlavičku** s názvem reportu a datem
2. **Summary sekci** před raw data
3. Lepší formátování čísel

```csv
# GhostLink Performance Report
# Generated: 2026-02-03
# Period: Last 7 days

# Summary
Total Clicks,2847
Total Leads,342
Total Sales,89
Total Revenue,$1247.50
Conversion Rate,3.1%

# Transactions
Time,Type,Description,Link,Source,Location,Amount
...
```
