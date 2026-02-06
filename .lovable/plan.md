

## Prohozeni ikon: Total Sales a Revenue

Jednoducha zmena -- prohodime ikony mezi dvema KPI kartami:

- **Total Sales**: momentalne `DollarSign` -> zmena na `TrendingUp`
- **Revenue**: momentalne `TrendingUp` -> zmena na `DollarSign`

Logika: Revenue (penize) = dolar, Sales (pocet prodejou) = sipka nahoru. Dava to vetsi smysl.

### Technicke detaily

Jedina zmena v souboru `src/pages/Dashboard.tsx`:

- Radek 459: `icon={DollarSign}` -> `icon={TrendingUp}`
- Radek 468: `icon={TrendingUp}` -> `icon={DollarSign}`

Zadne dalsi soubory ani zavislosti neni treba menit.

