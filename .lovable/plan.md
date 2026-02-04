
# Přidání sekce Email Notifikací do Settings

## Přehled
Přidáme novou sekci pro správu email notifikací s možností zapnout/vypnout:
- **Marketing emails** - novinky, tipy, speciální nabídky
- **Security alerts** - přihlášení z nového zařízení, změny hesla, podezřelá aktivita

## Technické změny

### 1. Databázová migrace
Přidáme dva nové sloupce do tabulky `profiles`:

```sql
ALTER TABLE profiles 
ADD COLUMN marketing_emails boolean DEFAULT true,
ADD COLUMN security_alerts boolean DEFAULT true;
```

### 2. Aktualizace useProfile hook
**Soubor:** `src/hooks/useProfile.ts`

Rozšíříme interface `Profile` a `ProfileUpdate` o nová pole:
```typescript
export interface Profile {
  // ... existující pole
  marketing_emails: boolean | null;
  security_alerts: boolean | null;
}

export interface ProfileUpdate {
  // ... existující pole
  marketing_emails?: boolean;
  security_alerts?: boolean;
}
```

### 3. Nová sekce v Settings
**Soubor:** `src/pages/Settings.tsx`

Přidáme novou kartu "Notifications" do pravého sloupce (mezi Billing a Delete Account):

```text
┌────────────────────────────────┐
│ 🔔 Notifications               │
│                                │
│ Marketing Emails        [ON]   │
│ Tips, news, special offers     │
│                                │
│ Security Alerts         [ON]   │
│ Login alerts, password changes │
└────────────────────────────────┘
```

**Komponenty:**
- Import `Switch` z `@/components/ui/switch`
- Import `Bell` ikony z `lucide-react`
- Dva Switch toggly s popisky
- Automatické ukládání při změně (real-time update)

### 4. Implementační detaily

**State management:**
```typescript
const [marketingEmails, setMarketingEmails] = useState(true);
const [securityAlerts, setSecurityAlerts] = useState(true);
```

**Sync s profilem:**
```typescript
useEffect(() => {
  if (profile) {
    setMarketingEmails(profile.marketing_emails ?? true);
    setSecurityAlerts(profile.security_alerts ?? true);
  }
}, [profile]);
```

**Handler pro změnu:**
```typescript
const handleNotificationChange = (field: 'marketing_emails' | 'security_alerts', value: boolean) => {
  updateProfile({ [field]: value });
  // Optimistic update
  if (field === 'marketing_emails') setMarketingEmails(value);
  else setSecurityAlerts(value);
};
```

## Výsledná UI struktura

```text
Pravý sloupec Settings:
├── 💳 Billing & Subscription
├── 🔔 Notifications          ← NOVÁ SEKCE
├── 🔧 Developer Tools (admin)
└── 🗑️ Delete Account
```

## Soubory k úpravě
1. **Databáze** - migrace pro přidání sloupců
2. `src/hooks/useProfile.ts` - rozšíření interfaces
3. `src/pages/Settings.tsx` - přidání Notifications sekce s Switch komponentami
