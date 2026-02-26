

## Analýza problému

Z logů je vidět dva problémy:

1. **`create-checkout-session`** -- první volání selhalo s chybou "Failed to fetch" (síťová chyba, pravděpodobně edge funkce ještě nebyla plně nasazena po poslední úpravě). Druhý pokus už proběhl úspěšně (status 200) a vrátil Stripe URL. Takže checkout by nyní měl fungovat.

2. **`check-subscription`** -- stále používá starý vzor `getUser(token)` (řádek 44), který selhává s chybou "Auth session missing!". Toto je stejný problém, který jsme opravili v `create-checkout-session` pomocí `getClaims`. I když to přímo neblokuje přesměrování na Stripe, způsobuje to 500 chybu a může narušovat celkový stav aplikace.

## Plán opravy

### 1. Opravit `check-subscription` edge funkci
- Nahradit `getUser(token)` vzorem s `getClaims(token)` a fallbackem na `getUser`, stejně jako v `create-checkout-session`
- Soubor: `supabase/functions/check-subscription/index.ts`, řádky 43-48
- Změna: extrakce `userId` a `userEmail` přes claims, fallback na getUser

### 2. Nasadit opravenou funkci
- Deploy `check-subscription`

### Technický detail
Řádky 43-48 v `check-subscription/index.ts` se změní z:
```typescript
const token = authHeader.replace("Bearer ", "");
const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
if (userError) throw new Error(`Authentication error: ${userError.message}`);
const user = userData.user;
if (!user?.email) throw new Error("...");
```
Na vzor s `getClaims` + fallback (identický s `create-checkout-session`), a všechny reference na `user.id` a `user.email` se nahradí za `userId` a `userEmail`.

