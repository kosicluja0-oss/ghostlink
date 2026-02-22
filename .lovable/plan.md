

# Jak přejít ze Stripe Sandbox na Live (krok za krokem)

Tvoje integrace je kompletně funkční v sandbox režimu. Jediné co je potřeba, je provést 4 kroky ve Stripe Dashboardu a pak aktualizovat 3 hodnoty v projektu. Žádný kód se měnit nemusí.

---

## Krok 1: Přepni Stripe Dashboard do Live režimu

1. Jdi na [dashboard.stripe.com](https://dashboard.stripe.com)
2. V levém horním rohu uvidíš přepínač **"Test mode"** -- vypni ho (klikni na něj)
3. Tím se přepneš do Live režimu

---

## Krok 2: Vytvoř Live produkty a ceny

V Live režimu Stripe Dashboardu:

1. Jdi do **Products** (v levém menu)
2. Vytvoř **Pro** produkt:
   - Název: `Pro`
   - Přidej 2 ceny:
     - **Monthly**: $10/měsíc (recurring, monthly)
     - **Yearly**: $90/rok (recurring, yearly) -- to odpovídá $7.50/měsíc se slevou 25%
3. Vytvoř **Business** produkt (pokud ho chceš nabízet):
   - Název: `Business`
   - Přidej 2 ceny:
     - **Monthly**: $15/měsíc
     - **Yearly**: $135/rok

4. **Zapiš si Price ID** každé ceny (vypadají jako `price_xxxxx`). Budeš je potřebovat v kroku 4.

---

## Krok 3: Nastav Live Webhook

Stále v Live režimu Stripe Dashboardu:

1. Jdi do **Developers -> Webhooks**
2. Klikni **Add endpoint**
3. Zadej URL:
   ```
   https://mlgrbwkddyrazysxrlvo.supabase.co/functions/v1/stripe-webhook
   ```
4. Vyber tyto eventy:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Klikni **Add endpoint**
6. Na stránce endpointu klikni na **Reveal signing secret** -- zapiš si ho (začíná `whsec_...`)

---

## Krok 4: Aktualizuj secrets a kód v projektu

Tady budu potřebovat tvoji pomoc -- pošli mi:

### A) Live API klíč
- V Stripe Dashboard (Live režim) jdi do **Developers -> API keys**
- Zkopíruj **Secret key** (začíná `sk_live_...`)
- Já ti ho pak bezpečně nastavím jako secret v projektu (nahradí stávající `sk_test_...`)

### B) Webhook signing secret
- Ten z kroku 3 (`whsec_...`)
- Také ho nastavím jako secret

### C) Nové Live Price ID
- Pošli mi 4 Price ID z kroku 2, já je aktualizuji v kódu (`src/lib/stripe.ts` a `supabase/functions/stripe-webhook/index.ts`)

---

## Shrnutí co se změní

| Co | Odkud | Kam |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | stávající test | nový live `whsec_...` |
| 4x Price ID v kódu | `price_1Sqv...` (test) | nové live `price_...` |

Kód edge funkcí, frontend, databáze -- nic z toho se měnit nemusí. Jen tyto 3 hodnoty.

---

## Po dokončení

- Reální zákazníci budou moci platit kartou
- Webhook bude automaticky aktualizovat jejich tier (free -> pro/business)
- Customer Portal bude fungovat pro správu předplatného

