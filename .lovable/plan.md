

# GDPR Export osobních dat

## Přehled
Implementace funkce pro stažení všech osobních dat uživatele ve formátu JSON, v souladu s GDPR článkem 15 (právo na přístup) a článkem 20 (právo na přenositelnost dat).

## Co bude exportováno

| Kategorie | Data |
|-----------|------|
| Profil | Jméno, email, avatar URL, měna, timezone, preference emailů |
| Linky | Všechny vytvořené linky s aliasy a cílovými URL |
| Statistiky | Agregovaná data kliknutí a konverzí per link |
| Metadata | Datum registrace, poslední aktualizace profilu |

## Implementace

### 1. Nová sekce v Settings
Přidání "Data & Privacy" sekce mezi stávající karty s:
- Popis jaká data jsou ukládána
- Tlačítko "Download My Data" 
- Formát JSON (čitelný i strojově zpracovatelný)

### 2. Export funkce
Klientská funkce která:
1. Načte všechna data z Supabase (profiles, links, clicks, conversions)
2. Agreguje statistiky per link
3. Vytvoří strukturovaný JSON objekt
4. Stáhne jako soubor `ghostlink-data-export-{datum}.json`

### 3. Struktura exportu

```text
{
  "exportedAt": "2026-02-04T...",
  "account": {
    "email": "user@example.com",
    "displayName": "John",
    "createdAt": "2025-01-01T..."
  },
  "preferences": {
    "currency": "usd",
    "timezone": "Europe/Prague"
  },
  "links": [
    {
      "alias": "my-link",
      "targetUrl": "https://...",
      "createdAt": "...",
      "totalClicks": 150,
      "totalConversions": 12
    }
  ],
  "totalStats": {
    "links": 5,
    "clicks": 500,
    "conversions": 45
  }
}
```

## Umístění v UI
Nová karta "Data & Privacy" v Settings s ikonou Shield/Download, obsahující:
- Informační text o GDPR právech
- Tlačítko pro export
- Loading stav během generování

## Technické detaily

- Použije existující Supabase queries (RLS zajistí že uživatel vidí jen svá data)
- Export probíhá kompletně na klientu - žádná nová edge function
- Soubor se generuje v paměti a stahuje přes `Blob` + `URL.createObjectURL`
- Agregace statistik probíhá v JS (ne v SQL) pro jednoduchost

