

# Vytvoření SVG loga Ghost Link

## Přehled
Vytvořím sadu profesionálních SVG logo souborů pro Ghost Link, které budou obsahovat ikonu ducha a text "Ghost Link". Logo bude dostupné v několika variantách pro různé použití.

## Varianty loga

### 1. Hlavní logo (světlé na průhledném pozadí)
- Bílá ikona ducha + bílý text "Ghost Link"
- Ideální pro tmavé pozadí

### 2. Tmavé logo (tmavé na průhledném pozadí)  
- Černá/tmavě šedá ikona + text
- Ideální pro světlé pozadí

### 3. Barevné logo s gradientem
- Ikona s gradientem primary barvy (#8B5CF6 → #A78BFA)
- Pro brandingové účely

### 4. Pouze ikona
- Samotný duch bez textu
- Pro favicon, app ikony, sociální sítě

## Soubory k vytvoření

```
public/brand/
├── ghostlink-logo-light.svg      (bílé logo pro tmavé pozadí)
├── ghostlink-logo-dark.svg       (tmavé logo pro světlé pozadí)
├── ghostlink-logo-gradient.svg   (barevné logo s gradientem)
├── ghostlink-icon-light.svg      (pouze ikona - bílá)
├── ghostlink-icon-dark.svg       (pouze ikona - tmavá)
└── ghostlink-icon-gradient.svg   (pouze ikona - gradient)
```

## Design specifikace

- **Font**: Sans-serif, bold tracking-tight (odpovídá současnému stylu v aplikaci)
- **Ikona**: Vektorová verze Lucide Ghost ikony
- **Rozměry**: Optimalizováno pro různé velikosti (scalable SVG)
- **Barvy**:
  - Light: `#FFFFFF`
  - Dark: `#1A1A2E`
  - Primary gradient: `#8B5CF6` → `#A78BFA`

## Technické detaily

Každý SVG soubor bude:
- Plně vektorový (škálovatelný bez ztráty kvality)
- Optimalizovaný pro web (minimální velikost)
- S průhledným pozadím
- Kompatibilní se všemi moderními prohlížeči

Po vytvoření budou soubory dostupné ke stažení přímo z `/brand/` adresáře projektu.

