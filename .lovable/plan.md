
# Plán: Změna věkového limitu na 16+ a přidání potvrzení při registraci

## Shrnutí
Změníme minimální věk z 18 na 16 let a přidáme povinný checkbox při registraci, kde uživatel potvrdí svůj věk a souhlas s podmínkami.

---

## Co se změní

### 1. Privacy Policy (`src/pages/Privacy.tsx`)
**Řádek 170** - změna textu:
- Z: "Ghost Link is not intended for users under 18 years of age"
- Na: "Ghost Link is not intended for users under 16 years of age"

### 2. Registrační formulář (`src/pages/Auth.tsx`)
Přidání povinného checkboxu pod pole "Confirm Password":

```text
┌─────────────────────────────────────────────────────────┐
│ ☐ I am at least 16 years old and agree to the          │
│   Terms of Service and Privacy Policy                   │
└─────────────────────────────────────────────────────────┘
```

- Checkbox bude povinný - tlačítko "Create Account" bude neaktivní dokud není zaškrtnutý
- Text bude obsahovat odkazy na `/terms` a `/privacy`
- Přidá se nový state `agreedToTerms: boolean`
- Validace `isSignupValid` se rozšíří o kontrolu checkboxu

---

## Jak to zajistí ochranu před mladšími uživateli?

**Standardní metoda v oboru:**
- **Self-certification** - uživatel sám potvrzuje svůj věk při registraci
- Toto je právně dostatečné pro běžné SaaS služby
- Přenáší odpovědnost na uživatele v případě lživého prohlášení

**Proč ne přísnější ověření:**
- Ghost Link není gambling ani adult content - nepotřebuje ID verifikaci
- Stripe (platební brána) provádí vlastní KYC při platbách
- Pro 16+ v EU (GDPR minimum) je checkbox dostatečný

---

## Technické detaily

### Nový state v Auth.tsx
```typescript
const [agreedToTerms, setAgreedToTerms] = useState(false);
```

### Aktualizovaná validace
```typescript
const isSignupValid = useMemo(() => {
  const emailValid = z.string().email().safeParse(email).success;
  return emailValid && passwordStrength.isStrong && passwordsMatch && agreedToTerms;
}, [email, passwordStrength.isStrong, passwordsMatch, agreedToTerms]);
```

### Nový Checkbox component
- Použije existující `@/components/ui/checkbox`
- Stylizace konzistentní s ostatními prvky formuláře
- Odkazy otevřou nové taby (`target="_blank"`)

---

## Soubory k úpravě

| Soubor | Změna |
|--------|-------|
| `src/pages/Privacy.tsx` | Změna "18" na "16" |
| `src/pages/Auth.tsx` | Přidání checkboxu + state + validace |

---

## Časový odhad
5-10 minut implementace
