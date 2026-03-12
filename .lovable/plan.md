

## Plán: Reálný screenshot dashboardu v hero sekci

### Co se změní
Nahradíme současný mock graf (`MockDashboardChart`) v hero sekci za reálný screenshot tvého dashboardu. Screenshot bude mít stejný vizuální treatment jako na Reliant stránce — zaoblený rám, stín, lehký glow efekt.

### Co potřebuji od tebe
**Nahraj screenshot dashboardu** (ideálně v plné šířce, tmavý režim, s daty). Doporučuju pořídit screenshot z `/dashboard` stránky — přes celé okno prohlížeče, bez adresního řádku.

### Technické kroky
1. Zkopíruji nahraný screenshot do `src/assets/` složky
2. V `Landing.tsx` odstraním komponentu `MockDashboardChart` a nahradím ji obrázkem ve stylizovaném rámečku:
   - Zaoblené rohy (`rounded-xl`)
   - Border + box-shadow pro hloubku
   - Glow efekt pod obrázkem (stávající `bg-primary/10 blur-3xl`)
   - Responsive sizing
3. Zachovám "Live" indikátor nad screenshotem pro dynamický dojem

### Vizuální výsledek
Screenshot bude vypadat jako plovoucí okno aplikace — podobně jako na Reliant stránce, ale přizpůsobené Ghost Link designu.

