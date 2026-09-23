# Supabase setup (project `tare`, London)

Supabase's dashboard settings that code can't set. Do these once; redo them if the project is ever recreated.

## Authentication → Sign In / Providers → Email

- **Allow new users to sign up: off.** Accounts come from the allowlist only (decision #68)
- **Email OTP length: 8** (must match `SIGN_IN_CODE_LENGTH` in `apps/web/src/auth/client.ts`)
- **Email OTP expiration: 600** seconds (the email says 10 minutes)

## Authentication → URL Configuration

- **Site URL:** `https://tare.example.com`
- **Redirect URLs:** `https://tare.example.com/**`, `https://tare-web.example.com/**`, `http://localhost:5173/**`

## Authentication → Emails → Templates → Magic Link

- **Subject:** `Your Tare code: {{ .Token }}`
- **Body:** the contents of [`sign-in-code.html`](sign-in-code.html)

## Authentication → Emails → SMTP settings

Supabase's built-in mailer sends only a few emails an hour. Use Resend, as pip does: sender `Tare <tare@mail.example.com>`, host `smtp.resend.com`, port 465, user `resend`, password = a Resend API key (kept in Supabase only, never in this repo).

## Your account

**Authentication → Users → Add user → Create new user** with your email, "Auto confirm" on (your email is already on the API's allowlist). Later, `npm run allow -w @tare/server` does both (see [`../deploy.md`](../deploy.md)).
