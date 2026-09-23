// Plan (board Plan-Week): the week, one row per day; each session opens its exercises.
import { vpt } from '@tare/data';
import { Icon } from '@tare/icons';
import {
  ExerciseCard,
  InlineNote,
  PlanDayRow,
  Prescription,
  SessionHeader,
  StatusHero,
  TopBar,
} from '@tare/ui';
import { Navigate, useParams } from 'react-router';
import { useActivePlan, useTargetLoads } from '../data/hooks.ts';
import { WEEKDAYS, WEEKDAYS_SHORT } from '../lib/dates.ts';
import { estimateMinutes, nameOf, sessionItems, type PlannedSession } from '../lib/session.ts';
import s from './screens.module.css';

export function Plan() {
  const plan = useActivePlan();
  return (
    <>
      <TopBar
        title="Plan"
        {...(plan ? { subtitle: `${plan.name} · ${plan.sessions.length} sessions a week` } : {})}
      />
      <main className={s['body']} style={{ gap: 8 }} aria-busy={plan === undefined}>
        {plan === null ? (
          <StatusHero icon={<Icon name="plan" size={28} />} title="No plan yet." />
        ) : plan ? (
          <>
            {WEEKDAYS_SHORT.map((day, i) => {
              const p = plan.sessions.find((x) => x.weekday === i);
              return p ? (
                <PlanDayRow
                  key={day}
                  kind="session"
                  day={day}
                  letter={p.key}
                  title={p.name.split(' · ')[1] ?? p.name}
                  summary={p.exercises.map((e) => nameOf(e.exerciseId)).join(' · ')}
                  href={`/plan/${p.key}`}
                />
              ) : (
                <PlanDayRow key={day} kind="rest" day={day} />
              );
            })}
            <InlineNote>
              Starter plan built from vpt v{vpt().version}. Your coach can change it from P2.
            </InlineNote>
          </>
        ) : null}
      </main>
    </>
  );
}

export function PlanSession() {
  const { key } = useParams();
  const plan = useActivePlan();
  if (plan === undefined) return <main aria-busy="true" aria-label="Loading" />;
  const session = plan?.sessions.find((p) => p.key === key);
  if (!session) return <Navigate to="/plan" replace />;
  return (
    <>
      <TopBar back={{ href: '/plan' }} title={WEEKDAYS[session.weekday]} />
      <main className={s['body']}>
        <SessionHeader title={session.name} duration={`~${estimateMinutes(session)} min`} />
        <SessionList session={session} />
      </main>
    </>
  );
}

function SessionList({ session }: { session: PlannedSession }) {
  const loads = useTargetLoads(session.exercises);
  if (!loads) return null;
  return (
    <div>
      {sessionItems(session, loads).map((e) => (
        <ExerciseCard
          key={e.exerciseId}
          href={`/exercise/${encodeURIComponent(e.exerciseId)}`}
          name={e.name}
          pattern={e.pattern}
          {...(e.subline ? { subline: e.subline } : {})}
          prescription={<Prescription rx={e.rx} />}
        />
      ))}
    </div>
  );
}
