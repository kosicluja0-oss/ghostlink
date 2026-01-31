
# Implementační Plán: Sekce "Ghost Link vs. Industry Average"

## Shrnutí
Přidat novou sekci na landing page s anonymním porovnáním Ghost Link vs. průměr trhu. Sekce bude umístěna mezi Features a Pricing pro maximální konverzní efekt.

---

## Umístění v Page Flow

```text
[Hero] → [Features] → [VS INDUSTRY - NOVÁ] → [Pricing] → [FAQ] → [Footer]
```

Důvod umístění: Buduje hodnotu a kontrastuje cenu těsně před pricing sekcí.

---

## Vizuální Návrh

```text
+------------------------------------------------------------------+
|                    Why Choose Ghost Link?                         |
|           See how we compare to industry standards                |
|                                                                   |
|  +---------------------------+  +---------------------------+     |
|  |      Ghost Link           |  |   Industry Average        |     |
|  |      (zelený akcent)      |  |   (šedý/tlumený)          |     |
|  +---------------------------+  +---------------------------+     |
|  |                           |  |                           |     |
|  |  💰 $7.50 - $15/mo        |  |  $80 - $150/mo            |     |
|  |  ✅ Real-time tracking    |  |  ⏱️ Often delayed          |     |
|  |  ✅ Free tier (25 links)  |  |  ❌ Rare / $30+ minimum   |     |
|  |  ✅ 2 min setup           |  |  ⏱️ 30+ minutes           |     |
|  |  ✅ Revenue attribution   |  |  💵 Extra cost            |     |
|  |  ✅ No hidden fees        |  |  ⚠️ Overage charges       |     |
|  |                           |  |                           |     |
|  +---------------------------+  +---------------------------+     |
|                                                                   |
|              [ Start Free → ]  (CTA tlačítko)                     |
+------------------------------------------------------------------+
```

---

## Porovnávací Data

| Aspekt | Ghost Link | Industry Average |
|--------|------------|------------------|
| **Cena** | $7.50 - $15/mo | $80 - $150/mo |
| **Real-time tracking** | Instant (ms latency) | Often 5-15 min delay |
| **Free tier** | 25 links included | Rare or very limited |
| **Setup time** | Under 2 minutes | 30+ minutes typical |
| **Revenue tracking** | Included in Pro | Often separate add-on |
| **Hidden fees** | None - transparent | Overage & API charges |
| **Learning curve** | Minimal - intuitive UI | Complex dashboards |

---

## Technická Implementace

### Nová Komponenta
Vytvořit `src/components/landing/ComparisonSection.tsx`

### Struktura Komponenty

```typescript
// Data pro porovnání
const comparisonItems = [
  {
    label: 'Monthly Price',
    ghostLink: '$7.50 - $15',
    industry: '$80 - $150',
    ghostLinkHighlight: true,
  },
  {
    label: 'Real-time Tracking',
    ghostLink: 'Instant',
    industry: 'Often delayed',
    ghostLinkHighlight: true,
  },
  // ... další položky
];
```

### Styling
- Dvě karty vedle sebe (grid 2 cols na desktop, stack na mobile)
- Ghost Link karta: `border-primary/50`, zelené checkmarky
- Industry karta: `border-border`, šedé/oranžové ikony
- Subtle glow effect na Ghost Link kartě

---

## Soubory k Vytvoření/Úpravě

### 1. Nový soubor: `src/components/landing/ComparisonSection.tsx`
- Samostatná komponenta pro comparison sekci
- Ikony: Check, X, Clock, DollarSign z lucide-react
- Responsivní grid layout

### 2. Úprava: `src/pages/Landing.tsx`
- Import ComparisonSection
- Přidat mezi Features a Pricing sekci
- Přidat nav link "#comparison" do navbar (volitelné)

---

## Responsivita

**Desktop (md+)**:
```text
[ Ghost Link Card ]  [ Industry Card ]
```

**Mobile**:
```text
[ Ghost Link Card ]
        vs
[ Industry Card ]
```

---

## Animace (volitelné)
- Fade-in při scroll do view
- Subtle hover effect na kartách
- Checkmarky s micro-animation

---

## Výsledný Efekt
Uživatel uvidí jasný kontrast: Ghost Link nabízí stejné (nebo lepší) funkce za zlomek ceny konkurence, bez nutnosti jmenovat konkrétní produkty.
