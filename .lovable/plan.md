

# Krok 3: Vytvoreni Live produktu a cen ve Stripe

## Co udelam za tebe
Vse vytvorim automaticky - nemusis nic delat rucne ve Stripe Dashboardu.

## Postup

1. Vytvorim produkt **GhostLink Pro** s cenou $10/mesic
2. Pridam rocni cenu **$90/rok** k produktu Pro
3. Vytvorim produkt **GhostLink Business** s cenou $15/mesic
4. Pridam rocni cenu **$135/rok** k produktu Business
5. Aktualizuji kod projektu s novymi Price ID:
   - `src/lib/stripe.ts` - konstanty STRIPE_PRICES
   - `supabase/functions/stripe-webhook/index.ts` - mapovani PRICE_TO_TIER
   - `src/types/index.ts` - ceny z $9.99/$14.99 na $10/$15

## Vysledek
Po schvaleni budu mit vsechny 4 ceny vytvorene ve Stripe a kod projektu bude pouzivat spravne live Price ID.

