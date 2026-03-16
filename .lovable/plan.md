

## Plan: 3 Landing Page Trust & Conversion Upgrades

### 1. H1 Headline Tweak

**Current state:**
- H1: "Stop guessing. Start scaling."
- Sub-headline: "Ghost Link is the missing piece of your sales funnel. Track every click, lead, and sale from bio to bank account."

**Proposed change (file: `src/pages/Landing.tsx`, lines 169-180):**

Keep the punchy H1 but sharpen the sub-headline to communicate specific value and target audience:

- H1 stays: **"Stop guessing. Start scaling."** (it's strong, short, memorable)
- Sub-headline changes to: **"The tracking tool built for creators selling on Gumroad, Whop & social media. Get full-funnel insights — clicks, leads, sales — at a fraction of the cost."**

This anchors the product to a specific audience (creators, affiliates) and implies price advantage without sounding cheap.

---

### 2. Trust Section (new section between Pricing and FAQ)

**File: `src/pages/Landing.tsx`** — insert a new section between `<PricingSection />` and the FAQ section (around line 230).

A compact, centered trust bar with three trust signals side by side, using icons (Shield, CreditCard, Lock from lucide-react):

- **"No credit card required"** — Free plan, no strings attached.
- **"Secure Stripe checkout"** — Payments handled by Stripe.
- **"256-bit encryption"** — Your data is always protected.

Styled as a single-row horizontal layout (3 columns on desktop, stacked on mobile), with subtle icon + text pairs. Minimal design, no heavy card borders — just clean text with muted icons to feel trustworthy, not salesy.

---

### 3. "What's New" Modal

**New file: `src/components/landing/WhatsNewModal.tsx`**

A simple Dialog modal triggered from a "What's New" link in the navbar (next to Log in / Sign Up).

Content — a short changelog with timeline styling:

```text
v2.0 — Beta Launch
  Ghost Link V2 is live with real-time analytics,
  conversion tracking, and geographic insights.

Coming Soon
  LemonSqueezy & Gumroad native integrations.
  Team workspaces for agencies.
```

**File: `src/pages/Landing.tsx`** — add a "What's New" button/link in the navbar area (around line 120), opening the modal. Styled as a subtle ghost button or text link with a small sparkle/rocket icon.

---

### Summary of file changes

| File | Change |
|------|--------|
| `src/pages/Landing.tsx` | Update sub-headline text; add Trust section between Pricing and FAQ; add "What's New" button in navbar |
| `src/components/landing/WhatsNewModal.tsx` | New file — simple Dialog with changelog content |

