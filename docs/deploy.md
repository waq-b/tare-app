# Deploy

| Piece           | Where                                                     | Notes                                                                                                                                                              |
| --------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tare-web`      | Render static site, auto-deploys `main`                   | `npm ci && npm run build`, publishes `apps/web/dist`. Env: `NODE_VERSION=24`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_API_URL` (public values) |
| `tare-api`      | Render web service (free, Frankfurt), auto-deploys `main` | `npm ci`, then `npm start -w @tare/server` (runs migrations, then listens). Env: `NODE_VERSION=24`, `SUPABASE_URL`, `ALLOWED_ORIGINS`, `DATABASE_URL` (secret)     |
| Database + auth | Supabase project `tare` (free, London)                    | Schema from `apps/server/migrations`; RLS on everywhere                                                                                                            |
| Storybook       | Render static site `tare-storybook`                       | Unchanged                                                                                                                                                          |

The free API sleeps after 15 minutes idle, so the first sync after a break takes up to a minute. Sync runs in the background, so logging never waits for it.

## Steps only Waqar can do (secrets and accounts)

1. **`DATABASE_URL` on `tare-api`:** Supabase → Project settings → Database → Connection string → **Transaction pooler** (port 6543), with the database password. Paste it into Render → `tare-api` → Environment as `DATABASE_URL`. It saves and redeploys
2. **Supabase auth settings:** see [`supabase/README.md`](supabase/README.md) (sign-ups off, 8-digit code, 10-minute expiry, URLs, email template, Resend SMTP)
3. **Your account:** Supabase → Authentication → Users → Add user → your email, auto-confirm on. (Your email is already on the allowlist.)
4. **SPA rewrite on `tare-web`:** Render → `tare-web` → Redirects/Rewrites → Source `/*`, Destination `/index.html`, Action **Rewrite**
5. **Domains (#67):** Cloudflare DNS, both **DNS only** (grey cloud) so Render can issue certificates:
   - `tare` CNAME `tare-web.example.com`, then Render → `tare-web` → Custom domains → `tare.example.com`
   - `api.tare` CNAME `tare-api.example.com`, then Render → `tare-api` → Custom domains → `api.tare.example.com`
   - After that, `VITE_API_URL` on `tare-web` becomes `https://api.tare.example.com` (Claude can do this step)

## Allowing someone else in

```bash
DATABASE_URL=... SUPABASE_URL=... SUPABASE_SECRET_KEY=... npm run allow -w @tare/server -- someone@example.com
```
