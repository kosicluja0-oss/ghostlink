

## Zmírnění jasnosti progress barů v Top kartách

### Problem
Aktuální progress bary v kartách Top Countries, Top Placements a Top Links používají plnou sytost barvy metriky, což působí příliš křiklavě oproti tmavému designu dashboardu.

### Řešení
Přidám na progress bar indicator snížení opacity na cca 40-50 %, čímž se barva zjemní a bude lépe ladit s dark-mode estetikou. Barva zůstane stejná, jen bude tlumenější.

### Technické detaily

**Soubor: `src/components/ui/progress.tsx`**
- Na `ProgressPrimitive.Indicator` přidám `opacity: 0.45` do inline stylů, ale pouze když je `indicatorColor` zadaný (aby se neovlivnily jiné progress bary v aplikaci).
- Alternativně lze opacity řešit přímo v komponentě přes nový prop, ale nejjednodušší a nejčistší řešení je aplikovat sníženou opacity přímo na indicator element, když se používá custom barva.

Výsledek: bary budou mít stejný odstín jako graf, ale ve výrazně jemnější, tlumenější variantě.

