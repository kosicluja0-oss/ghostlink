
# Vylepšení rozložení Settings stránky

## Současný problém
- Všechny sekce jsou v jednom úzkém sloupci (`max-w-4xl`)
- Uživatel musí scrollovat dolů pro zobrazení všech sekcí
- Plýtvání horizontálním prostorem na větších obrazovkách

## Navrhované řešení

Přepracovat layout na **dvousloupcové rozložení** na větších obrazovkách:

```text
┌─────────────────────────────────────────────────────────────────┐
│  Settings                                                        │
│  Manage your account preferences and subscription               │
├────────────────────────────────┬────────────────────────────────┤
│                                │                                │
│  ┌──────────────────────────┐  │  ┌──────────────────────────┐  │
│  │ 👤 Profile               │  │  │ 💳 Billing & Subscription│  │
│  │   Avatar, Name, Email    │  │  │   Current plan, Features │  │
│  │   Save Changes button    │  │  │   Upgrade/Manage button  │  │
│  └──────────────────────────┘  │  └──────────────────────────┘  │
│                                │                                │
│  ┌──────────────────────────┐  │  ┌──────────────────────────┐  │
│  │ 🌐 Preferences           │  │  │ 🗑️ Delete Account        │  │
│  │   Currency, Timezone     │  │  │   Danger zone button     │  │
│  └──────────────────────────┘  │  └──────────────────────────┘  │
│                                │                                │
│  ┌──────────────────────────┐  │  ┌──────────────────────────┐  │
│  │ 🔒 Security              │  │  │ 🔧 Developer Tools       │  │
│  │   Change Password        │  │  │   (only for admin)       │  │
│  └──────────────────────────┘  │  └──────────────────────────┘  │
│                                │                                │
└────────────────────────────────┴────────────────────────────────┘
```

### Klíčové změny

| Změna | Popis |
|-------|-------|
| Šířka kontejneru | `max-w-4xl` → `max-w-7xl` (více prostoru) |
| Layout | Jednoduchý `space-y-6` → CSS Grid `grid-cols-1 lg:grid-cols-2` |
| Responzivita | Na mobilu zůstane jeden sloupec, na desktopu dva |
| Logické seskupení | Levý sloupec: osobní údaje / Pravý sloupec: billing a admin |

### Responzivní chování
- **Mobil (< 1024px)**: Jeden sloupec, klasické vertikální scrollování
- **Desktop (≥ 1024px)**: Dva sloupce vedle sebe, minimální scrollování

## Technická implementace

### Soubor k úpravě
`src/pages/Settings.tsx`

### Hlavní změny v kódu
1. Změnit `max-w-4xl` na `max-w-7xl` pro širší kontejner
2. Zabalit sekce do CSS Grid s `grid-cols-1 lg:grid-cols-2 gap-6`
3. Levý sloupec: Profile, Preferences, Security
4. Pravý sloupec: Billing, Delete Account, Developer Tools (admin)

## Výsledek
- Všechny sekce viditelné bez scrollování na desktopu
- Efektivnější využití horizontálního prostoru
- Zachována plná funkčnost na mobilních zařízeních
