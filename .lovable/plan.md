

# SEO Meta Tagy — Ghost Link

## Co chybí

Většina OG tagů už existuje, ale chybí klíčové: `og:image`, `og:url`, `twitter:title`, `twitter:description`, `twitter:image` a `theme-color`. Bez `og:image` se při sdílení na sociálních sítích nezobrazí náhledový obrázek.

## Plán

### 1. Vytvořit OG image (1200x630px)

Vytvořím statický SVG soubor `public/og-image.svg` s tmavým designem Ghost Link (ghost ikona, název, tagline) a přidám ho jako `og:image`. Alternativně lze použít PNG — ale SVG je jednodušší na údržbu.

**Poznámka:** Některé platformy (WhatsApp, LinkedIn) nepodporují SVG jako OG image. Doporučuji později nahrát PNG verzi. Prozatím nastavím cestu, kterou snadno vyměníš.

### 2. Doplnit chybějící meta tagy do `index.html`

Přidám tyto tagy:

- `og:url` — `https://ghostlink.app`
- `og:image` — `https://ghostlink.app/og-image.png`
- `og:image:width` / `og:image:height` — 1200x630
- `twitter:title` — shodný s og:title
- `twitter:description` — shodný s og:description
- `twitter:image` — shodný s og:image
- `theme-color` — `#141414` (tmavé pozadí aplikace)

### 3. Soubory k úpravě

- `index.html` — doplnění meta tagů
- `public/og-image.png` — placeholder OG obrázek (budeš ho moci nahradit vlastním)

## Poznámka k OG image

Prozatím nastavím URL na `https://ghostlink.app/og-image.png`. Až budeš mít vlastní doménu a finální obrázek, stačí soubor vyměnit. Vytvořím jednoduchý tmavý placeholder obrázek s Ghost Link brandem.

