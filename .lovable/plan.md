

# Mobile Responsive Fixes

This plan addresses all mobile layout issues across the app to ensure clean, professional appearance on phones without changing the desktop experience.

## Issues Found

1. **Hero Link Input** - "Analyze & Track" button text is clipped on the right edge on small screens
2. **Landing Pricing Cards** - `scale-105` on Business card causes horizontal overflow on mobile; cards stack vertically but the middle card still has desktop scaling
3. **Onboarding Plans** - Same `scale-105` issue on mobile
4. **Comparison Section** - "vs" indicator is placed after both cards instead of between them on mobile
5. **Dashboard Stats Grid** - 6 stat cards in `grid-cols-2` can feel cramped; the activity table columns overflow on narrow screens
6. **Dashboard Activity Table** - 5 columns with avatar, description, amount, date don't fit well at 390px
7. **LinkTable** - Metrics columns (Clicks/Leads/Sales numbers + actions) overflow horizontally on mobile

## Changes

### 1. `src/components/landing/HeroLinkInput.tsx`
- Change the input+button container from single-row flex to **stack vertically on mobile** (`flex-col sm:flex-row`)
- Make button full-width on mobile, inline on desktop
- Adjust padding on the outer container for mobile

### 2. `src/pages/Landing.tsx` (Pricing section)
- Remove `scale-105` on mobile for the highlighted Business card: change to `md:scale-105` so scaling only applies on desktop
- Ensure pricing cards stack cleanly on mobile with consistent spacing

### 3. `src/pages/OnboardingPlans.tsx`
- Same `scale-105` fix as Landing pricing: use `md:scale-105` 
- Ensure cards stack properly on mobile

### 4. `src/components/landing/ComparisonSection.tsx`
- Move the "vs" indicator to render **between** the two cards using flex ordering, or restructure the grid to place it correctly on mobile

### 5. `src/pages/Dashboard.tsx`
- Hide less critical columns (avatar/description, amount) on mobile in the activity table
- Ensure stat cards at `grid-cols-2` have proper spacing

### 6. `src/components/links/LinkTable.tsx`
- Hide Leads/Sales metric columns on mobile (show only Clicks)
- Ensure link row fits within 390px width without horizontal scroll

## Technical Details

- All changes use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) to conditionally apply styles
- No changes affect desktop layout - only adding mobile-specific overrides
- No new dependencies needed

