
# Kompletní Přepracování Welcome Wizardu

## Shrnutí
Přepracování 5-krokového onboarding wizardu na efektivnější 4-krokový proces s lepší hodnotovou nabídkou, rozšířenými platformami a jasnější navigací.

---

## Analýza Současného Stavu

### Současná Struktura (5 kroků)
1. **Welcome** - Uvítací animace s tlačítkem "Continue"
2. **Link** - Pojmenování odkazu (nejasný účel)
3. **Source** - Výběr platformy (pouze 3 možnosti: Stripe, Gumroad, Shopify)
4. **Setup** - Statická ukázka custom domény (bez interakce)
5. **Success** - Zobrazení Ghost Linku s možností editace slugu

### Identifikované Problémy
- **Krok "Link"**: Vstupní pole "pojmenuj odkaz" je matoucí, uživatel neví proč to dělá
- **Krok "Source"**: Pouze 3 platformy, přitom máme loga pro 10+ platforem
- **Krok "Setup"**: Mrtvý krok bez reálné interakce, jen statická ukázka
- **Indikátor kroků**: Malé tečky, špatně čitelné, chybí názvy kroků
- **Chybí vysvětlení**: Nikde se nevysvětluje co Ghost Link vlastně dělá
- **Pending link**: Zobrazení URL z landing page je příliš malé a nevýrazné
- **Chybí tlačítko Zpět**: Uživatel nemůže navigovat zpět

---

## Navrhovaná Nová Struktura (4 kroky)

```text
+-----------+     +---------------+     +---------------+     +------------+
|  WELCOME  | --> |  VALUE PROPS  | --> |  PLATFORMS    | --> |  SUCCESS   |
|  (Intro)  |     |  (Co získáš)  |     |  (Integrace)  |     |  (Hotovo)  |
+-----------+     +---------------+     +---------------+     +------------+
```

### Krok 1: Welcome (Vylepšený)
**Změny:**
- Přidat sekci "Co získáš s Ghost Link"
- Zobrazit 3 hlavní benefity jako ikonky
- Prominentně zobrazit pending URL (pokud existuje)

**UI:**
```text
+----------------------------------------+
|           ✓ (zelená fajfka)            |
|                                        |
|   Welcome to the elite, [UserName].    |
|                                        |
|   +----------------------------------+ |
|   | 🔗 instagram.com/profile         | |  <- Pending URL chip
|   +----------------------------------+ |
|                                        |
|   What you'll unlock:                  |
|   📊 Real-time click tracking          |
|   💰 Revenue attribution               |
|   🎯 Smart placement analytics         |
|                                        |
|         [ Get Started → ]              |
+----------------------------------------+
```

### Krok 2: Value Props (NOVÝ - nahrazuje "Link")
**Změny:**
- Odstranit matoucí "pojmenuj odkaz"
- Ukázat jak Ghost Link funguje vizuálně
- Jednoduchý diagram flow: Link → Click → Sale → Dashboard

**UI:**
```text
+----------------------------------------+
|  [←]  (2) How It Works                 |
|                                        |
|   Your URL              Ghost Link     |
|   +----------+    →    +----------+    |
|   | shop.com |         | g.lnk/x  |    |
|   +----------+         +----------+    |
|                   ↓                    |
|        +--------------------+          |
|        |   📊 Dashboard     |          |
|        | Clicks, Sales, EPC |          |
|        +--------------------+          |
|                                        |
|   We track every click and attribute   |
|   sales back to specific placements.   |
|                                        |
|         [ Continue → ]                 |
+----------------------------------------+
```

### Krok 3: Connect Platforms (Vylepšený "Source")
**Změny:**
- Rozšířit ze 3 na 10+ platforem (využít existující loga)
- Grid layout 3x4 pro lepší přehlednost
- Možnost vybrat více platforem
- Kategorizace: Payment, Creator Economy, Affiliate

**Nové platformy:**
- Stripe, Gumroad, Shopify (stávající)
- ThriveCart, SamCart, ClickBank, Hotmart, Digistore24, Whop (z assets/logos)
- Beehiiv, ConvertKit, GoHighLevel (z assets/logos)

**UI:**
```text
+----------------------------------------+
|  [←]  (3) Connect Revenue Platforms    |
|                                        |
|  Select the platforms you use:         |
|                                        |
|  +--------+ +--------+ +--------+      |
|  | Stripe | |Gumroad | |Shopify |      |
|  +--------+ +--------+ +--------+      |
|  +--------+ +--------+ +--------+      |
|  |Thrive  | |ClickB. | | Whop  |      |
|  +--------+ +--------+ +--------+      |
|  +--------+ +--------+ +--------+      |
|  |Beehiiv | |Convert | |  ...  |      |
|  +--------+ +--------+ +--------+      |
|                                        |
|         [ Continue → ]                 |
|         Skip for now                   |
+----------------------------------------+
```

### Krok 4: Success (Vylepšený)
**Změny:**
- Zachovat stávající funkcionalitu (editovatelný slug)
- Přidat rychlý tip jak link použít
- Výraznější "Copy" tlačítko

---

## Horizontální Progress Bar

Nahradit malé tečky vizuálním progress barem s názvy kroků:

```text
+--------------------------------------------------+
| Welcome    How It Works    Platforms    Ready    |
|   ●─────────────●────────────○───────────○       |
+--------------------------------------------------+
```

**Implementace:**
- Vizuální čára propojující kroky
- Aktivní krok zvýrazněný primární barvou
- Dokončené kroky s fajfkou
- Klikatelné pro navigaci zpět

---

## Tlačítko Zpět

Přidat navigaci zpět na všech krocích kromě Welcome:

```text
+----------------------------------------+
|  [← Back]        (2) How It Works      |
+----------------------------------------+
```

---

## Technické Změny

### Soubory k Úpravě

**src/components/wizard/WelcomeWizard.tsx**
- Změnit `WizardStep` type: `'welcome' | 'value' | 'platforms' | 'success'`
- Přidat `handleBack()` funkci
- Rozšířit `platforms` array o nové platformy s PNG logy
- Přepsat UI pro každý krok
- Přidat novou komponentu `ProgressBar`

**Nové Komponenty:**
- `WizardProgressBar.tsx` - Horizontální progress bar
- `ValuePropsStep.tsx` - Nový krok s flow diagramem (volitelně)

### Struktura Dat - Rozšířené Platformy

```typescript
const platforms = [
  // Payment
  { id: 'stripe', name: 'Stripe', logo: '/logos/stripe.svg', category: 'payment' },
  { id: 'thrivecart', name: 'ThriveCart', logo: '/assets/logos/thrivecart.png', category: 'payment' },
  { id: 'samcart', name: 'SamCart', logo: '/assets/logos/samcart.png', category: 'payment' },
  
  // Creator Economy
  { id: 'gumroad', name: 'Gumroad', logo: '/logos/gumroad.svg', category: 'creator' },
  { id: 'whop', name: 'Whop', logo: '/assets/logos/whop.png', category: 'creator' },
  { id: 'beehiiv', name: 'Beehiiv', logo: '/assets/logos/beehiiv.png', category: 'creator' },
  { id: 'convertkit', name: 'ConvertKit', logo: '/assets/logos/convertkit.png', category: 'creator' },
  
  // Affiliate/E-commerce
  { id: 'shopify', name: 'Shopify', logo: '/logos/shopify.svg', category: 'ecommerce' },
  { id: 'clickbank', name: 'ClickBank', logo: '/assets/logos/clickbank.png', category: 'affiliate' },
  { id: 'digistore24', name: 'Digistore24', logo: '/assets/logos/digistore24.png', category: 'affiliate' },
  { id: 'hotmart', name: 'Hotmart', logo: '/assets/logos/hotmart.png', category: 'affiliate' },
  
  // Automation
  { id: 'gohighlevel', name: 'GoHighLevel', logo: '/assets/logos/gohighlevel.png', category: 'automation' },
];
```

---

## Vizuální Vylepšení

### Welcome Krok - Pending URL Chip
```text
<div class="bg-white/5 border border-white/10 rounded-full px-4 py-2">
  <Link2 icon /> instagram.com/profile
</div>
```

### Value Props - Benefity
```text
<div class="grid grid-cols-3 gap-4">
  <div class="flex flex-col items-center">
    <BarChart3 class="w-8 h-8 text-primary" />
    <span>Real-time Analytics</span>
  </div>
  ...
</div>
```

### Progress Bar - Styling
```text
<div class="flex items-center justify-between px-4 py-2 bg-muted/30 rounded-lg">
  {steps.map((step, i) => (
    <div class="flex items-center">
      <div class={cn(
        "w-6 h-6 rounded-full flex items-center justify-center",
        currentIndex > i ? "bg-success text-white" : 
        currentIndex === i ? "bg-primary text-white" : 
        "bg-muted text-muted-foreground"
      )}>
        {currentIndex > i ? <Check /> : i + 1}
      </div>
      <span class="ml-2 text-sm">{step.label}</span>
      {i < steps.length - 1 && <div class="w-8 h-0.5 bg-border mx-2" />}
    </div>
  ))}
</div>
```

---

## Poznámky k Implementaci

1. **Zachovat stávající funkce**: Editace slugu, ukládání do DB, localStorage logika
2. **Animace**: Použít stávající Framer Motion přechody (0.25s ease-out)
3. **Responsivita**: Grid platforem se přizpůsobí (3 sloupce desktop, 2 mobile)
4. **Accessibility**: Přidat aria-labels na progress bar a navigační tlačítka

---

## Očekávaný Výsledek

- **Kratší flow**: 4 kroky místo 5
- **Jasnější hodnota**: Uživatel okamžitě pochopí co Ghost Link dělá
- **Více integrací**: 12+ platforem místo 3
- **Lepší navigace**: Progress bar + tlačítko zpět
- **Profesionální dojem**: Konzistentní s "Linear-like" stylem aplikace
