

## Dashboard Page Header

Pridani hlavicky na stranku Dashboard, aby byla konzistentni s ostatnimi moduly (Links, Integrations, Settings, Support). Kazda z techto stranek ma vzor: ikona v kruhu + nadpis + popis.

### Co se zmeni

Dashboard aktualne zacina rovnou KPI kartami bez jakehokoliv nadpisu. Pridame hlavickovou sekci pred stats grid, ktera bude obsahovat:

- Ikona v kruhu (LayoutDashboard z lucide-react)
- Nadpis "Dashboard"
- Kratky popis, napr. "Your performance overview at a glance"

### Vizualni vzor (z ostatnich stranek)

```text
+-------------------------------------------+
| [icon]  Dashboard                         |
|         Your performance overview ...     |
+-------------------------------------------+
| KPI karty (Total Clicks, Leads, ...)      |
| ...                                       |
```

### Technicke detaily

Jedina zmena v souboru `src/pages/Dashboard.tsx`:

1. Pridat import `LayoutDashboard` z `lucide-react`
2. Vlozit novou `<section>` pred stavajici "Stats Banner" (pred radek ~437), pouzitim stejneho patternu jako ostatni stranky:

```tsx
<section className="mb-5">
  <div className="flex items-center gap-3">
    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
      <LayoutDashboard className="w-5 h-5 text-primary" />
    </div>
    <div>
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Your performance overview at a glance
      </p>
    </div>
  </div>
</section>
```

Zadne dalsi soubory ani zavislosti neni treba menit.

