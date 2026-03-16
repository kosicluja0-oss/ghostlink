

# Pricing Page — Plan

## Co se změní

1. **Nová stránka `/pricing`** (`src/pages/Pricing.tsx`)
   - Samostatná stránka s detailním srovnáním všech tří plánů (Free, Pro, Business)
   - Rozložení: nahoře pricing karty (reuse `PricingCard` + `PricingSection` logika), pod tím **feature comparison table** — řádky s checkmarky/křížky pro každý plán
   - Feature tabulka bude obsahovat kategorie: Tracking (clicks, leads, sales, revenue), Analytics (real-time, geographic, EPC, conversion rates), Integrations, Support level, API access, Team collaboration
   - FAQ sekce dole (reuse accordion pattern z landing page)
   - Stejný tmavý styl jako landing page

2. **Tlačítko "Pricing" do navbar** (`src/pages/Landing.tsx`)
   - Přidá se `<Link to="/pricing">` mezi logo a Log in tlačítko
   - Styl: `variant="ghost"`, stejná velikost jako Log in

3. **Route v App.tsx**
   - Přidá se `<Route path="/pricing" element={<Pricing />} />` (veřejná, bez ProtectedRoute)

## Struktura pricing stránky

```text
┌─────────────────────────────────────────┐
│  Navbar (logo + Pricing + Login/Signup) │
├─────────────────────────────────────────┤
│  Headline: "Choose Your Plan"           │
│  Billing toggle (monthly/yearly)        │
│                                         │
│  ┌─────┐  ┌─────┐  ┌─────┐             │
│  │Free │  │ Pro │  │Biz  │             │
│  │ $0  │  │ $10 │  │ $15 │             │
│  │ CTA │  │ CTA │  │ CTA │             │
│  └─────┘  └─────┘  └─────┘             │
│                                         │
│  ── Feature Comparison Table ──         │
│  Active links     25    100    175      │
│  Click tracking    ✓     ✓      ✓       │
│  Lead tracking     ✗     ✓      ✓       │
│  Sale tracking     ✗     ✓      ✓       │
│  Full analytics    ✗     ✓      ✓       │
│  Geo insights      ✗     ✓      ✓       │
│  Priority support  ✗     ✓      ✓       │
│  API access        ✗     ✗      ✓       │
│  Team collab       ✗     ✗      ✓       │
│  Dedicated support ✗     ✗      ✓       │
│                                         │
│  ── FAQ ──                              │
│  Can I switch plans?                    │
│  What happens when I cancel?            │
│  ...                                    │
│                                         │
│  Footer                                │
└─────────────────────────────────────────┘
```

## Technické detaily

- Plan data a checkout logika se reusne z `PricingSection` / `PricingCard` — extrahuje se `pricingPlans` objekt do sdíleného souboru nebo se importuje přímo
- Feature comparison tabulka bude nová komponenta `src/components/pricing/FeatureComparisonTable.tsx`
- Na mobilu se tabulka horizontálně scrolluje nebo se změní na stacked karty
- Navbar pricing tlačítko se přidá i na samotnou pricing stránku (sdílený header)

