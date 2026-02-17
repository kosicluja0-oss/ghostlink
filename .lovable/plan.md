

# Oprava nefunkčního Postback endpointu

## Co je problém

Backend funkce `postback` se nedaří správně nasadit -- deploy hlásí success, ale endpoint vrací 404 na všechny requesty. To znamená:

- Gumroad (ani žádná jiná služba) nemůže odeslat webhook
- Tlačítko "Send Test Webhook" v Manage modalu taky selže
- Status integrace zůstává navždy "Pending"

## Plán opravy

### 1. Odstranit potenciální blokátory deploye

- Smazat `deno.lock` soubor (pokud existuje), protože nekompatibilní lockfile může tiše způsobit deploy selhání
- Ověřit, že `supabase/config.toml` nemá žádné nestandardní nastavení pro edge functions

### 2. Zjednodušit import v postback funkci

Aktuální import `npm:@supabase/supabase-js@2` může být problematický. Přepsat na spolehlivější `https://esm.sh/@supabase/supabase-js@2` nebo nechat `npm:` specifier, ale ověřit kompatibilitu.

### 3. Odebrat problematický `setInterval`

Funkce obsahuje `setInterval` pro čištění rate-limit cache (řádky 27-34). Edge Functions jsou bezstavové a `setInterval` může způsobovat problémy při inicializaci. Odebrat a nechat rate-limit cache čistit se jen při přístupu.

### 4. Znovu nasadit a otestovat

- Nasadit upravenou funkci
- Ověřit, že endpoint odpovídá na POST request s tokenem `gl_2pqjo76d3r`
- Potvrdit, že se vytvoří konverze v DB a status se změní na "connected"

---

## Technické detaily

**Soubory k úpravě:**
- `supabase/functions/postback/index.ts` -- odstranit `setInterval`, případně upravit import

**Testování:**
- Po nasazení zavolat endpoint s testovacím payloadem
- Ověřit zápis do tabulky `conversions`
- Ověřit update statusu v tabulce `integrations`

