// The active workout: the Ledger (boards Workout-A, Workout-A-Edit, Rest-Timer, Swap-Sheet).
// One tap logs the current set as planned; everything is saved as it happens, so a reload,
// crash or closed app reopens exactly here.
import { exercise, rule } from '@tare/data';
import { defaultLoadStep, swapOptions, swapStartLoad } from '@tare/engine';
import { Icon } from '@tare/icons';
import {
  Button,
  Checkbox,
  EffortTap,
  ExerciseHeader,
  IncrementChips,
  LastTimeStrip,
  NumberStepper,
  RestTimer,
  SetRow,
  Sheet,
  StatusHero,
  StepProgress,
  SwapRow,
  WorkoutFooter,
  WorkoutTopBar,
  num,
  type LoadConvention,
  type SetEffort,
} from '@tare/ui';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useAppData } from '../data/DbContext.tsx';
import { useExerciseHistory, useProfile, useUnfinishedWorkout } from '../data/hooks.ts';
import type { SetRecord, WorkoutExercise, WorkoutRecord } from '../db/index.ts';
import { isoDay, shortDate } from '../lib/dates.ts';
import { nameOf, patternOf, repsText } from '../lib/session.ts';
import { exerciseView, lastSession, type ExerciseView, type WorkRow } from '../workout/ledger.ts';
import { raisePainFlag } from '../safety/flag.ts';
import { OfflineBanner } from '../sync/Banners.tsx';
import { usePainForm } from '../safety/PainForm.tsx';
import { logWorkSet, undoSet } from '../workout/actions.ts';
import { adjustRest, clearRest, useClock, useRest } from '../workout/rest.ts';
import s from './screens.module.css';

const EFFORT_WORD: Record<string, string> = { easy: 'Easy', ok: 'OK', hard: 'Hard' };

const SWAP_REASON: Record<string, string> = {
  same_pattern_diff_kit: 'Same movement, different kit',
  easier_regression: 'An easier version',
  harder_progression: 'A harder version',
  same_muscle: 'Works the same muscles',
};

function elapsedText(ms: number): string {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const sec = String(t % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

const musclesLine = (id: string) => {
  const e = exercise(id);
  const line = [...e.primary_muscles, ...e.secondary_muscles].join(' · ');
  return line.charAt(0).toUpperCase() + line.slice(1);
};

export function Workout() {
  const workout = useUnfinishedWorkout();
  if (workout === undefined) return <main aria-busy="true" aria-label="Loading" />;
  if (workout === null) return <Navigate to="/" replace />;
  return <Ledger workout={workout} />;
}

type SheetKind = 'edit' | 'rest' | 'swap' | 'pain' | null;

function Ledger({ workout }: { workout: WorkoutRecord }) {
  const data = useAppData();
  const { r, db } = data;
  const navigate = useNavigate();
  const sets = useLiveQuery(() => r.sets.forWorkout(workout.id), [r, workout.id]);
  const position = Math.min(workout.current, workout.exercises.length - 1);
  const ex = workout.exercises[position];
  const history = useExerciseHistory(ex?.exerciseId ?? '');
  const { rest, remaining } = useRest(workout.id);
  const now = useClock(1000);
  const [sheet, setSheet] = useState<SheetKind>(null);

  if (!ex || !sets || !history) return <main aria-busy="true" aria-label="Loading" />;
  const last = lastSession(history);
  const view = exerciseView(workout, position, sets, last);
  if (!view) return null;
  const nextIndex = workout.exercises.findIndex((e, i) => i > position && !e.skipped);
  const isLast = nextIndex === -1;
  const nextEx = isLast ? undefined : workout.exercises[nextIndex];
  const convention = exercise(ex.exerciseId).load_convention as LoadConvention;
  const bodyweight = convention === 'bodyweight';

  const setExercise = (change: (e: WorkoutExercise) => Partial<WorkoutExercise>) =>
    r.workouts.updateExercise(workout.id, position, change);

  async function log(load: number | null, reps: number) {
    if (!ex) return;
    await logWorkSet(data, workout, ex, load ?? 0, reps);
    setSheet('rest');
  }

  async function next() {
    await clearRest(db);
    const after = workout.exercises.findIndex((e, i) => i > position && !e.skipped);
    if (after === -1) void navigate('/workout/finish');
    else await r.workouts.update(workout.id, { current: after });
  }

  const cur = view.current;
  const loggedCount = view.work.filter((w) => w.set).length;
  const needsWeight = cur !== null && cur.load === null && !bodyweight;
  const footer = view.complete
    ? { label: isLast ? 'Finish workout' : 'Next exercise', onAction: () => void next() }
    : {
        label: needsWeight ? 'Enter weight' : 'Done',
        ...(cur && !needsWeight
          ? { value: bodyweight ? `${cur.reps} reps` : `${num(cur.load ?? 0)} × ${cur.reps}` }
          : {}),
        onAction: () => {
          if (!cur) return;
          if (needsWeight) setSheet('edit');
          else void log(cur.load, cur.reps);
        },
      };
  const lastFirst = last[0];
  const lastEffort = last.at(-1)?.effort;

  if (ex.skipped && isLast) {
    // A pain flag took out everything that was left (pain_during_exercise engine action).
    return (
      <>
        <WorkoutTopBar
          sessionName={sessionTitle(workout)}
          elapsed={elapsedText(now - workout.startedAt)}
          minimiseHref="/"
          onFlagPain={() => setSheet('pain')}
        />
        <main className={s['body']}>
          <StatusHero icon={<Icon name="check" size={28} />} title="That’s all for today.">
            The rest of this session loads the area you flagged, so it’s left out.
          </StatusHero>
        </main>
        <WorkoutFooter actionLabel="Finish workout" onAction={() => void next()} />
        {sheet === 'pain' ? <PainSheet workout={workout} onClose={() => setSheet(null)} /> : null}
      </>
    );
  }

  return (
    <>
      <WorkoutTopBar
        sessionName={sessionTitle(workout)}
        elapsed={elapsedText(now - workout.startedAt)}
        minimiseHref="/"
        onFlagPain={() => setSheet('pain')}
      />
      <main className={s['body']} style={{ gap: 14 }}>
        <OfflineBanner />
        <StepProgress
          total={workout.exercises.length}
          done={position}
          current={position}
          tone="text"
          label={`Exercise ${position + 1} of ${workout.exercises.length}`}
        />
        <ExerciseHeader
          name={nameOf(ex.exerciseId)}
          muscles={musclesLine(ex.exerciseId)}
          pattern={patternOf(ex.exerciseId)}
          {...(view.work.some((w) => w.set) ? {} : { onSwap: () => setSheet('swap') })}
        />
        {lastFirst ? (
          <LastTimeStrip
            sets={`${num(lastFirst.load)} × ${last.map((x) => x.reps).join(' · ')}`}
            date={shortDate(isoDay(new Date(lastFirst.loggedAt)))}
            {...(lastEffort ? { effort: EFFORT_WORD[lastEffort] } : {})}
          />
        ) : (
          <p className={s['lede']}>
            {ex.load === null && !bodyweight
              ? `First time: start light, find a weight you can do ${repsText(ex.repRange)} reps with, a couple in reserve.`
              : `${ex.sets} × ${repsText(ex.repRange)} today.`}
          </p>
        )}
        <div className={s['stack']} style={{ gap: 8 }}>
          {view.warmups.map((w) => (
            <SetRow
              key={`w${w.index}`}
              state="warmup"
              index={w.index}
              load={w.load}
              reps={w.reps}
              loadConvention={convention}
              warmupDone={Boolean(w.done)}
              onCheck={() =>
                void (w.done
                  ? r.sets.remove(w.done.id)
                  : r.sets.log({
                      workoutId: workout.id,
                      exerciseId: ex.exerciseId,
                      kind: 'warmup',
                      load: w.load,
                      reps: w.reps,
                      effort: null,
                    }))
              }
            />
          ))}
          {view.work.map((w) => (
            <SetRow
              key={w.index}
              state={w.state}
              index={w.index}
              load={bodyweight ? null : w.load}
              reps={w.reps}
              loadConvention={convention}
              {...(w.set?.effort ? { effort: EFFORT_WORD[w.set.effort] } : {})}
              {...(w.state === 'current' ? lastTimeOf(last[w.index - 1]) : {})}
              {...(w.state === 'done' && w.set
                ? { onCheck: () => void undoSet(data, doneSet(w), rest?.setId) }
                : w.state === 'current'
                  ? { onCheck: footer.onAction }
                  : {})}
            />
          ))}
          <div className={s['row']} style={{ gap: 0 }}>
            <Button
              variant="ghost"
              size={52}
              icon={<Icon name="plus" size={18} />}
              onClick={() => void setExercise((e) => ({ sets: e.sets + 1 }))}
            >
              Add set
            </Button>
            {cur ? (
              <>
                <Button
                  variant="ghost"
                  size={52}
                  icon={<Icon name="skip" size={18} />}
                  onClick={() =>
                    void setExercise((e) => {
                      // Never below what's logged; skipping every set skips the exercise.
                      const sets = Math.max(loggedCount, e.sets - 1);
                      return { sets, skipped: sets === 0 };
                    })
                  }
                >
                  Skip set
                </Button>
                <Button
                  variant="ghost"
                  size={52}
                  icon={<Icon name="edit" size={18} />}
                  onClick={() => setSheet('edit')}
                >
                  Edit set {cur.index}
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </main>
      <WorkoutFooter
        actionLabel={footer.label}
        {...('value' in footer && footer.value ? { actionValue: footer.value } : {})}
        onAction={footer.onAction}
        {...(nextEx
          ? {
              next: {
                name: nameOf(nextEx.exerciseId),
                rx: `${nextEx.sets} × ${repsText(nextEx.repRange)}${nextEx.load !== null ? ` @ ${num(nextEx.load)}` : ''}`,
              },
            }
          : {})}
        {...(rest && sheet !== 'rest'
          ? {
              docked: (
                <RestTimer
                  variant="docked"
                  remaining={remaining}
                  total={rest.total}
                  onSkip={() => void clearRest(db)}
                />
              ),
            }
          : {})}
      />
      {sheet === 'edit' && cur ? (
        <EditSheet
          view={view}
          cur={cur}
          convention={convention}
          onClose={() => setSheet(null)}
          onLog={(load, reps, carry) => {
            setSheet(null);
            void (async () => {
              if (carry) await setExercise(() => ({ load }));
              await log(load, reps);
            })();
          }}
        />
      ) : null}
      {sheet === 'rest' && rest ? (
        <RestSheet
          remaining={remaining}
          total={rest.total}
          setId={rest.setId}
          sets={sets}
          next={
            cur
              ? `set ${cur.index} · ${bodyweight ? `${cur.reps} reps` : `${num(cur.load ?? 0)} × ${cur.reps}`}`
              : nextEx
                ? nameOf(nextEx.exerciseId)
                : 'finish'
          }
          onClose={() => setSheet(null)}
        />
      ) : null}
      {sheet === 'pain' ? <PainSheet workout={workout} onClose={() => setSheet(null)} /> : null}
      {sheet === 'swap' ? (
        <SwapSheet workout={workout} ex={ex} position={position} onClose={() => setSheet(null)} />
      ) : null}
    </>
  );
}

const lastTimeOf = (prev: SetRecord | undefined) =>
  prev ? { lastTime: `${num(prev.load)}×${prev.reps}` } : {};

/** The logged set of a done row (done rows always have one). */
function doneSet(w: { set: SetRecord | undefined }): SetRecord {
  if (!w.set) throw new Error('done row without a set');
  return w.set;
}

function sessionTitle(w: WorkoutRecord) {
  return w.sessionKey ? `Session ${w.sessionKey}` : 'Workout';
}

function EditSheet({
  view,
  cur,
  convention,
  onClose,
  onLog,
}: {
  view: ExerciseView;
  cur: WorkRow;
  convention: LoadConvention;
  onClose: () => void;
  onLog: (load: number, reps: number, carry: boolean) => void;
}) {
  const ex = exercise(view.ex.exerciseId);
  const step = defaultLoadStep(ex);
  const typical = (
    rule('pr.double_progression').raw['increment_kg_typical'] as Record<string, [number, number]>
  )[ex.increment_class]?.[1];
  const jump = typical ?? step;
  const [load, setLoad] = useState(cur.load ?? 0);
  const [reps, setReps] = useState(cur.reps);
  const [carry, setCarry] = useState(cur.load === null);
  const bodyweight = convention === 'bodyweight';
  const unit = convention === 'per_hand' ? 'kg per hand' : 'kg';
  return (
    <Sheet
      open
      title={`Set ${cur.index}`}
      onClose={onClose}
      footer={
        <Button
          size={60}
          fullWidth
          value={bodyweight ? `${reps} reps` : `${num(load)} × ${reps}`}
          onClick={() => onLog(bodyweight ? 0 : load, reps, carry && !bodyweight)}
        >
          Log
        </Button>
      }
    >
      <p className={s['lede']}>
        {cur.load === null
          ? `Start light: aim for ${repsText(view.ex.repRange)} reps with a couple in reserve.`
          : `Plan ${num(cur.load)} × ${cur.reps}`}
      </p>
      {bodyweight ? null : (
        <>
          <NumberStepper
            label="Weight"
            value={load}
            step={step}
            min={0}
            unit={unit}
            onChange={setLoad}
          />
          <IncrementChips
            deltas={[-jump * 2, -jump, jump, jump * 2]}
            onApply={(d) => setLoad(Math.max(0, load + d))}
          />
        </>
      )}
      <NumberStepper label="Reps" value={reps} step={1} min={0} onChange={setReps} />
      {bodyweight ? null : (
        <Checkbox
          label={`Use ${num(load)} kg for the rest of the sets`}
          checked={carry}
          onChange={setCarry}
        />
      )}
    </Sheet>
  );
}

function RestSheet({
  remaining,
  total,
  setId,
  sets,
  next,
  onClose,
}: {
  remaining: number;
  total: number;
  setId: string;
  sets: readonly SetRecord[];
  next: string;
  onClose: () => void;
}) {
  const { r, db } = useAppData();
  const set = sets.find((x) => x.id === setId);
  const index = set
    ? sets.filter((x) => x.kind === 'work' && x.exerciseId === set.exerciseId).indexOf(set) + 1
    : 0;
  return (
    <Sheet open title="Rest" onClose={onClose}>
      <RestTimer
        remaining={remaining}
        total={total}
        next={next}
        onAdjust={(d) => void adjustRest(db, d)}
        onSkip={() => {
          void clearRest(db);
          onClose();
        }}
      />
      {set ? (
        <EffortTap
          scale="set"
          question={`How was set ${index}?`}
          value={(set.effort as SetEffort | null) ?? null}
          onChange={(v) => void r.sets.edit(set.id, { effort: v })}
        />
      ) : null}
    </Sheet>
  );
}

function SwapSheet({
  workout,
  ex,
  position,
  onClose,
}: {
  workout: WorkoutRecord;
  ex: WorkoutExercise;
  position: number;
  onClose: () => void;
}) {
  const { r } = useAppData();
  const profile = useProfile();
  const [pick, setPick] = useState<string | null>(null);
  if (!profile) return null;
  const options = swapOptions(ex.exerciseId, profile);
  const startFor = (toId: string) => {
    if (ex.load === null) return null;
    const st = swapStartLoad({ fromId: ex.exerciseId, toId, workingLoad: ex.load });
    return st.kind === 'load' ? st.load : null;
  };
  const labelFor = (toId: string) => {
    const bw = exercise(toId).load_convention === 'bodyweight';
    const l = startFor(toId);
    return bw
      ? 'BW'
      : l === null
        ? 'Easy first set'
        : `${num(l)} kg${exercise(toId).load_convention === 'per_hand' ? ' per hand' : ''}`;
  };
  const chosen = pick ?? options[0]?.id ?? null;

  async function swap(inPlan: boolean) {
    if (!chosen) return;
    const load = startFor(chosen);
    await r.workouts.update(workout.id, {
      exercises: workout.exercises.map((e, i) =>
        i === position ? { ...e, exerciseId: chosen, swappedFrom: e.exerciseId, load } : e,
      ),
    });
    if (inPlan) {
      const plan = await r.plans.active();
      if (plan) {
        await r.plans.activate({
          ...plan,
          sessions: plan.sessions.map((sess) =>
            sess.key !== workout.sessionKey
              ? sess
              : {
                  ...sess,
                  exercises: sess.exercises.map((e) =>
                    e.exerciseId === ex.exerciseId
                      ? { ...e, exerciseId: chosen, startLoad: load }
                      : e,
                  ),
                },
          ),
        });
      }
    }
    onClose();
  }

  return (
    <Sheet
      open
      height="tall"
      title={`Swap ${nameOf(ex.exerciseId).toLowerCase()}`}
      onClose={onClose}
      footer={
        options.length ? (
          <>
            <Button variant="secondary" size={60} fullWidth onClick={() => void swap(true)}>
              Swap in plan
            </Button>
            <Button size={60} fullWidth onClick={() => void swap(false)}>
              Swap today
            </Button>
          </>
        ) : undefined
      }
    >
      {options.length ? (
        <>
          <p className={s['lede']}>
            Best matches first, filtered to your kit. Starting weights are estimates.
          </p>
          <div className={s['stack']} style={{ gap: 8 }}>
            {options.map((o, i) => (
              <SwapRow
                key={o.id}
                rank={i + 1}
                best={i === 0}
                name={nameOf(o.id)}
                pattern={patternOf(o.id)}
                reason={SWAP_REASON[o.reason] ?? o.reason}
                load={labelFor(o.id)}
                selected={chosen === o.id}
                onSelect={() => setPick(o.id)}
              />
            ))}
          </div>
        </>
      ) : (
        <p className={s['lede']}>No swaps fit your kit for this one.</p>
      )}
    </Sheet>
  );
}

function PainSheet({ workout, onClose }: { workout: WorkoutRecord; onClose: () => void }) {
  const data = useAppData();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const { body, footer } = usePainForm((res) => {
    setBusy(true);
    void (async () => {
      await clearRest(data.db);
      const flag = await raisePainFlag(data, { ...res, date: workout.date, workout });
      void navigate(`/safety/${flag.ruleId}?flag=${flag.id}`);
    })();
  }, busy);
  return (
    <Sheet open height="tall" title="Flag pain" onClose={onClose} footer={footer}>
      {body}
    </Sheet>
  );
}
