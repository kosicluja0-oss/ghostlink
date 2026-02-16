
# Heat Mapa pro Top Countries kartu

## Co se zmeni

Karta "Top Countries" dostane v pravem hornim rohu prepinac (toggle switch) mezi dvema zobrazenim:
1. **List view** (soucasny stav) -- tabulka se zeme + progress bary
2. **Heat Map view** -- kompaktni mapa sveta s barevnym zvyraznenim

## Logika "Interest Score"

Kazda zeme dostane jedno cislo v procentech reprezentujici celkovou aktivitu. Vypocet:

```
interest = clicks + (leads * 10) + (sales * 50) + (earnings * 2)
```

Kazda metrika ma jinou vahu, protoze lead je cennejsi nez klik a sale cennejsi nez lead. Earnings se pocitaji s nizsim nasobkem, protoze uz jsou zachyceny v sales. Hodnoty se potom normalizuji na 0-100%, kde zeme s nejvyssim score = 100%.

Pri najeti kurzoru na stat se zobrazi tooltip: **"Czech Republic: 34.2%"**.

## UI Design

- Prepinac: maly toggle (ikony `List` a `Globe` nebo `Map`) v pravem hornim rohu CardHeader, vedle titulku
- Heat mapa: SVG mapa sveta (pouzijeme verejne dostupnou zjednodussenou SVG world map s ISO kody)
- Barvy: gradient od pruhledne/sede (0%) po barvu aktivni metriky (`metricColor`) pro 100%
- Mapa bude mit pan/zoom pomoci mysi (drag + scroll) ale zustavat ve fixnich rozmerech karty
- Staty bez dat budou sede

## Technicke kroky

1. **Novy soubor `src/components/analytics/WorldHeatMap.tsx`**
   - SVG komponenta s cestami pro kazdy stat (ISO 3166-1 alpha-2 kody)
   - Pouzije zjednodussenou SVG world map (inline, cca 50 nejdulezitejsich zemi + "rest of world" skupiny)
   - Prijem dat: `countries: CountryData[]`, `metricColor: string`
   - Interni vypocet interest score a normalizace
   - Hover tooltip s nazvem zeme + procenta
   - Interni pan/zoom stav (transform matrix) -- drag mysi pro posun, scroll pro zoom
   - Kontejner s `overflow: hidden` a fixni vyskou aby nepresahoval kartu

2. **Uprava `src/components/analytics/TopCountriesCard.tsx`**
   - Novy state: `viewMode: 'list' | 'map'`
   - Do CardHeader pridat toggle prepinac (dve male ikony `List` a `Globe`)
   - Podminkove renderovani: list view (soucasny kod) nebo `<WorldHeatMap />` komponenta
   - Props se nemeni -- karta prijima stejna data jako dosud

3. **Novy soubor `src/lib/worldMapPaths.ts`**
   - Export SVG path data pro jednotlive staty (klicovane ISO kodem)
   - Zjednodussena verze -- cca 60 nejdulezitejsich zemi s rozpoznatelnymi tvary

## Vizualni chovani

- Mapa zabira presne stejny prostor jako list view (zadna zmena velikosti karty)
- Zoom: scroll kolecekem (min 1x, max 4x)
- Pan: drag mysi
- Reset: double-click vrati na vychozi pozici
- Tooltip: maly popup u kurzoru s vlajkou + nazev + procenta
