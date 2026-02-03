
# Odstranění Bridge Pages

## Přehled změn

Odstraníme kompletně funkci Bridge Pages, která umožňuje zobrazit mezistavovací stránku před přesměrováním. Tím zjednodušíme aplikaci pro první vydání.

## Co se odstraní

### 1. Frontend komponenty
- **CreateLinkModal** - Odebrat toggle "Bridge Page" a celou sekci
- **EditLinkModal** - Odebrat BridgePagePreview komponent, bridge page nastavení a Live Preview sekci
- **LinkTable** - Odebrat badge "Bridge" u linků

### 2. Typy a datové struktury
- **src/types/index.ts** - Odebrat `BridgePageConfig` interface a `hasBridgePages` z tier definice

### 3. Hook logika
- **useLinks.ts** - Odebrat zpracování bridge page config z addLink a updateLink funkcí

### 4. Backend Edge Function
- **supabase/functions/redirect/index.ts** - Zjednodušit na přímý redirect (odebrat generování HTML bridge page)

### 5. Databáze (volitelné)
- Sloupce `has_bridge_page` a `bridge_page_config` v tabulce `links` - můžeme ponechat (nullable), nebo odebrat migrací

## Výhody zjednodušení

| Aspekt | Před | Po |
|--------|------|-----|
| Modály | Komplexní s preview | Jednoduchý formulář |
| Redirect funkce | ~240 řádků | ~100 řádků |
| Editace | 2-sloupcový layout | Kompaktní formulář |
| Tier logika | hasBridgePages check | Odstraněno |

## Zachováme pro budoucnost

- Databázové sloupce ponecháme (nullable) - umožní snadné znovupřidání funkce
- Můžeš Bridge Pages přidat zpět jako premium feature v budoucích verzích

## Pořadí implementace

1. Zjednodušit `redirect` Edge Function (odebrat HTML generování)
2. Aktualizovat `types/index.ts` (odebrat BridgePageConfig)
3. Zjednodušit `CreateLinkModal` (odebrat bridge toggle)
4. Přepsat `EditLinkModal` (kompaktní verze bez preview)
5. Upravit `LinkTable` (odebrat bridge badge)
6. Vyčistit `useLinks.ts` (odebrat bridge config logiku)
7. Aktualizovat `Links.tsx` (odebrat bridge import)
