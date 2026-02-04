
# Collapsible sekce v Settings

## Cíl
Převést sekce Preferences, Notifications, Security a Billing na vysouvací (accordion), aby stránka Settings byla kompaktnější a nepotřebovala scroll.

## Výsledná struktura

```text
┌─────────────────────────────────────────┐
│  Settings Header                        │
├─────────────────────────────────────────┤
│  Profile (vždy viditelný)               │
│  - Avatar, jméno, email                 │
│  - Save button                          │
├─────────────────────────────────────────┤
│  ▸ Preferences                    [+]   │
├─────────────────────────────────────────┤
│  ▸ Notifications                  [+]   │
├─────────────────────────────────────────┤
│  ▸ Security                       [+]   │
├─────────────────────────────────────────┤
│  ▸ Billing & Subscription         [+]   │
├─────────────────────────────────────────┤
│  [Download My Data]  [Delete Account]   │
└─────────────────────────────────────────┘
```

## Technické změny

**Soubor:** `src/pages/Settings.tsx`

1. Import Accordion komponenty
2. Profile sekce zůstane jako samostatná Card (bez změny)
3. Sekce 2-5 zabalit do `<Accordion type="multiple">`:
   - Každá sekce bude `AccordionItem` s:
     - `AccordionTrigger` - obsahuje ikonu + název sekce
     - `AccordionContent` - obsahuje původní CardContent
4. Zachovat vizuální styl (ikony, barvy) v triggerech
5. Admin Developer Tools (pokud je uživatel admin) - také jako accordion item
6. Footer akce zůstanou nezměněny

## Vizuální design accordion triggerů

Každý trigger bude obsahovat:
- Ikonu sekce (Globe, Bell, Lock, CreditCard)
- Název sekce
- Popisek (menší text)
- Chevron pro indikaci stavu (automaticky z Accordion komponenty)

## Výhody
- Stránka se vejde na obrazovku bez scrollování
- Uživatel vidí přehled všech sekcí najednou
- Může otevřít více sekcí současně (`type="multiple"`)
- Profile s avatarem je vždy viditelný (nejčastější interakce)
