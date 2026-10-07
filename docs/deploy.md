# Deploying

Tare is three pieces. Any host that runs a static site and a Node 24 service will do; I run it on free tiers.

| Piece               | What it needs                                                                                                                                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web (`apps/web`)    | Static hosting. Build: `npm ci && npm run build`, publish `apps/web/dist`. Env at build time: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_API_URL` (all public values). Needs an SPA rewrite: `/*` to `/index.html` |
| API (`apps/server`) | A Node 24 service. Build: `npm ci`. Start: `npm start -w @tare/server` (runs migrations, then listens). Env: `DATABASE_URL` (secret), `SUPABASE_URL`, `ALLOWED_ORIGINS`, optionally `PORT`                                          |
| Database + auth     | A Supabase project (Postgres with row-level security on every table, plus email-code auth). Schema is in `apps/server/migrations`                                                                                                   |
| Storybook           | Static hosting. Build: `npm ci && npm run build && npm run build-storybook -w @tare/ui`, publish `packages/ui/storybook-static`                                                                                                     |

A free API tier that sleeps when idle makes the first sync after a break slow. Sync runs in the background, so logging never waits for it.

## One-time setup

1. Create a Supabase project and set the auth options in [`supabase/README.md`](supabase/README.md).
2. Set `DATABASE_URL` on the API to the project's transaction-pooler connection string (port 6543).
3. Add the SPA rewrite on the web host.
4. Create your account: Supabase → Authentication → Users → Add user, with your email and auto-confirm on. The email must also be on the API's allowlist (below).

The web app's origin matters: the phone's local data is tied to it. If you move to a new domain, sync first, then sign in on the new address and restore.

## Allowing someone else in

```bash
DATABASE_URL=... SUPABASE_URL=... SUPABASE_SECRET_KEY=... npm run allow -w @tare/server -- someone@example.com
```
