

# Branded Email Templates — Ghost Link

## Summary

Configure custom HTML email templates for verification and password reset emails, styled to match Ghost Link's dark UI aesthetic. Footer will display **ghostlink.app** as the domain.

## Design

Both templates share the same layout:

- Dark background (#141414), card (#1F1F1F), purple CTA button (#7C6BF0)
- Inline ghost icon SVG (no external images)
- System font stack for email client compatibility
- Footer: "Ghost Link · ghostlink.app"

## Emails

### 1. Email Verification
- Heading: "Verify your email"
- Body: "Thanks for signing up for Ghost Link. Click the button below to verify your email address."
- CTA: "Verify Email Address"
- Note: "This link will expire in 24 hours."

### 2. Password Reset
- Heading: "Reset your password"
- Body: "We received a request to reset your password. Click the button below to set a new one."
- CTA: "Reset Password"
- Note: "This link will expire in 1 hour. If you didn't request this, you can safely ignore this email."

## Technical Details

- Uses the **configure-auth** tool to set custom HTML templates
- Template variable `{{ .ConfirmationURL }}` for action links
- No code files modified — purely auth infrastructure configuration
- Footer text: `Ghost Link · ghostlink.app`

