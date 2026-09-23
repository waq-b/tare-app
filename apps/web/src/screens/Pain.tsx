// Flag pain outside a workout, and the history of flags (board Health-Flags).
import { safetyRule } from '@tare/data';
import { BodyMap, type BodyArea } from '@tare/icons';
import {
  Button,
  DataTable,
  EmptyState,
  Legend,
  SAFETY_LEVELS,
  SafetyLockNote,
  SectionLabel,
  TopBar,
} from '@tare/ui';
import { Icon } from '@tare/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppData } from '../data/DbContext.tsx';
import { useToday } from '../data/hooks.ts';
import { shortDate } from '../lib/dates.ts';
import { raisePainFlag } from '../safety/flag.ts';
import { humanArea, usePainForm } from '../safety/PainForm.tsx';
import s from './screens.module.css';

export function FlagPain() {
  const data = useAppData();
  const navigate = useNavigate();
  const today = useToday();
  const [busy, setBusy] = useState(false);
  const { body, footer } = usePainForm((res) => {
    setBusy(true);
    void raisePainFlag(data, { ...res, date: today, workout: null }).then((f) =>
      navigate(`/safety/${f.ruleId}?flag=${f.id}`, { replace: true }),
    );
  }, busy);
  return (
    <>
      <TopBar back={{ href: '/pain-flags' }} title="Flag pain" />
      <main className={s['body']} style={{ gap: 20 }}>
        {body}
        <div className={s['foot']}>{footer}</div>
      </main>
    </>
  );
}

const placeOf = (area: string | null, side: string | null) =>
  area ? humanArea(`${side && side !== 'both' ? `${side} ` : ''}${area}`) : 'No area';

export function PainFlags() {
  const { r } = useAppData();
  const today = useToday();
  const flags = useLiveQuery(() => r.painFlags.all(), [r]);
  if (!flags) return <main aria-busy="true" aria-label="Loading" />;
  const active = flags.filter((f) => f.status === 'active');
  const mapped = flags
    .filter((f) => f.area)
    .map((f) => ({
      area: f.area as BodyArea,
      ...(f.side ? { side: f.side } : {}),
      state: f.status,
    }));

  return (
    <>
      <TopBar
        back={{ href: '/settings' }}
        title="Pain flags"
        subtitle={`${flags.length} flag${flags.length === 1 ? '' : 's'} · ${active.length} active`}
      />
      <main className={s['body']} style={{ gap: 20 }}>
        {flags.length === 0 ? (
          <EmptyState icon={<Icon name="flag" size={28} />} title="No pain flags">
            Flag pain from a workout, or here, and the safety rules tell you what to do.
          </EmptyState>
        ) : (
          <>
            {active.length ? (
              <div className={s['stack']}>
                <SectionLabel>Active</SectionLabel>
                <p className={s['lede']}>
                  Exercises that load these areas are left out of your sessions until you say it’s
                  settled.
                </p>
                {active.map((f) => (
                  <div key={f.id} className={s['row']} style={{ justifyContent: 'space-between' }}>
                    <span>
                      {placeOf(f.area, f.side)} · {shortDate(f.date)}
                    </span>
                    <Button
                      variant="secondary-outline"
                      size={52}
                      onClick={() => void r.painFlags.clear(f.id, today)}
                    >
                      It’s settled
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
            <DataTable
              caption="Pain flags"
              columns={[
                { key: 'date', label: 'Date', rowHeader: true },
                { key: 'area', label: 'Area' },
                { key: 'result', label: 'Result' },
                { key: 'status', label: 'Status' },
              ]}
              rows={flags.map((f) => ({
                date: shortDate(f.date).slice(4),
                area: placeOf(f.area, f.side),
                result: SAFETY_LEVELS[safetyRule(f.ruleId).action]?.eyebrow ?? '',
                status:
                  f.status === 'active'
                    ? 'Active'
                    : `Cleared ${f.clearedOn ? shortDate(f.clearedOn).slice(4) : ''}`,
              }))}
            />
            <SafetyLockNote>
              Results come from the safety rules. Your coach reads this list but can’t edit it.
            </SafetyLockNote>
            {mapped.length ? (
              <div className={s['stack']}>
                <SectionLabel>Where it’s been</SectionLabel>
                <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
                  <BodyMap view="front" flags={mapped} width={80} title="Pain flags, front" />
                  <BodyMap view="back" flags={mapped} width={80} title="Pain flags, back" />
                </div>
                <Legend
                  label="Body map key"
                  items={[
                    { label: 'Active', color: 'var(--muscle-primary)' },
                    { label: 'Cleared', color: 'var(--muscle-secondary)' },
                  ]}
                />
              </div>
            ) : null}
          </>
        )}
        <div className={s['foot']}>
          <Button variant="secondary-outline" size={52} fullWidth href="/pain">
            Flag pain
          </Button>
        </div>
      </main>
    </>
  );
}
