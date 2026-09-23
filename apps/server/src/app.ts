// The Tare API. Every route but /health needs a valid Supabase token; data routes also need
// the caller's email on the allowlist (sign-ups are off, decision #68).
import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import type { Sql } from 'postgres';
import { refuseEveryone, type TokenVerifier, type VerifiedUser } from './auth/jwt.ts';
import { syncRoutes } from './sync/routes.ts';

declare module 'fastify' {
  interface FastifyRequest {
    /** Set once the token verifies and the email is on the allowlist. */
    allowedUser?: VerifiedUser;
  }
}

export interface AppOptions {
  sql: Sql;
  verifier?: TokenVerifier;
  /** Browser origins allowed to call the API. */
  origins?: readonly string[];
  logger?: boolean;
}

export async function buildApp(opts: AppOptions): Promise<FastifyInstance> {
  const { sql, verifier = refuseEveryone } = opts;
  const app = Fastify({ logger: opts.logger ?? false, bodyLimit: 2 * 1024 * 1024 });
  await app.register(cors, {
    origin: [...(opts.origins ?? [])],
    methods: ['GET', 'POST'],
    allowedHeaders: ['authorization', 'content-type'],
    maxAge: 86400,
  });

  app.get('/health', async () => ({ ok: true }));

  app.addHook('onRequest', async (req, reply) => {
    if (req.method === 'OPTIONS' || req.url === '/health') return;
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    const user = token ? await verifier.verify(token) : null;
    if (!user) return reply.code(401).send({ error: 'unauthorised' });
    const allowed = await sql`select 1 from public.allowed_users where email = ${user.email}`;
    if (!allowed.length) return reply.code(403).send({ error: 'not_allowed' });
    req.allowedUser = user;
  });

  syncRoutes(app, sql);
  return app;
}
