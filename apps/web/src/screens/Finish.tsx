// Finish (board Finish): time, volume, sets, real PRs (best estimated 1RM, tr.global.e1rm),
// "beat last time", and an optional session feel. Done closes the workout.
import {
  Banner,
  Button,
  ComparisonRow,
  EffortTap,
  InlineNote,
  SectionLabel,
  StatTile,
  TopBar,
  num,
  type SessionFeel,
} from '@tare/ui';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useAppData } from '../data/DbContext.tsx';
import { useUnfinishedWorkout } from '../data/hooks.ts';
import type { WorkoutRecord } from '../db/index.ts';
import { shortDate } from '../lib/dates.ts';
import { nameOf } from '../lib/session.ts';
import { finishWorkout } from '../workout/finish.ts';
import { summarise } from '../workout/ledger.ts';
import { useClock } from '../workout/rest.ts';
import s from './screens.module.css';

export function Finish() {
  const workout = useUnfinishedWorkout();
  if (workout === undefined) return <main aria-busy="true" aria-label="Loading" />;
  if (workout === null) return <Navigate to="/" replace />;
  return <Summary workout={workout} />;
}

function Summary({ workout }: { workout: WorkoutRecord }) {
  const data = useAppData();
  const navigate = useNavigate();
  const now = useClock(60_000);
  const [feel, setFeel] = useState<SessionFeel | null>(null);
  const [busy, setBusy] = useState(false);
  const loaded = useLiveQuery(async () => {
    const sets = await data.r.sets.forWorkout(workout.id);
    const ids = [...new Set(sets.map((x) => x.exerciseId))];
    const history = Object.fromEntries(
      await Promise.all(ids.map(async (id) => [id, await data.r.sets.history(id)] as const)),
    );
    return { sets, history };
  }, [data, workout.id]);
  if (!loaded) return <main aria-busy="true" aria-label="Loading" />;
  const sum = summarise(workout, loaded.sets, loaded.history, now);

  async function done() {
    setBusy(true);
    await finishWorkout(data, workout, feel);
    void navigate('/', { replace: true });
  }

  return (
    <>
      <TopBar back={{ href: '/workout', label: 'Back to workout' }} />
      <main className={s['body']} style={{ gap: 20 }}>
        <div className={s['stack']} style={{ gap: 8 }}>
          <SectionLabel as="div">
            {shortDate(workout.date)}
            {workout.sessionKey ? ` · Session ${workout.sessionKey}` : ''}
          </SectionLabel>
          <h1 className={s['h1']}>Session done.</h1>
        </div>
        <div className={s['grid3']}>
          <StatTile label="Time" value={String(sum.minutes)} unit="min" />
          <StatTile label="Volume" value={sum.volume.toLocaleString('en-GB')} unit="kg" />
          <StatTile label="Sets" value={String(sum.sets)} />
        </div>
        {sum.prs.map((p) => (
          <Banner
            key={p.exerciseId}
            tone="pr"
            title={`${nameOf(p.exerciseId)}: best estimated 1RM`}
          >
            {num(p.today)} kg (was {num(p.before)})
          </Banner>
        ))}
        {sum.better.length ? (
          <div>
            <SectionLabel>Beat last time</SectionLabel>
            {sum.better.map((b) => (
              <ComparisonRow
                key={b.exerciseId}
                name={nameOf(b.exerciseId)}
                before={b.before}
                after={b.after}
                delta={b.delta}
              />
            ))}
          </div>
        ) : null}
        <EffortTap
          scale="session"
          question="How did the session feel?"
          value={feel}
          onChange={setFeel}
        />
        <InlineNote>Saved on this phone.</InlineNote>
        <div className={s['foot']}>
          <Button size={60} fullWidth disabled={busy} onClick={() => void done()}>
            Done
          </Button>
        </div>
      </main>
    </>
  );
}
