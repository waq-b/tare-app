// Settings. P0 T4 adds Data (backup + storage); the "You" rows arrive with onboarding (T5).
import { vpt } from '@tare/data';
import { Icon } from '@tare/icons';
import { Banner, ListRow, SectionLabel, TopBar } from '@tare/ui';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext.tsx';
import { useAppData } from '../data/DbContext.tsx';
import { exportAll, importAll } from '../db/index.ts';
import s from './screens.module.css';

type Status = { tone: 'success' | 'unsynced'; title: string; body?: string } | null;

const today = () => new Date().toISOString().slice(0, 10);

export function Settings() {
  const { db } = useAppData();
  const { state, signOut } = useAuth();
  const file = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);

  useEffect(() => {
    void db.meta.get('storagePersisted').then((m) => setPersisted(m ? m.value === true : null));
  }, [db]);

  async function onExport() {
    const backup = await exportAll(db);
    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tare-backup-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus({ tone: 'success', title: 'Backup saved', body: a.download });
  }

  async function onImport(f: File) {
    try {
      const res = await importAll(db, JSON.parse(await f.text()));
      setStatus({
        tone: 'success',
        title: 'Backup restored',
        body: `${res.added} added, ${res.updated} updated, ${res.unchanged} already here.`,
      });
    } catch (e) {
      setStatus({
        tone: 'unsynced',
        title: 'Couldn’t restore that file',
        body: e instanceof SyntaxError ? 'It isn’t a Tare backup.' : (e as Error).message,
      });
    }
  }

  return (
    <>
      <TopBar back={{ href: '/' }} title="Settings" />
      <main className={s['body']}>
        {status ? (
          <Banner tone={status.tone} title={status.title}>
            {status.body}
          </Banner>
        ) : null}
        <div>
          <SectionLabel>Account</SectionLabel>
          <ListRow
            variant="compact"
            title="Signed in as"
            value={state.status === 'signedIn' ? state.email : '—'}
          />
          <ListRow
            leading={<Icon name="lock" size={22} />}
            title="Sign out"
            subtitle="Your logs stay on this phone"
            onClick={() => void signOut()}
          />
        </div>
        <div>
          <SectionLabel>Data</SectionLabel>
          <ListRow
            leading={<Icon name="download" size={22} />}
            title="Export all data"
            subtitle="A backup file of everything you’ve logged"
            value="JSON"
            onClick={() => void onExport()}
          />
          <ListRow
            leading={<Icon name="refresh" size={22} />}
            title="Restore from a backup"
            subtitle="Adds anything missing; never overwrites newer changes"
            onClick={() => file.current?.click()}
          />
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            hidden
            aria-label="Backup file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void onImport(f);
            }}
          />
          <ListRow
            variant="compact"
            title="Storage on this phone"
            value={persisted === null ? 'Not asked yet' : persisted ? 'Kept' : 'May be cleared'}
            valueTone={persisted === false ? 'warning' : 'default'}
          />
          <ListRow
            leading={<Icon name="book" size={22} />}
            title="Rulebook"
            value={`vpt v${vpt().version}`}
          />
        </div>
      </main>
    </>
  );
}
