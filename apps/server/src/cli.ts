// Let someone in:  npm run allow -w @tare/server -- someone@example.com
// Adds the email to the allowlist and, with SUPABASE_SECRET_KEY set, creates their Supabase
// account (sign-ups are off, so the app can't). Needs DATABASE_URL and SUPABASE_URL.
import postgres from 'postgres';

const [cmd, raw] = process.argv.slice(2);
if (cmd !== 'allow' || !raw) {
  console.error('usage: node src/cli.ts allow <email>');
  process.exit(1);
}
const email = raw.trim().toLowerCase();
const db = process.env['DATABASE_URL'];
if (!db) throw new Error('DATABASE_URL is not set');

const sql = postgres(db, { max: 1, prepare: false });
await sql`insert into public.allowed_users (email) values (${email}) on conflict do nothing`;
console.log(`allowlist: ${email}`);
await sql.end();

const url = process.env['SUPABASE_URL'];
const key = process.env['SUPABASE_SECRET_KEY'];
if (url && key) {
  const res = await fetch(`${url.replace(/\/$/, '')}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ email, email_confirm: true }),
  });
  if (res.ok) console.log(`supabase: account created for ${email}`);
  else if (res.status === 422) console.log(`supabase: ${email} already has an account`);
  else throw new Error(`supabase: ${res.status} ${await res.text()}`);
} else {
  console.log('supabase: SUPABASE_SECRET_KEY not set, so create the account in the dashboard');
}
