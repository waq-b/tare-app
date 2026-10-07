// Environment. One DATABASE_URL, one Node runtime, nothing host-specific.
export interface Config {
  databaseUrl: string;
  supabaseUrl: string;
  origins: string[];
  port: number;
}

export function configFromEnv(env: NodeJS.ProcessEnv = process.env): Config {
  const need = (k: string) => {
    const v = env[k];
    if (!v) throw new Error(`${k} is not set`);
    return v;
  };
  return {
    databaseUrl: need('DATABASE_URL'),
    supabaseUrl: need('SUPABASE_URL'),
    origins: (env['ALLOWED_ORIGINS'] ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    port: Number(env['PORT'] ?? 3000),
  };
}
