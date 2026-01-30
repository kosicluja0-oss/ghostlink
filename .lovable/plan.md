
# Dynamický Welcome Wizard podle Plánu Uživatele

## Shrnutí
Upravit Welcome Wizard tak, aby se přizpůsobil zvolenému plánu uživatele. Free uživatelé uvidí zkrácený wizard bez kroku platforem, protože nemají přístup k revenue tracking.

---

## Analýza Funkcí podle Plánů

### Pricing Karty - Funkce

| Funkce | Free | Pro | Business |
|--------|------|-----|----------|
| Active links | 25 | 100 | 175 |
| Click tracking | ✅ | ✅ | ✅ |
| Leads & Sales tracking | ❌ | ✅ | ✅ |
| Full analytics | ❌ | ✅ | ✅ |
| Bridge pages | ❌ | ✅ | ✅ |
| Team collaboration | ❌ | ❌ | ✅ |
| API access | ❌ | ❌ | ✅ |

### Klíčový Rozdíl
- **Free plan**: Pouze click tracking - nepotřebuje napojení na revenue platformy
- **Pro/Business**: Plné revenue tracking - potřebuje výběr platforem pro postback integraci

---

## Navrhovaná Struktura Wizardu

### Free Plan Flow (3 kroky)
```text
+------------+     +----------------+     +------------+
|  WELCOME   | --> |  HOW IT WORKS  | --> |  SUCCESS   |
|  (Intro)   |     |  (Click Focus) |     |  (Ready)   |
+------------+     +----------------+     +------------+
```

**Změny oproti full flow:**
- Přeskočit krok "Platforms" (Connect Revenue Platforms)
- "How It Works" krok se zaměří pouze na click tracking
- Progress bar ukáže pouze 3 kroky

### Pro/Business Flow (4 kroky) - beze změny
```text
+------------+     +----------------+     +-------------+     +------------+
|  WELCOME   | --> |  HOW IT WORKS  | --> |  PLATFORMS  | --> |  SUCCESS   |
|  (Intro)   |     |  (Full Value)  |     |  (Revenue)  |     |  (Ready)   |
+------------+     +----------------+     +-------------+     +------------+
```

---

## Technické Změny

### 1. Předání `tier` do WelcomeWizard

**Dashboard.tsx** - předat tier jako prop:
```typescript
<WelcomeWizard 
  userName={user.email?.split('@')[0]} 
  tier={subscriptionTier}  // Nový prop
  onComplete={handleWizardComplete}
/>
```

### 2. Úprava WelcomeWizard.tsx

**Nové props interface:**
```typescript
interface WelcomeWizardProps {
  userName?: string;
  tier?: 'free' | 'pro' | 'business';  // Nový prop
  onComplete: () => void;
  onLinkCreated?: () => void;
}
```

**Dynamické kroky podle tieru:**
```typescript
const isFreeUser = tier === 'free';

// Různé kroky pro různé plány
const WIZARD_STEPS_FREE = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'value', label: 'How It Works' },
  { id: 'success', label: 'Ready' },
];

const WIZARD_STEPS_PAID = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'value', label: 'How It Works' },
  { id: 'platforms', label: 'Platforms' },
  { id: 'success', label: 'Ready' },
];

const activeSteps = isFreeUser ? WIZARD_STEPS_FREE : WIZARD_STEPS_PAID;
```

### 3. Upravený "How It Works" Krok

**Pro Free uživatele** - zaměření na click tracking:
```text
+----------------------------------------+
|  How Ghost Link Works                  |
|                                        |
|   Your URL    →    Ghost Link          |
|   [shop.com]       [g.lnk/xyz]         |
|                                        |
|   ┌──────────────────────────────────┐ |
|   │  📊 Every click is tracked       │ |
|   │  🌍 Geographic insights          │ |
|   │  📱 Device & browser data        │ |
|   └──────────────────────────────────┘ |
|                                        |
|   [ Continue → ]                       |
+----------------------------------------+
```

**Pro Pro/Business uživatele** - plné revenue tracking (stávající):
```text
+----------------------------------------+
|  How Ghost Link Works                  |
|                                        |
|   Your URL    →    Ghost Link          |
|   [shop.com]       [g.lnk/xyz]         |
|                   ↓                    |
|   [Clicks]  [Sales]  [EPC]             |
|                                        |
|   [ Continue → ]                       |
+----------------------------------------+
```

### 4. Navigační Logika

**Free flow navigace:**
```typescript
// Po "value" kroku přeskočit přímo na "success"
const handleValueContinue = () => {
  if (isFreeUser) {
    handleInitialize(); // Vytvořit link a jít na success
  } else {
    setStep('platforms');
  }
};
```

### 5. Welcome Krok - Personalizované Benefity

**Free uživatel:**
```text
What you'll unlock:
📊 Real-time Click Tracking
🌍 Geographic Insights  
📱 Device Analytics
```

**Pro/Business uživatel:**
```text
What you'll unlock:
📊 Real-time Tracking
💰 Revenue Attribution
🎯 Smart Analytics
```

### 6. Success Krok - Upgrade CTA pro Free

**Pro Free uživatele** přidat upgrade hint:
```text
+----------------------------------------+
|  ✓ You're all set!                     |
|                                        |
|  Your Ghost Link is live.              |
|  [g.lnk/your-link]                     |
|                                        |
|  ┌────────────────────────────────────┐|
|  │ 💡 Want to track sales & revenue?  │|
|  │    Upgrade to Pro →                │|
|  └────────────────────────────────────┘|
|                                        |
|  [ Copy Ghost Link ]                   |
|  [ Go to Dashboard ]                   |
+----------------------------------------+
```

---

## Soubory k Úpravě

1. **src/components/wizard/WelcomeWizard.tsx**
   - Přidat `tier` prop
   - Podmíněné kroky podle tieru
   - Upravené benefity pro free vs paid
   - Upravený "How It Works" krok
   - Upgrade CTA na success kroku pro free

2. **src/pages/Dashboard.tsx**
   - Předat `tier` do WelcomeWizard komponenty

3. **src/components/wizard/WizardProgressBar.tsx**
   - Dynamicky přijímat různý počet kroků (již podporuje)

---

## Vizuální Porovnání

### Free User Journey
```text
[Welcome] ─── [How It Works] ─── [Success + Upgrade CTA]
    │              │                    │
    │              │                    └─ "Want revenue tracking? Upgrade →"
    │              └─ Click tracking only
    └─ "Track every click"
```

### Pro/Business User Journey
```text
[Welcome] ─── [How It Works] ─── [Platforms] ─── [Success]
    │              │                  │              │
    │              │                  │              └─ Full features
    │              │                  └─ Connect Stripe, ClickBank, etc.
    │              └─ Clicks + Sales + EPC
    └─ "Track clicks & attribute revenue"
```

---

## Poznámky k Implementaci

1. **Získání tieru**: Použít `useSubscription()` hook v Dashboard a předat tier do wizardu
2. **Default tier**: Pokud tier není k dispozici, použít 'free' jako fallback
3. **Konzistence**: Texty benefitů musí odpovídat pricing kartám
4. **Upgrade CTA**: Link na /onboarding/plans nebo Settings s billing options
