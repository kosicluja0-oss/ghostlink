
# Ghost Link — Application Fixes & User Experience Improvements

## Summary of Changes

Based on the full application review, here are the concrete changes to implement:

---

## 1. Fix domain branding everywhere: "ghost.link/" → "ghstlink.com/"

The tracking domain prefix `ghost.link/` appears in the Create Link modal but the real tracking domain is `ghstlink.com`. The `getTrackingBaseUrl()` helper in `src/lib/trackingUrl.ts` already returns the correct domain. We need to update:

- **`src/components/links/CreateLinkModal.tsx`** (line 120-121): Replace the hardcoded `ghost.link/` with the actual tracking base URL from `getTrackingBaseUrl()` or `getDisplayUrl()`.
- **Search the entire codebase** for any other hardcoded `ghost.link` references and replace them.

---

## 2. Fix broken "Watch Tutorial" link

In `src/components/links/LinksEmptyState.tsx` (line 64), the button opens `https://docs.ghostlink.dev/getting-started` which does not exist. Per your preference, we will keep the button but point it to a temporary placeholder URL (e.g., `https://ghstlink.com` or a YouTube link you provide later). For now we will just change it to open the landing page as a fallback.

---

## 3. Add subtitle to Links page header

In `src/pages/Links.tsx` (lines 85-88), the header section has an empty `<p>` tag. We will add a helpful subtitle like: "Create tracking links and monitor clicks, leads, and sales in real-time."

---

## 4. Fix Dashboard content clipping

In `src/pages/Dashboard.tsx` (line 361), the `<main>` element uses `h-screen overflow-hidden` which clips content on smaller screens. We will change it to `overflow-y-auto scrollbar-hide` so that all content remains accessible.

---

## 5. Add first-time contextual tip banner

After the wizard completes and the user is on the Dashboard or Links page with no data, show a small dismissible tip card:
- "Get started: Create your first tracking link, share it with your audience, and watch the data roll in."
- Stored in `localStorage` so it only appears once.
- Clean, minimal design matching the existing card style.
- Shows on the Dashboard when `hasClicks === false` and wizard is completed.

---

## 6. Add inline category descriptions on Integrations page

Each integration category heading (Payment Platforms, Affiliate Networks, etc.) currently has no subtitle. Add a one-line explanation below each, e.g.:
- Payment Platforms: "Connect payment processors to automatically track sales."
- Creator Economy: "Track revenue from memberships, tips, and subscriptions."
- Affiliate Networks: "Monitor commissions and affiliate sales."
- Automation: "Connect with workflow automation tools."
- Marketing/CRM: "Sync leads and subscribers automatically."

This text already exists in the `CATEGORIES` array as the `description` field (lines 61-67 of Integrations.tsx) — it just needs to be rendered.

---

## Technical Details

### Files to modify:
1. `src/components/links/CreateLinkModal.tsx` — import `getTrackingBaseUrl()`, replace hardcoded domain
2. `src/components/links/LinksEmptyState.tsx` — update tutorial URL
3. `src/pages/Links.tsx` — add subtitle text
4. `src/pages/Dashboard.tsx` — fix overflow on main, add first-time tip component
5. `src/pages/Integrations.tsx` — render existing category descriptions

### No database or backend changes needed
All changes are purely frontend/UI.
