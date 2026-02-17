

# Make Integrations Page Fully Functional

## Critical Bug Fix

The biggest issue: the Connect modal generates a "preview token" (e.g., `gl_abc1234567`) and shows it in the webhook URL for the user to copy. But when the user clicks "I've Pasted It", the `useIntegrations.connect()` function generates a COMPLETELY DIFFERENT token and saves that to the database. The URL the user copied will never work -- it references a token that doesn't exist in the DB.

**Fix**: Pass the preview token from the modal into the `connect()` function so the saved token matches what the user copied.

## Manage Flow for Connected Integrations

Currently, clicking "Manage" on a connected integration re-opens the same 3-step connect wizard, which makes no sense. Need a separate "Manage" view that shows:
- The active webhook URL (from DB)
- Option to re-assign to a different link
- Disconnect button
- Connection status and last verified timestamp

## Disconnect Functionality

The `useIntegrations` hook already has a `disconnect()` method but it's never exposed in the UI. Wire it into the new Manage view.

## "All Links (Global)" Breaks Postback

When user selects "All Links (Global)" in step 3, `link_id` is saved as `null`. The postback Edge Function then can't find any click to attribute the conversion to and returns a 422 error. 

**Fix**: When `link_id` is null in token mode, find the most recent click across ALL of the user's links (not just one specific link).

---

## Technical Plan

### 1. Fix Token Mismatch (useIntegrations.ts)
- Add optional `webhookToken` parameter to `connect()` mutation
- If provided, use it instead of generating a new one
- This ensures the token shown in the modal = the token in DB

### 2. Fix "All Links" in Postback Edge Function (supabase/functions/postback/index.ts)
- When `integration.link_id` is null, query all links owned by `integration.user_id`
- Find the most recent click across all user's links
- If no clicks exist, create a virtual click on the user's first/most recent link

### 3. Add Manage Integration Modal (new file: src/components/integrations/ManageIntegrationModal.tsx)
- Shows webhook URL with copy button
- Displays assigned link (or "All Links")
- Link re-assignment dropdown
- Disconnect button with confirmation
- Last verified timestamp

### 4. Update ConnectServiceModal.tsx
- Pass `previewToken` to `onConfirmConnection` (already does this, but it's ignored by the parent)

### 5. Update Integrations.tsx
- Pass the webhook token from modal to `connect()` call
- Route "Manage" clicks (connected/pending integrations) to the new ManageIntegrationModal
- Route "Connect" clicks (not_connected) to the existing ConnectServiceModal

### 6. Remove Incorrect Integrations
- Remove Discord, Telegram, Slack from the list -- these are outbound notification services, not inbound webhook sources. They require a completely different architecture (Ghost Link would need to SEND data TO them, not receive FROM them). Keeping them is misleading.
- Alternatively, mark them as "Coming Soon" if we want to build that later.

