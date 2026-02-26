

## Optimalizace stránky Integrations pro mobilní rozhraní

### Současný stav
- Detail panel (`IntegrationDetailPanel`) je na mobilu kompletně skrytý (`hidden md:block`) — po kliknutí na integraci se nic nestane
- Kategorie popisky (`category.description`) zabírají zbytečně místo na malé obrazovce
- Grid karet je `grid-cols-1 sm:grid-cols-2` — na mobilu jen jeden sloupec, ale karty mohou být zbytečně velké
- Free-tier lock overlay není optimalizovaný pro malé obrazovky

### Plán

**1. Detail panel jako Bottom Sheet (Drawer) na mobilu**
Stejný vzor jako na stránce Links — na mobilu obalit `IntegrationDetailPanel` do `<Drawer>` komponenty (vaul), na desktopu ponechat inline panel.

- `useIsMobile()` hook pro detekci
- Drawer se otevře při kliknutí na integrační kartu, zavře swipem dolů
- Sdílí stejný `panelOpen` / `selectedIntegration` state
- Drawer výška cca 85vh, scrollovatelný obsah uvnitř

**2. Responzivní úpravy layoutu**
- Skrýt `category.description` na mobilu (`hidden md:inline`) — zůstane jen název kategorie s ikonou
- Grid karet: ponechat `grid-cols-1` na mobilu, ale zajistit kompaktnější zobrazení

**3. Free-tier overlay**
- Zmenšit padding a velikosti na mobilu pro lock overlay, aby se celý vešel bez scrollu

### Implementační kroky
1. V `Integrations.tsx` importovat `useIsMobile`, `Drawer` a podmíněně renderovat detail panel v draweru (mobilní) vs inline (desktop)
2. Přidat `hidden md:inline` na `category.description` span
3. Upravit free-tier overlay padding pro mobilní rozlišení

