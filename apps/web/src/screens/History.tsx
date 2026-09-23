// Session history and detail (board Session-Detail): working sets, hardest effort, and a PR
// tag when the session beat every earlier estimated 1RM (tr.global.e1rm).
import { exercise } from '@tare/data';
import { e1rm } from '@tare/engine';
import { Icon } from '@tare/icons';
import { EmptyState, ListRow, SessionExerciseBlock, TopBar, type LoadConvention } from '@tare/ui';
import { useLiveQuery } from 'dexie-react-hooks';
import { Navigate, useParams } from 'react-router';
import { useAppData } from '../data/DbContext.tsx';
import { useFinishedWorkouts } from '../data/hooks.ts';
import { shortDate } from '../lib/dates.ts';
import { nameOf } from '../lib/session.ts';
import s from './screens.module.css';

const FEEL: Record<string, string> = {
  easy: 'easy',
  good: 'good',
  tough: 'tough',
  wrecked: 'wrecked',
};
const EFFORT: Record<string, string> = { easy: 'Easy', ok: 'OK', hard: 'Hard' };
const minutes = (w: { startedAt: number; finishedAt: number | null }) =>
  Math.round(((w.finishedAt ?? w.startedAt) - w.startedAt) / 60000);

export function History() {
  const workouts = useFinishedWorkouts();
  return (
    <>
      <TopBar back={{ href: '/progress' }} title="History" />
      <main className={s['body']} aria-busy={!workouts}>
        {workouts?.length === 0 ? (
          <EmptyState icon={<Icon name="table" size={28} />} title="No sessions yet">
            Finished workouts show here.
          </EmptyState>
        ) : (
          <div>
            {workouts?.map((w) => (
              <ListRow
                key={w.id}
                title={w.sessionKey ? `Session ${w.sessionKey}` : 'Workout'}
                subtitle={`${shortDate(w.date)} · ${minutes(w)} min${w.feel ? ` · felt ${FEEL[w.feel]}` : ''}`}
                href={`/history/${w.id}`}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

export function SessionDetail() {
  const { sessionId = '' } = useParams();
  const { r } = useAppData();
  const workouts = useFinishedWorkouts();
  const sets = useLiveQuery(() => r.sets.all(), [r]);
  if (!workouts || !sets) return <main aria-busy="true" aria-label="Loading" />;
  const w = workouts.find((x) => x.id === sessionId);
  if (!w) return <Navigate to="/history" replace />;
  const mine = sets
    .filter((x) => x.workoutId === w.id && x.kind === 'work')
    .sort((a, b) => a.loggedAt - b.loggedAt);
  const earlier = new Set(workouts.filter((x) => x.date < w.date).map((x) => x.id));
  const bestBefore = (id: string) =>
    Math.max(
      0,
      ...sets
        .filter((x) => x.exerciseId === id && x.kind === 'work' && earlier.has(x.workoutId))
        .map((x) => e1rm(x.load, x.reps)?.e1rm ?? 0),
    );
  const ids = [...new Set(mine.map((x) => x.exerciseId))];

  return (
    <>
      <TopBar
        back={{ href: '/history' }}
        title={w.sessionKey ? `Session ${w.sessionKey}` : 'Workout'}
        subtitle={`${shortDate(w.date)} · ${minutes(w)} min${w.feel ? ` · felt ${FEEL[w.feel]}` : ''}`}
      />
      <main className={s['body']} style={{ gap: 0 }}>
        {ids.map((id) => {
          const work = mine.filter((x) => x.exerciseId === id);
          const best = Math.max(0, ...work.map((x) => e1rm(x.load, x.reps)?.e1rm ?? 0));
          const before = bestBefore(id);
          const hardest = work.some((x) => x.effort === 'hard')
            ? 'hard'
            : work.some((x) => x.effort === 'ok')
              ? 'ok'
              : work.some((x) => x.effort === 'easy')
                ? 'easy'
                : null;
          return (
            <SessionExerciseBlock
              key={id}
              name={nameOf(id)}
              sets={work.map((x) => ({ load: x.load, reps: x.reps }))}
              loadConvention={exercise(id).load_convention as LoadConvention}
              {...(hardest ? { effort: EFFORT[hardest] } : {})}
              pr={before > 0 && best > before}
              as="h2"
            />
          );
        })}
      </main>
    </>
  );
}
