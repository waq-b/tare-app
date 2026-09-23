// Exercise detail (board Exercise-Detail): muscles, cues, e1RM from your own sets, recent
// sessions, why (your goal's rep range), and swaps for your kit with engine start loads.
import { exercise, rule } from '@tare/data';
import { e1rm, swapOptions, swapStartLoad } from '@tare/engine';
import { MuscleMap, muscles, type Muscle } from '@tare/icons';
import {
  Button,
  Card,
  EmptyState,
  ExerciseHeader,
  HeroNumber,
  Legend,
  LineChart,
  ListRow,
  SectionLabel,
  StepList,
  SwapRow,
  TopBar,
  WhyCard,
} from '@tare/ui';
import { Icon } from '@tare/icons';
import { Navigate, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppData } from '../data/DbContext.tsx';
import {
  useActivePlan,
  useExerciseHistory,
  useFinishedWorkouts,
  useProfile,
  useToday,
} from '../data/hooks.ts';
import type { PlannedExercise, SetRecord } from '../db/index.ts';
import { shortDate } from '../lib/dates.ts';
import { undoIncrease } from '../plan/actions.ts';
import { usePlanState } from '../plan/usePlanTargets.ts';
import { kitFor } from '../settings/kit.ts';
import { nameOf, patternOf, repsText } from '../lib/session.ts';
import s from './screens.module.css';

const SWAP_REASON: Record<string, string> = {
  same_pattern_diff_kit: 'Same movement, different kit',
  easier_regression: 'An easier version',
  harder_progression: 'A harder version',
  same_muscle: 'Works the same muscles',
};

const asMuscles = (xs: readonly string[]) =>
  xs.filter((m): m is Muscle => (muscles as readonly string[]).includes(m));

function exists(id: string) {
  try {
    exercise(id);
    return true;
  } catch {
    return false;
  }
}

export function Exercise() {
  const { exerciseId = '' } = useParams();
  if (!exists(exerciseId)) return <Navigate to="/plan" replace />;
  return <Detail id={exerciseId} />;
}

function Detail({ id }: { id: string }) {
  const ex = exercise(id);
  const profile = useProfile();
  const plan = useActivePlan();
  const history = useExerciseHistory(id);
  const counting = rule('tr.global.set_counting').raw['value'] as {
    primary: number;
    secondary: number;
  };
  const planned = plan?.sessions.flatMap((p) => p.exercises).find((e) => e.exerciseId === id);

  return (
    <>
      <TopBar back={{ href: '/plan' }} />
      <main className={s['body']} style={{ gap: 20 }}>
        <ExerciseHeader
          name={nameOf(id)}
          muscles={`${ex.movement_pattern.replace('_', ' ')} · ${ex.equipment.join(', ')}`}
          pattern={patternOf(id)}
          size="detail"
        />
        <Card>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            {(['front', 'back'] as const).map((view) => (
              <MuscleMap
                key={view}
                view={view}
                primary={asMuscles(ex.primary_muscles)}
                secondary={asMuscles(ex.secondary_muscles)}
                width={64}
                title={`${nameOf(id)} muscles, ${view}`}
              />
            ))}
          </div>
          <Legend
            items={[
              {
                label: `Primary · ${counting.primary} set per set`,
                color: 'var(--muscle-primary)',
              },
              {
                label: `Secondary · ${counting.secondary} set per set`,
                color: 'var(--muscle-secondary)',
              },
            ]}
          />
        </Card>
        {ex.cues.length ? (
          <div className={s['stack']}>
            <SectionLabel>Cues</SectionLabel>
            <StepList steps={ex.cues} />
          </div>
        ) : null}
        {history ? <Strength id={id} sets={history} /> : null}
        {profile && planned ? <TodayWhy id={id} planned={planned} goalId={profile.goalId} /> : null}
        {profile ? <Swaps id={id} kit={profile.kit} cantDo={profile.cantDo} /> : null}
      </main>
    </>
  );
}

function Strength({ id, sets }: { id: string; sets: readonly SetRecord[] }) {
  const finished = useFinishedWorkouts();
  if (!finished) return null;
  const dateOf = new Map(finished.map((w) => [w.id, w.date]));
  // Best e1RM per workout (tr.global.e1rm), dated by the workout, oldest first.
  const byWorkout = new Map<string, { date: string; best: number; sets: SetRecord[] }>();
  for (const set of [...sets].reverse()) {
    const date = dateOf.get(set.workoutId);
    if (!date) continue;
    const w = byWorkout.get(set.workoutId) ?? { date, best: 0, sets: [] };
    w.best = Math.max(w.best, e1rm(set.load, set.reps)?.e1rm ?? 0);
    w.sets.push(set);
    byWorkout.set(set.workoutId, w);
  }
  const sessions = [...byWorkout.entries()].sort(([, a], [, b]) => a.date.localeCompare(b.date));
  const points = sessions
    .filter(([, w]) => w.best > 0)
    .map(([, w]) => ({ x: shortDate(w.date).slice(4), y: w.best }));

  return (
    <>
      <div className={s['stack']}>
        {points.length >= 2 ? (
          <>
            <HeroNumber
              label="Estimated 1RM"
              qualifier="estimated"
              value={String(points.at(-1)?.y)}
              unit="kg"
            />
            <LineChart
              points={points}
              label={`${nameOf(id)} e1RM, kg (estimated)`}
              unit="kg"
              variant="compact"
            />
          </>
        ) : (
          <EmptyState
            icon={<Icon name="chart" size={28} />}
            title="Not enough data yet"
            layout="left"
          >
            Your estimated 1RM shows after two sessions of this exercise.
          </EmptyState>
        )}
      </div>
      {sessions.length ? (
        <div>
          <SectionLabel>Recent sessions</SectionLabel>
          {sessions
            .slice(-3)
            .reverse()
            .map(([workoutId, w]) => (
              <ListRow
                key={workoutId}
                title={shortDate(w.date)}
                value={`${w.sets[0]?.load} × ${w.sets.map((x) => x.reps).join(' · ')}`}
                valueMono
                href={`/history/${workoutId}`}
              />
            ))}
        </div>
      ) : null}
    </>
  );
}

function Swaps({ id, kit, cantDo }: { id: string; kit: string[]; cantDo: string[] }) {
  const { r } = useAppData();
  const profile = useProfile();
  const last = useLiveQuery(() => r.sets.lastWorkingLoad(id), [r, id]);
  const options = swapOptions(id, { kit, cantDo });
  if (!options.length) return null;
  return (
    <div className={s['stack']}>
      <SectionLabel>Swaps for your kit</SectionLabel>
      {options.map((o, i) => {
        const start =
          last == null
            ? null
            : swapStartLoad({
                fromId: id,
                toId: o.id,
                workingLoad: last,
                step: kitFor(profile, o.id).step,
              });
        const load =
          start?.kind === 'load'
            ? `${start.load} kg${start.perHand ? ' per hand' : ''}`
            : start?.kind === 'bodyweight'
              ? 'BW'
              : 'Easy first set';
        return (
          <SwapRow
            key={o.id}
            name={nameOf(o.id)}
            pattern={patternOf(o.id)}
            reason={SWAP_REASON[o.reason] ?? o.reason}
            load={load}
            rank={i + 1}
            href={`/exercise/${encodeURIComponent(o.id)}`}
          />
        );
      })}
    </div>
  );
}

const kgText = (n: number | null) =>
  n === null ? 'an easy first set' : `${Number.isInteger(n) ? n : n.toFixed(1)} kg`;

/** Why this exercise's target is what it is today, with the rules; an increase can be undone. */
function TodayWhy({
  id,
  planned,
  goalId,
}: {
  id: string;
  planned: PlannedExercise;
  goalId: string;
}) {
  const data = useAppData();
  const plan = useActivePlan();
  const today = useToday();
  const state = usePlanState(plan, today);
  const t = state?.targets[id];
  if (!t) return null;
  const range = `${planned.sets} sets of ${repsText(planned.repRange)} reps`;
  const rules = [...new Set([goalId, ...t.ruleIds, ...(t.diff?.ruleIds ?? [])])].map((r) =>
    rule(r),
  );
  const d = t.diff;
  const text =
    d?.kind === 'increase'
      ? `Up to ${kgText(t.load)} from ${kgText(d.from.load)}: every set reached the top of the range, at an effort you could manage, twice in a row. Reps start again at the bottom.`
      : d?.kind === 'undone'
        ? `You kept ${kgText(t.load)} for now. The increase comes back after your next session if you hit the top of the range again.`
        : d?.kind === 'reset'
          ? `Down to ${kgText(t.load)} from ${kgText(d.from.load)} to build back up after a stall.`
          : d?.kind === 'deload'
            ? `Deload week: ${t.sets} sets instead of ${d.from.sets}, weight held.`
            : d?.kind === 'return'
              ? `Back after a pain flag: ${kgText(t.load)}, ${t.sets} sets, then build up again.`
              : t.source === 'log'
                ? `${kgText(t.load)} × ${t.reps}: one more rep on the same weight until every set reaches the top of the range.`
                : t.estimated
                  ? `${kgText(t.load)}, estimated from your body stats. Change it freely.`
                  : `${range}. Your first session finds your weight.`;
  return (
    <WhyCard title="Why today" rules={rules}>
      <p style={{ margin: 0 }}>{text}</p>
      <p style={{ margin: '8px 0 0' }}>{range}, from your goal’s ranges.</p>
      {d?.kind === 'increase' ? (
        <div style={{ marginTop: 12 }}>
          <Button
            variant="secondary-outline"
            size={52}
            onClick={() => void undoIncrease(data, t, today)}
          >
            Keep {kgText(d.from.load)} for now
          </Button>
        </div>
      ) : null}
    </WhyCard>
  );
}
