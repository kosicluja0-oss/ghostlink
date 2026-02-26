

## Návrh: Detail panel na mobilu jako spodní drawer (Bottom Sheet)

### Současný stav
Na desktopu se detail panel zobrazuje inline vedle tabulky (60/50 split). Na mobilu je úplně skrytý (`hidden md:block`), takže uživatel nemá přístup k detailům linku.

### Navrhované řešení: Bottom Sheet (Drawer)

Projekt již obsahuje knihovnu **vaul** a komponentu `Drawer`, která je přesně pro tento účel navržená. Na mobilu se po kliknutí na link detail panel vysune zespoda jako sheet, který:

- Zabere přibližně **75–85 % výšky obrazovky**
- Má nahoře **handle bar** (táhlo) pro intuitivní zavírání gestem dolů
- Obsahuje **stejný obsah** jako desktopový detail panel (KPI karty, graf, placements, activity)
- Je **scrollovatelný** uvnitř pro delší obsah

### Proč tento přístup

- **Nativní pocit** — bottom sheet je standardní iOS/Android vzor, uživatelé ho znají
- **Žádná ztráta kontextu** — uživatel vidí, že je stále na stránce Links
- **Gesture-friendly** — zavření swipem dolů, což doplňuje existující swipe navigaci mezi sekcemi
- **Nulové nové závislosti** — vaul/Drawer je již v projektu

### Implementační kroky

1. **Links.tsx** — přidat podmíněné renderování: na mobilu (`useIsMobile`) obalit `LinkDetailPanel` do `<Drawer>` komponenty, na desktopu ponechat inline panel beze změny
2. **LinkDetailPanel** — žádné změny obsahu, pouze wrapper se mění podle breakpointu
3. Drawer se otevře/zavře přes stejný `detailOpen` state, který již existuje

```text
┌─────────────────────┐
│   Links (tabulka)   │
│                     │
│  ┌───────────────┐  │
│  │ ═══ handle ══ │  │  ← drawer handle
│  │               │  │
│  │  KPI karty    │  │
│  │  Graf         │  │
│  │  Placements   │  │
│  │  Activity     │  │
│  │               │  │
│  └───────────────┘  │
│ ▓▓▓ bottom nav ▓▓▓  │
└─────────────────────┘
```

