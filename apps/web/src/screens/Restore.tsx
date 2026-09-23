// Restore a backup on a new phone, before (instead of) onboarding.
import { Banner, Button, TopBar } from '@tare/ui';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppData } from '../data/DbContext.tsx';
import { importAll } from '../db/index.ts';
import s from './screens.module.css';

export function Restore() {
  const { db } = useAppData();
  const navigate = useNavigate();
  const file = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function restore(f: File) {
    try {
      await importAll(db, JSON.parse(await f.text()));
      void navigate('/', { replace: true });
    } catch (e) {
      setError(e instanceof SyntaxError ? 'It isn’t a Tare backup.' : (e as Error).message);
    }
  }

  return (
    <>
      <TopBar back={{ href: '/onboarding/welcome' }} title="Restore a backup" />
      <main className={s['body']}>
        <p className={s['lede']}>
          Pick a backup file you exported from Settings. Everything in it comes back on this phone.
        </p>
        {error ? (
          <Banner tone="unsynced" title="Couldn’t restore that file">
            {error}
          </Banner>
        ) : null}
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          hidden
          aria-label="Backup file"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void restore(f);
          }}
        />
        <div className={s['foot']}>
          <Button size={60} fullWidth onClick={() => file.current?.click()}>
            Choose backup file
          </Button>
        </div>
      </main>
    </>
  );
}
