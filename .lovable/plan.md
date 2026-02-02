

# Plán Komerčního Spuštění Ghost Link

## Shrnutí Projektu

**Ghost Link** je SaaS platforma pro affiliate marketéry, která umožňuje sledování kliků, leadů a prodejů. Projekt má solidní základ s funkční autentizací, Stripe integrací a real-time trackingem.

---

## Co Již Funguje

| Oblast | Status |
|--------|--------|
| Autentizace (email/heslo) | Hotovo |
| Profil uživatele + avatar | Hotovo |
| CRUD operace s linky | Hotovo |
| Real-time tracking kliků | Hotovo |
| S2S postback pro konverze | Hotovo |
| Stripe předplatné (3 plány) | Hotovo |
| Landing page | Hotovo |
| Support ticket systém | Hotovo |

---

## Kritické Úkoly pro Spuštění

### Fáze 1: Právní a Bezpečnostní Základ (Priorita: KRITICKÁ)

#### 1.1 Terms of Service & Privacy Policy
- **Problém**: V patičce landing page jsou prázdné odkazy (`href="#"`)
- **Řešení**: Vytvořit stránky `/terms` a `/privacy`
- **Obsah**: Základní šablony přizpůsobené pro SaaS + affiliate tracking
- **Časový odhad**: 2-3 hodiny

#### 1.2 Cookie Consent Banner
- **Problém**: GDPR vyžaduje souhlas s cookies
- **Řešení**: Přidat banner s možností přijmout/odmítnout
- **Časový odhad**: 1-2 hodiny

#### 1.3 Leaked Password Protection
- **Stav**: Supabase Auth má tuto funkci, ale není aktivní
- **Řešení**: Aktivovat v Cloud nastavení
- **Časový odhad**: 5 minut

---

### Fáze 2: Dokončení Core Funkcí (Priorita: VYSOKÁ)

#### 2.1 Bridge Pages (Smart Pre-Landery)
- **Stav**: UI toggle existuje, ale samotné bridge pages nejsou implementovány
- **Co chybí**:
  - Veřejná stránka `/bridge/[alias]` zobrazující countdown před přesměrováním
  - Editor konfigurace (headline, popis, CTA text, delay)
  - Úprava redirect edge function pro podporu bridge pages
- **Časový odhad**: 6-8 hodin

#### 2.2 Enforce Link Limits
- **Stav**: Limity jsou definovány v `TIERS`, ale nejsou vynucovány na backendu
- **Řešení**: RLS policy nebo database function pro kontrolu počtu linků před vytvořením
- **Časový odhad**: 2 hodiny

---

### Fáze 3: Rozšíření Autentizace (Priorita: STŘEDNÍ)

#### 3.1 Google OAuth
- **Důvod**: Alternativní přihlášení zvyšuje konverze o 20-30%
- **Řešení**: Lovable Cloud má managed Google OAuth - stačí aktivovat
- **Časový odhad**: 1 hodina

#### 3.2 Email Verification Flow
- **Stav**: Aktuálně přeskočeno, uživatelé jdou rovnou na onboarding
- **Doporučení**: Pro produkci zapnout potvrzení emailu
- **Časový odhad**: 30 minut

---

### Fáze 4: Integrace (Priorita: STŘEDNÍ)

#### 4.1 Skutečné API Integrace
- **Stav**: Stránka `/integrations` obsahuje pouze UI mockupy
- **Možnosti**:
  - **MVP přístup**: Ponechat jako "Coming Soon" + developer webhook (již funguje)
  - **Plná implementace**: Postupně přidávat integrace (Gumroad, Stripe, PayPal...)
- **Doporučení**: Pro launch stačí webhook + roadmapa

#### 4.2 Webhook Dokumentace
- **Co chybí**: Detailní dokumentace pro S2S postback
- **Řešení**: Přidat stránku `/docs` nebo modal s příklady
- **Časový odhad**: 2-3 hodiny

---

### Fáze 5: UX a Polish (Priorita: NÍZKÁ ale důležitá)

#### 5.1 Responsivní Design Audit
- **Úkol**: Projít všechny stránky na mobilech (320px - 768px)
- **Časový odhad**: 3-4 hodiny

#### 5.2 Loading States
- **Úkol**: Skeleton loadery pro dashboard statistiky
- **Časový odhad**: 1-2 hodiny

#### 5.3 Empty States
- **Úkol**: Lepší zprávy když uživatel nemá žádné linky/data
- **Časový odhad**: 1 hodina

#### 5.4 Error Boundaries
- **Úkol**: Graceful error handling pro celou aplikaci
- **Časový odhad**: 2 hodiny

---

### Fáze 6: Monitoring a Analytika (Priorita: STŘEDNÍ)

#### 6.1 Rate Limiting na Redirect
- **Problém**: Edge function nemá ochranu proti DDoS
- **Řešení**: Implementovat rate limit (např. 100 req/min per IP)
- **Časový odhad**: 2 hodiny

#### 6.2 Error Logging
- **Doporučení**: Integrace Sentry nebo podobného nástroje
- **Časový odhad**: 1 hodina

---

## Časový Harmonogram

```text
┌─────────────────────────────────────────────────────────┐
│ TÝDEN 1: Právní + Bezpečnost                            │
├─────────────────────────────────────────────────────────┤
│ • Terms of Service                                       │
│ • Privacy Policy                                         │
│ • Cookie consent                                         │
│ • Leaked password protection                            │
│ • Email verification                                     │
└─────────────────────────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────────┐
│ TÝDEN 2: Core Funkce                                    │
├─────────────────────────────────────────────────────────┤
│ • Bridge pages implementace                             │
│ • Link limits enforcement                                │
│ • Google OAuth                                          │
│ • Webhook dokumentace                                   │
└─────────────────────────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────────┐
│ TÝDEN 3: Polish + Testing                               │
├─────────────────────────────────────────────────────────┤
│ • Responsivní audit                                     │
│ • Loading/empty states                                  │
│ • Error boundaries                                       │
│ • Rate limiting                                          │
│ • End-to-end testování                                  │
└─────────────────────────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────────┐
│ TÝDEN 4: Launch                                         │
├─────────────────────────────────────────────────────────┤
│ • Final QA                                               │
│ • Publish na custom doménu                              │
│ • Stripe live mode                                       │
│ • Soft launch                                            │
└─────────────────────────────────────────────────────────┘
```

---

## Technické Detaily Implementace

### Terms of Service & Privacy Policy
- Nové soubory: `src/pages/Terms.tsx`, `src/pages/Privacy.tsx`
- Aktualizace: `App.tsx` (přidat routes), `Landing.tsx` (opravit odkazy)

### Bridge Pages
- Nový soubor: `src/pages/BridgePage.tsx`
- Úprava: `supabase/functions/redirect/index.ts`
- Nová route: `/go/[alias]` pro bridge, `/r/[alias]` pro přímý redirect

### Link Limits
- Nová database function: `check_link_limit(user_id, tier)`
- RLS policy na `links` tabulku

### Google OAuth
- Použít `supabase--configure-social-auth` tool
- Aktualizovat `Auth.tsx` s Google přihlašovacím tlačítkem

---

## Doporučení pro MVP Launch

**Minimální požadavky před spuštěním:**

1. Terms of Service + Privacy Policy
2. Cookie consent banner
3. Google OAuth (volitelné ale doporučené)
4. Link limits enforcement
5. Responsivní design audit

**Lze odložit po launchi:**

- Bridge pages (označit jako "Coming Soon")
- Plné API integrace (webhook stačí)
- Transactional emaily

---

## Další Kroky

Po schválení tohoto plánu začnu s implementací **Fáze 1** - vytvoření stránek Terms of Service a Privacy Policy včetně úpravy navigačních odkazů.

