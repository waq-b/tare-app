// Verifies Supabase access tokens against the project's published signing keys, as pip does
// (decision #68). Issuer and audience are both checked, so a token from another project, or
// one not meant for a signed-in user, is refused.
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

export interface VerifiedUser {
  /** `sub`: the user's id in Supabase auth.users. */
  userId: string;
  email: string;
}

export interface TokenVerifier {
  /** Null for anything that isn't a valid, current token from our project. */
  verify(token: string): Promise<VerifiedUser | null>;
}

export function supabaseVerifier(options: {
  issuer: string;
  keys: JWTVerifyGetKey;
}): TokenVerifier {
  return {
    async verify(token) {
      try {
        const { payload } = await jwtVerify(token, options.keys, {
          issuer: options.issuer,
          audience: 'authenticated',
          // Asymmetric only: a token can't pick an algorithm we didn't intend.
          algorithms: ['ES256', 'RS256'],
        });
        const email = typeof payload['email'] === 'string' ? payload['email'].toLowerCase() : null;
        if (!payload.sub || !email) return null;
        return { userId: payload.sub, email };
      } catch {
        return null;
      }
    },
  };
}

export function supabaseVerifierFor(supabaseUrl: string): TokenVerifier {
  const base = supabaseUrl.replace(/\/$/, '');
  return supabaseVerifier({
    issuer: `${base}/auth/v1`,
    keys: createRemoteJWKSet(new URL(`${base}/auth/v1/.well-known/jwks.json`)),
  });
}

/** Without a verifier nobody gets in: a misconfigured server fails closed. */
export const refuseEveryone: TokenVerifier = { verify: async () => null };
