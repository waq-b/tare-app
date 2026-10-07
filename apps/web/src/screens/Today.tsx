// Today (boards Main, Today-Rest). The week strip, today's session from the active plan with
// the loads to aim for (#70), and Start workout. A workout in progress comes first.
import { deloadRule, progressionText, rule } from '@tare/data';
import { Icon } from '@tare/icons';
import {
  Banner,
  Button,
  Card,
  DiffChip,
  ExerciseCard,
  IconButton,
  InlineNote,
  Prescription,
  RuleCitation,
  SectionLabel,
  SessionHeader,
  StatusHero,
  TextLink,
  TopBar,
  WeekStrip,
  type WeekDay,
} from '@tare/ui';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppData } from '../data/DbContext.tsx';
import {
  useActivePlan,
  useFinishedWorkouts,
  useToday,
  useUnfinishedWorkout,
} from '../data/hooks.ts';
import type { PlanRecord, WorkoutRecord } from '../db/index.ts';
import { addDays, longDate, mondayOf, parseDay, weekdayOf, WEEKDAYS } from '../lib/dates.ts';
import { estimateMinutes, nameOf, sessionItems, type PlannedSession } from '../lib/session.ts';
import { avoidedFor } from '../safety/flag.ts';
import { SyncBanner } from '../sync/Banners.tsx';
import { logApplied } from '../plan/actions.ts';
import { usePlanState } from '../plan/usePlanTargets.ts';
import { Offers } from './Offers.tsx';
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
            <SyncBanner />
            {unfinished ? <Resume /> : null}
            {doneToday ? (
              <StatusHero
                icon={<Icon name="check" size={28} />}
                tone="accent"
                title="Done for today."
              >
                Nice work. Rest up for the next one.
              </StatusHero>
            ) : !plan ? (
              <StatusHero icon={<Icon name="plan" size={28} />} title="No plan yet." />
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
  const data = useAppData();
  const { r } = data;
  const navigate = useNavigate();
  const state = usePlanState(plan, today);
  const flags = useLiveQuery(() => r.painFlags.active(), [r]);
  const [starting, setStarting] = useState(false);
  if (!state || !flags) return null;
  const avoid = avoidedFor(flags);
  const all = sessionItems(session, state.targets);
  const items = all.filter((e) => !avoid.has(e.exerciseId));
  const left = all.filter((e) => avoid.has(e.exerciseId));
  const areas = [...new Set(flags.map((f) => f.area).filter((a): a is string => Boolean(a)))];
  const deload = items.some((e) => e.target.notes.includes('deload'));

  async function start() {
    setStarting(true);
    const exercises = all.map((e) => ({
      exerciseId: e.exerciseId,
      swappedFrom: null,
      // Left out while a pain flag is active (pain_during_exercise engine action).
      skipped: avoid.has(e.exerciseId),
      sets: avoid.has(e.exerciseId) ? 0 : e.sets,
      repRange: e.planned.repRange,
      restSec: e.planned.restSec,
      load: e.load,
      ...(e.target.source === 'log' ? { reps: e.reps } : {}),
      ...(e.estimated ? { estimated: true } : {}),
      ...(e.target.notes.length ? { notes: e.target.notes } : {}),
    }));
    await logApplied(
      data,
      items.map((e) => e.target),
      today,
    );
    const w = await r.workouts.start({
      planId: plan.id,
      sessionKey: session.key,
      date: today,
      exercises,
    });
    const first = exercises.findIndex((e) => !e.skipped);
    if (first > 0) await r.workouts.update(w.id, { current: first });
    void navigate('/workout');
  }

  return (
    <>
      <Offers state={state} today={today} />
      {deload ? (
        <Banner tone="deload" title="Deload week">
          <p style={{ margin: '0 0 8px' }}>{deloadRule().detail}</p>
          <RuleCitation rule={rule('pr.deload')} />
        </Banner>
      ) : state.block.ramp ? (
        <InlineNote>
          Weeks 1–{progressionText().rampWeeks}: finding your working weights. Keep every set Easy
          or OK.
        </InlineNote>
      ) : null}
      <SessionHeader
        title={session.name}
        duration={`~${estimateMinutes(session)} min`}
        deload={deload}
      />
      {left.length ? (
        <InlineNote>
          Left out while your {areas.join(' and ').replace(/_/g, ' ')} settles:{' '}
          {left.map((e) => e.name).join(', ')}. <TextLink href="/pain-flags">Pain flags</TextLink>
        </InlineNote>
      ) : null}
      <div>
        {items.map((e) => (
          <ExerciseCard
            key={e.exerciseId}
            href={`/exercise/${encodeURIComponent(e.exerciseId)}`}
            name={e.name}
            pattern={e.pattern}
            {...(e.subline ? { subline: e.subline } : {})}
            prescription={<Prescription rx={e.rx} />}
            {...(e.chip
              ? { diff: <DiffChip size="compact" to={e.chip.to} tone={e.chip.tone} /> }
              : {})}
          />
        ))}
      </div>
      <Button
        size={64}
        fullWidth
        icon={<Icon name="play" size={20} />}
        disabled={starting || items.length === 0}
        onClick={() => void start()}
      >
        {deload ? 'Start deload session' : 'Start workout'}
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
