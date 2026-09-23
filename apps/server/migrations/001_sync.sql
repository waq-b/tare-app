-- Sync store for the local-first app. The phone is the source of truth for its user's data;
-- this keeps a copy per user and hands out changes since a cursor. Records are the app's own
-- JSON (apps/web/src/db/model.ts), last write wins by updated_at.
--
-- RLS is on for every table. The API runs each request as the `authenticated` role with the
-- caller's JWT claims set (Supabase's auth.uid() reads them), so Postgres itself refuses rows
-- that aren't the caller's.

create sequence if not exists public.records_seq;

create table if not exists public.records (
  user_id uuid not null,
  tbl text not null check (tbl in ('profile', 'screening', 'plans', 'workouts', 'sets', 'weighIns', 'painFlags')),
  id text not null,
  updated_at bigint not null,
  deleted boolean not null default false,
  data jsonb not null,
  -- Bumped on every change; the pull cursor.
  seq bigint not null default nextval('public.records_seq'),
  primary key (user_id, tbl, id)
);

create index if not exists records_user_seq on public.records (user_id, seq);

alter table public.records enable row level security;

drop policy if exists records_own on public.records;
create policy records_own on public.records
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Supabase grants new public tables to anon and authenticated by default: be explicit.
revoke all on public.records from anon, authenticated;
grant select, insert, update on public.records to authenticated;
grant usage on sequence public.records_seq to authenticated;

-- Who may use Tare (sign-ups are off; decision #68). Read by the API as the owner only.
create table if not exists public.allowed_users (
  email text primary key check (email = lower(email)),
  added_at timestamptz not null default now()
);

alter table public.allowed_users enable row level security;
-- No grants and no policies: only the API's owner role reads the allowlist.
revoke all on public.allowed_users from anon, authenticated;
