

# Vlastni domena pro tracking linky

## Co to obnasi

Aby tracking linky vypadaly jako `ghost.link/abc123` misto dlouhe adresy, potrebujes tri veci:

1. **Koupit kratkou domenu** (napr. `ghost.link`, `ghst.link`, `ghl.ink` apod.)
2. **Nastavit proxy** — sluzbu, ktera prijme pozadavek na kratke domene a preposleje ho na tvoji redirect Edge funkci
3. **Upravit kod** — aby aplikace generovala kratke URL misto dlouhych

---

## Krok 1: Koupě domeny

Domenu si koupis u registratora (napr. Namecheap, Cloudflare Registrar, GoDaddy). Idealne neco kratkeho a zapamatovatelneho. Priklady:

- `ghost.link` (pokud je dostupna)
- `ghst.lnk`
- `ghl.ink`
- `ghostl.ink`

Cena: typicky 5-20 USD/rok.

---

## Krok 2: Nastaveni proxy (Cloudflare Workers)

Toto je externi nastaveni **mimo Lovable**. Doporucuji Cloudflare Workers (free tier staci):

1. Registruj domenu nebo ji presun na Cloudflare
2. Vytvor Worker, ktery prijme pozadavek a preposleje ho na tvoji Edge funkci:

```text
ghost.link/abc123
    |
    v
Cloudflare Worker
    |
    v
https://mlgrbwkddyrazysxrlvo.supabase.co/functions/v1/redirect/abc123
```

Worker kod je cca 10 radek — jednoduchy fetch proxy, ktery zachova vsechny parametry (vcetne `?s=ig-reels` pro Smart Copy).

Cloudflare Workers free tier: **100 000 pozadavku denne** — vice nez dostatecne pro zacatek.

---

## Krok 3: Uprava kodu v Lovable

Po nastaveni proxy upravim jediny soubor:

**`src/lib/trackingUrl.ts`** — zmena base URL:
- Misto: `https://[id].supabase.co/functions/v1/redirect`
- Na: `https://ghost.link` (tvoje nova domena)

Funkce `getDisplayUrl` uz dnes zobrazuje kratkou verzi — po zmene bude skutecna URL odpovidat tomu, co uzivatel vidi.

Zadne dalsi soubory se nemeni. Smart Copy, LinkCard, LinkTable — vsechno pouziva `getTrackingUrl()` z tohoto souboru.

---

## Shrnuti postupu

1. Vyber a kup kratkou domenu
2. Nastavit Cloudflare Workers proxy (muzu ti dat presny kod pro Worker)
3. Ja upravim `trackingUrl.ts` aby generovals kratke URL

## Dulezite

- Databaze, Edge funkce, analytics — **nic se nemeni**
- Stare linky budou fungovat dal (Supabase URL nikam nezmizi)
- Proxy prida minimalni latenci (pod 10ms)

