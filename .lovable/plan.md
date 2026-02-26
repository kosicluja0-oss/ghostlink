

## Tablet Pricing Cards — Issues & Fixes

### Identified Problems (834px iPad)

1. **Business card "per month" text wraps** — price `$11.25` + "per month" breaks onto two lines because `md:scale-105` on the highlighted card shrinks available space
2. **Billing toggle area is cramped** — "Billed yearly" + "3 months free" badge wrap awkwardly on narrower cards
3. **Cards are too narrow** — `max-w-5xl` with 3-column grid + `gap-8` leaves each card quite tight at 834px
4. **Free card has wasted vertical space** — the billing toggle placeholder takes up room unnecessarily

### Plan

**File: `src/components/landing/PricingCard.tsx`**

1. Shorten "per month" to "/mo" on tablet breakpoint (always use "/mo" — cleaner)
2. Shorten "Billed yearly" to "Yearly" and reduce gap in the toggle row
3. Reduce font sizes slightly in the header area: price from `text-4xl` to `text-3xl md:text-4xl`

**File: `src/components/landing/PricingSection.tsx`**

4. Reduce gap from `gap-8` to `gap-4 lg:gap-8` for medium screens
5. Change `max-w-5xl` to `max-w-6xl` to give cards more breathing room on tablet
6. Remove `md:scale-105` on highlighted card (causes overflow/cramping) — replace with a more subtle visual distinction (thicker border + stronger shadow only)

