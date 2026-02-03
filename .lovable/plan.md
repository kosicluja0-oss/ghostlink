# GhostLink Project Plan

## ✅ Completed - Bridge Pages Removal (Feb 2026)

Úspěšně odstraněna funkce Bridge Pages pro zjednodušení aplikace před vydáním v1.

### Co bylo provedeno:
- ✅ Zjednodušena `redirect` Edge Function na přímý 302 redirect
- ✅ Odstraněn `BridgePageConfig` interface z `types/index.ts`
- ✅ Zjednodušen `CreateLinkModal` (odstraněn bridge toggle)
- ✅ Zjednodušen `EditLinkModal` (kompaktní verze bez preview)
- ✅ Odstraněn bridge badge z `LinkTable`
- ✅ Vyčištěn `useLinks.ts` hook
- ✅ Aktualizovány mock data soubory

### Zachováno pro budoucnost:
- DB sloupce `has_bridge_page` a `bridge_page_config` (nullable) - umožní snadné znovupřidání

## 🔜 Další kroky

### Před vydáním v1
- [ ] Otestovat vytváření a editaci linků
- [ ] Otestovat redirect funkcionalitu
- [ ] Mobile audit (UX na mobilech)

### v1.1 - Autentizace
- [ ] Google OAuth přihlášení
- [ ] Apple OAuth přihlášení

### v1.2 - Analytics
- [ ] Real analytics z databáze
- [ ] Export do CSV

### v2.0 - Premium Features
- [ ] Bridge Pages (jako premium feature)
- [ ] Custom domains
- [ ] Team collaboration
