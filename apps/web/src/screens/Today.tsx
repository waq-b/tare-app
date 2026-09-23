// Today (boards Main, Today-Rest). The week strip, today's session from the active plan with
// the loads to aim for (#70), and Start workout. A workout in progress comes first.
import { Icon } from '@tare/icons';
import {
  Banner,
  Button,
  Card,
  ExerciseCard,
  IconButton,
  Prescription,
  SectionLabel,
  SessionHeader,
  StatusHero,
  TopBar,
  WeekStrip,
  type WeekDay,
} from '@tare/ui';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppData } from '../data/DbContext.tsx';
import {
  useActivePlan,
  useFinishedWorkouts,
  useTargetLoads,
  useToday,
  useUnfinishedWorkout,
} from '../data/hooks.ts';
import type { PlanRecord, WorkoutRecord } from '../db/index.ts';
import { addDays, longDate, mondayOf, parseDay, weekdayOf, WEEKDAYS } from '../lib/dates.ts';
import { estimateMinutes, nameOf, sessionItems, type PlannedSession } from '../lib/session.ts';
import s from './screens.module.css';

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function weekDays(
  today: string,
  plan: PlanRecord | null,
  finished: readonly WorkoutRecord[],
): WeekDay[] {
  const monday = mondayOf(today);
  return LETTERS.map((letter, i) => {
    const date = addDays(monday, i);
    const done = finished.some((w) => w.date === date);
    const planned = plan?.sessions.some((p) => p.weekday === i);
    return {
      letter,
      name: longDate(date),
      date: parseDay(date).getDate(),
      state: done ? 'done' : planned ? 'planned' : 'rest',
      today: date === today,
    };
  });
}

/** The next planned session after today, with its weekday. */
function nextSession(plan: PlanRecord, today: string): PlannedSession | undefined {
  const wd = weekdayOf(today);
  const sorted = [...plan.sessions].sort((a, b) => a.weekday - b.weekday);
  return sorted.find((p) => p.weekday > wd) ?? sorted[0];
}

export function Today() {
  const today = useToday();
  const plan = useActivePlan();
  const finished = useFinishedWorkouts();
  const unfinished = useUnfinishedWorkout();
  const loading = plan === undefined || finished === undefined || unfinished === undefined;

  const session = plan?.sessions.find((p) => p.weekday === weekdayOf(today));
  const doneToday = finished?.find((w) => w.date === today);

  return (
    <>
      <TopBar
        title="Today"
        subtitle={longDate(today)}
        actions={<IconButton icon="gear" label="Settings" href="/settings" />}
      />
      <main className={s['body']} aria-busy={loading}>
        {loading ? null : (
          <>
            <WeekStrip days={weekDays(today, plan, finished)} />
            {unfinished ? <Resume /> : null}
            {!plan ? (
              <StatusHero icon={<Icon name="plan" size={28} />} title="No plan yet." />
            ) : doneToday ? (
              <StatusHero
                icon={<Icon name="check" size={28} />}
                tone="accent"
                title="Done for today."
              >
                Nice work. Rest up for the next one.
              </StatusHero>
            ) : session && !unfinished ? (
              <SessionToday plan={plan} session={session} today={today} />
            ) : !session ? (
              <RestDay plan={plan} today={today} />
            ) : null}
          </>
        )}
      </main>
    </>
  );
}

function Resume() {
  return (
    <Banner
      tone="info"
      icon="play"
      title="Workout in progress"
      action={
        <Button size={52} href="/workout">
          Resume
        </Button>
      }
    >
      Your sets are saved on this phone. Pick up where you left off.
    </Banner>
  );
}

function SessionToday({
  plan,
  session,
  today,
}: {
  plan: PlanRecord;
  session: PlannedSession;
  today: string;
}) {
  const { r } = useAppData();
  const navigate = useNavigate();
  const loads = useTargetLoads(session.exercises);
  const [starting, setStarting] = useState(false);
  if (!loads) return null;
  const items = sessionItems(session, loads);

  async function start() {
    setStarting(true);
    await r.workouts.start({
      planId: plan.id,
      sessionKey: session.key,
      date: today,
      exercises: session.exercises.map((e) => ({
        exerciseId: e.exerciseId,
        swappedFrom: null,
        skipped: false,
      })),
    });
    void navigate('/workout');
  }

  return (
    <>
      <SessionHeader title={session.name} duration={`~${estimateMinutes(session)} min`} />
      <div>
        {items.map((e) => (
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
      <Button
        size={64}
        fullWidth
        icon={<Icon name="play" size={20} />}
        disabled={starting}
        onClick={() => void start()}
      >
        Start workout
      </Button>
    </>
  );
}

function RestDay({ plan, today }: { plan: PlanRecord; today: string }) {
  const next = nextSession(plan, today);
  return (
    <>
      <StatusHero icon={<Icon name="moon" size={28} />} title="Rest day." />
      {next ? (
        <Card>
          <SectionLabel as="h2">Next session · {WEEKDAYS[next.weekday]}</SectionLabel>
          <SessionHeader title={next.name} duration={`~${estimateMinutes(next)} min`} as="h3" />
          <p className={s['lede']}>{next.exercises.map((e) => nameOf(e.exerciseId)).join(' · ')}</p>
        </Card>
      ) : null}
    </>
  );
}
