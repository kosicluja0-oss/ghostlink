

# Presna atribuce konverzi pomoci click_id

## Jak to bude fungovat

Kdyz nekdo klikne na tvuj tracking link (napr. `ghstlink.com/gumroad`), redirect funkce uz dnes vytvori unikatni `click_id` v databazi. Jediny problem je, ze tento click_id se nikam nepredava -- ztrati se.

Reseni: Redirect funkce pripoji `click_id` jako query parametr do cilove URL. Pokud treti strana (Gumroad, Stripe...) vrati tento click_id ve webhooku, postback funkce ho pouzije pro presnou atribuci. Pokud ne, pouzije se stavajici fallback (posledni klik).

```text
Uzivatel klikne:  ghstlink.com/gumroad?s=ig-story
                         |
                  Redirect funkce vytvori click (id: abc-123)
                         |
                  302 redirect na:
                  gumroad.com/l/produkt?gl_click=abc-123
                         |
                  Uzivatel nakoupi na Gumroadu
                         |
                  Gumroad posle webhook (Ping) s URL parametry
                  vcetne ?gl_click=abc-123 (pokud to platforma podporuje)
                         |
                  Postback funkce:
                    1. Najde gl_click=abc-123 v payloadu? -> PRESNA atribuce
                    2. Nenajde? -> Fallback na posledni klik (jako dosud)
```

## Co se zmeni

### 1. Redirect Edge Function (`supabase/functions/redirect/index.ts`)
- Po vytvoreni clicku pripojit `?gl_click={click_id}` do `target_url`
- Respektovat existujici query parametry v cilove URL (pouzit `&` pokud uz ma `?`)

### 2. Postback Edge Function (`supabase/functions/postback/index.ts`)
- V Token modu: pred hledanim "posledniho kliku" zkontrolovat, zda payload nebo query params obsahuji `gl_click` (nebo `click_id`)
- Pokud ano, overit ze click existuje a patri k jednomu z prirazenych linku -> pouzit presnou atribuci
- Pokud ne, pouzit stavajici fallback logiku

### 3. Zadne zmeny v DB
Databaze uz ma vse potrebne -- `clicks.id` uz existuje, jen se nepredava dal.

## Technicke detaily

### Redirect funkce -- zmena (radky 126-146)

Aktualne:
```text
insert click -> get click_id
redirect to link.target_url
```

Nove:
```text
insert click -> get click_id
append gl_click=click_id to target_url
redirect to modified URL
```

Logika pripojeni parametru:
```text
if target_url contains '?' -> append '&gl_click=click_id'
else -> append '?gl_click=click_id'
```

### Postback funkce -- zmena v Token modu

Pred radkem "Find the most recent click for attribution" pridat:
```text
1. Zkontrolovat payload['gl_click'] nebo payload['click_id'] nebo query param gl_click
2. Pokud existuje a je validni UUID:
   a. Overit ze click existuje v DB
   b. Overit ze click.link_id patri k assignedLinkIds (nebo user's links pro global)
   c. Pokud OK -> pouzit jako attributedClickId (preskocit fallback)
3. Pokud neexistuje -> pokracovat stavajici logikou (posledni klik)
```

## Soubory k uprave
- `supabase/functions/redirect/index.ts` -- pripojit gl_click do cilove URL
- `supabase/functions/postback/index.ts` -- prioritne hledat gl_click v payloadu

## Omezeni
- Ne vsechny platformy predavaji URL parametry zpet ve webhooku (Gumroad Ping ano, nektere jine ne)
- Pro platformy ktere to nepodporuji, fallback na "posledni klik" zustava funkcni
- Parametr `gl_click` v cilove URL je neviditelny pro bezneho uzivatele, ale muze byt viditelny v URL bare na cilove strance
