

# Oprava Conversion Tracking -- Link-Level Attribution

## Problem

Soucasny postback endpoint vyzaduje `click_id` (UUID), ktery zna pouze Ghost Link. Externi platformy jako Gumroad, Stripe ci Lemon Squeezy posilaji sve vlastni payload formaty a `click_id` neznaji. Vysledek: 90% integraci na strance nefunguje.

## Reseni

Prechod z **click-level attribution** na **link-level attribution** s podporou unikatnich tokenu pro kazdeho uzivatele a sluzbu.

---

## 1. Databazova zmena -- pridani tokenu

Pridame sloupec `webhook_token` do existujici tabulky `integrations` a sloupec `link_id` pro prirazeni ke konkretnimu linku.

```sql
ALTER TABLE public.integrations
  ADD COLUMN IF NOT EXISTS webhook_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS link_id UUID REFERENCES public.links(id) ON DELETE SET NULL;
```

Token bude nahodny retezec (ne UUID, aby vypadal jinak nez click_id), napr. `gl_a7x9k2m4p1`.

---

## 2. Uprava postback Edge Function

Soucasna funkce podporuje pouze:
```
GET /postback?click_id=UUID&type=sale&value=49.99
```

Nova funkce bude podporovat DVA rezimy:

**Rezim A -- Token (pro integrace)**
```
POST /postback?token=gl_a7x9k2m4p1
```
- Prijme JAKYKOLI payload (Gumroad, Stripe, cokoliv)
- Vyhleda token v tabulce `integrations` -> ziska `user_id`, `service_id`, `link_id`
- Pokusi se z payloadu extrahovat castku (hledane klice: `price`, `amount`, `value`, `total`)
- Vytvori zaznam v `conversions` prirazeny k poslednimu kliku na danem linku
- Pokud zadny klik neexistuje, vytvori "virtualni" klik pro evidenci

**Rezim B -- Click ID (pro affiliate site a developery)**
```
GET /postback?click_id=UUID&type=sale&value=49.99
```
- Funguje presne jako dnes, zadna zmena
- Pro ClickBank, Digistore24 a vlastni implementace

Logika v kodu:
```text
if (token parameter exists) -> Rezim A (link-level)
else if (click_id parameter exists) -> Rezim B (click-level, beze zmeny)
else -> 400 error
```

---

## 3. Uprava useIntegrations hooku

- Odstranit Stripe vyjimku (Stripe = stejna integrace jako Gumroad)
- Pri `connect()` generovat nahodny `webhook_token`
- Ukladat `link_id` z modalu (Step 3)
- Webhook URL bude: `https://PROJECT.supabase.co/functions/v1/postback?token={webhook_token}`

```typescript
// Generovani tokenu
function generateToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'gl_';
  for (let i = 0; i < 10; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

// Webhook URL uz nebude obsahovat placeholdery
function getWebhookUrl(token: string): string {
  return `https://${projectId}.supabase.co/functions/v1/postback?token=${token}`;
}
```

---

## 4. Uprava ConnectServiceModal

- Step 2 (Copy URL): Zobrazit **unikatni** URL s tokenem (ne genericku)
- Step 3 (Assign Link): Link prirazeni se ulozi do `integrations.link_id`
- Po potvrzeni: ulozit do DB vcetne tokenu, link_id, a webhook_url
- Tip text zmenit na: "Paste this URL in [Platform]. Any sale will be automatically tracked."

---

## 5. Uprava IntegrationCard

- Odstranit VESKEROU specialni logiku pro Stripe
- Stripe = stejna karta jako Gumroad, Lemon Squeezy atd.
- Zadne "Upgrade" tlacitko, zadne tier badge
- Pouze: Connect / Pending / Live / Manage (stejne jako vsechny ostatni)

---

## 6. Uprava Integrations.tsx

- Odstranit `openCustomerPortal` logiku pro Stripe
- Odstranit import `useSubscription` (pokud neni potreba jinde)
- `handleConnect` -- jednotna logika pro vsechny platformy vcetne Stripe

---

## Souhrn zmen

| Soubor | Akce |
|--------|------|
| `supabase/migrations/xxx_add_webhook_token.sql` | Nova migrace -- token + link_id sloupce |
| `supabase/functions/postback/index.ts` | Pridat Rezim A (token-based attribution) |
| `src/hooks/useIntegrations.ts` | Odstranit Stripe vyjimku, generovat tokeny |
| `src/components/integrations/ConnectServiceModal.tsx` | Unikatni URL s tokenem |
| `src/components/integrations/IntegrationCard.tsx` | Odstranit Stripe specialni UI |
| `src/pages/Integrations.tsx` | Odstranit Stripe specialni logiku |

## Poznamky

- **Zpetna kompatibilita**: Rezim B (click_id) zustava beze zmeny, takze existujici Developer webhook a affiliate site funguji dal.
- **Bezpecnost**: Token je nahodny a unikatni, bez nej nelze zapsat konverzi. RLS na tabulce integrations zarucuje, ze uzivatel vidi jen sve tokeny.
- **Parsovani payloadu**: Rezim A se pokusi inteligentne extrahovat castku z jakehokoli JSON payloadu. Pokud se to nepodari, zapise konverzi s hodnotou 0 (uzivatel ji muze upravit pozdeji).
- **Jednoduchost pro uzivatele**: Influencer pripoji platformu, zkopiruje URL, vlozi ji do nastaveni platformy, vybere link -- hotovo. Zadne technicke znalosti nejsou potreba.

