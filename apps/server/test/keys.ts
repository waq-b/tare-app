// Test tokens: a local ES256 key pair stands in for Supabase's signing keys.
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { supabaseVerifier } from '../src/auth/jwt.ts';

export const ISSUER = 'https://test.supabase.co/auth/v1';

export async function testKeys() {
  const { publicKey, privateKey } = await generateKeyPair('ES256');
  const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'ES256' };
  const verifier = supabaseVerifier({ issuer: ISSUER, keys: createLocalJWKSet({ keys: [jwk] }) });
  const token = (
    sub: string,
    email: string,
    over: { issuer?: string; audience?: string; expired?: boolean } = {},
  ) =>
    new SignJWT({ email, role: 'authenticated' })
      .setProtectedHeader({ alg: 'ES256', kid: 'k1' })
      .setSubject(sub)
      .setIssuer(over.issuer ?? ISSUER)
      .setAudience(over.audience ?? 'authenticated')
      .setIssuedAt()
      .setExpirationTime(over.expired ? Math.floor(Date.now() / 1000) - 60 : '1h')
      .sign(privateKey);
  return { verifier, token };
}
