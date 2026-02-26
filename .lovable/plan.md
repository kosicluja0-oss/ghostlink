

## Problém

Tlačítko "Share" v patičce landing page aktuálně pouze kopíruje URL do schránky (`navigator.clipboard.writeText`). Na iPhone Safari je k dispozici nativní Web Share API (`navigator.share()`), které otevře systémový share sheet (sdílení přes iMessage, WhatsApp, AirDrop atd.) — ale aplikace ho nevyužívá.

Navíc je URL hardcoded na `https://ghostlink.app` místo skutečné produkční domény `https://ghstlink.com`.

## Plán

### 1. Upravit Share tlačítko v `src/pages/Landing.tsx` (řádky 279-285)

Nahradit současný `onClick` handler logikou:

1. **Detekce Web Share API** — `if (navigator.share)` → zavolat `navigator.share({ title: 'Ghost Link', url: 'https://ghstlink.com' })`
2. **Fallback** — pokud `navigator.share` není dostupné (desktop), použít `navigator.clipboard.writeText` + toast jako dosud
3. **Opravit URL** z `ghostlink.app` na `ghstlink.com`

Jedná se o změnu cca 10 řádků v jednom souboru.

