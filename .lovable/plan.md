
# Admin "Manage Subscription" Button

## What changes
Add a "Manage Subscription" button into the existing **Developer Tools** admin section (visible only to admin users). This button will call the same `openCustomerPortal()` function, but will be available regardless of `subscription_status` -- allowing the admin to open the Stripe Customer Portal even without an active subscription.

## Technical Details

### File: `src/pages/Settings.tsx`

Inside the existing admin `AccordionItem` (lines 766-812), after the "Test Tier Switching" block, add a new subsection:

- A separator line
- Label: "Stripe Customer Portal"
- A short description: "Open Stripe portal without active subscription requirement"
- A "Manage Subscription" button with `ExternalLink` icon, using the existing `handleManageSubscription` handler and `portalLoading` state
- This button is always enabled (no `isSubscribed` check)

No new state, hooks, or files needed -- everything reuses existing logic.
