
# Aktualizace Landing Page - Odstranění Bridge Pages

## Přehled změn

Odstraníme všechny zmínky o Bridge Pages z úvodní stránky, protože tato funkce byla zrušena.

## Konkrétní úpravy

### 1. Features sekce (řádky 76-88)
**Aktuální stav:**
```javascript
{
  icon: Layers,
  title: 'Smart Bridge Pages',
  description: 'Increase conversions with pre-lander overlays...'
}
```

**Nový stav - nahradíme relevantní funkcí:**
```javascript
{
  icon: BarChart,
  title: 'Detailed Reporting',
  description: 'Geographic insights, device breakdown, and traffic source analysis. Make data-driven decisions.'
}
```

### 2. Pricing - Pro plán (řádek 125)
**Aktuální stav:**
```javascript
features: ['100 active links', 'Leads & Sales tracking', 'Full analytics', 'Bridge pages', 'Priority support']
```

**Nový stav:**
```javascript
features: ['100 active links', 'Leads & Sales tracking', 'Full analytics', 'Geographic insights', 'Priority support']
```

### 3. FAQ sekce (řádky 168-170)
**Odstranit celý objekt:**
```javascript
{
  question: 'What are Bridge Pages?',
  answer: 'Bridge pages are intermediate landing pages...'
}
```

## Shrnutí změn

| Sekce | Změna |
|-------|-------|
| Features | "Smart Bridge Pages" → "Detailed Reporting" |
| Pro plán | "Bridge pages" → "Geographic insights" |
| FAQ | Odstranit otázku "What are Bridge Pages?" |

## Soubory k úpravě
- `src/pages/Landing.tsx`
