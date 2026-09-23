// How the sync client talks to the API. Tests use an in-memory server instead.
export interface SyncChange {
  table: string;
  id: string;
  record: Record<string, unknown> & { id: string; updatedAt: number };
}

export interface PullPage {
  changes: SyncChange[];
  cursor: number;
  more: boolean;
}

export class SyncHttpError extends Error {
  constructor(readonly status: number) {
    super(`sync: HTTP ${status}`);
    this.name = 'SyncHttpError';
  }
}

export interface SyncTransport {
  push(changes: SyncChange[]): Promise<{ applied: number }>;
  pull(since: number): Promise<PullPage>;
}

/** The real API. `getToken` returns the current Supabase access token, or null. */
export function httpTransport(
  apiUrl: string,
  getToken: () => Promise<string | null>,
): SyncTransport {
  const base = apiUrl.replace(/\/$/, '');
  async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await getToken();
    if (!token) throw new SyncHttpError(401);
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        ...(init.body ? { 'content-type': 'application/json' } : {}),
        authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new SyncHttpError(res.status);
    return (await res.json()) as T;
  }
  return {
    push: (changes) => call('/sync/push', { method: 'POST', body: JSON.stringify({ changes }) }),
    pull: (since) => call(`/sync/pull?since=${since}`),
  };
}
