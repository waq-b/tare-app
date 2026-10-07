# Supabase setup

Dashboard settings that code can't set. Do these once per project.

## Authentication → Sign In / Providers → Email

- **Allow new users to sign up: off.** Accounts come from the allowlist only.
- **Email OTP length: 8** (must match `SIGN_IN_CODE_LENGTH` in `apps/web/src/auth/client.ts`).
- **Email OTP expiration: 600** seconds (the email says 10 minutes).

## Authentication → URL Configuration

- **Site URL:** your web app's URL.
- **Redirect URLs:** the web app's URL with `/**`, plus `http://localhost:5173/**` for local development.

## Authentication → Emails → Templates → Magic Link

- **Subject:** `Your Tare code: {{ .Token }}`
- **Body:** the contents of [`sign-in-code.html`](sign-in-code.html).

## Authentication → Emails → SMTP settings

Editing the template needs custom SMTP. Use any transactional email provider and give it a sender on a domain you control.

## Your account

Authentication → Users → Add user → Create new user, with your email and "Auto confirm" on. `npm run allow -w @tare/server` does both steps (see [`../deploy.md`](../deploy.md)).
