// Eight weeks of logged sessions, simulated under the real rules so every number is
// explainable: double progression (pr.double_progression), warm-ups (tr.global.warm_up),
// a deload in week 6 (pr.deload), and one stall (lat pulldown, for pr.stall).
// Progression is applied through week 7; week 8's outcomes become the coach review (coach.ts).
import { exercise } from '@tare/data';
import { DELOAD_WEEK, dateOf } from './calendar';
import { plan, STALLED } from './plan';
import { deloadSets as engineDeloadSets } from '@tare/engine';
import { needsWarmUp, progressedLoad, warmUpSets } from './rules';
import type {
  LoggedExercise,
  LoggedSession,
  LoggedSet,
  PlannedExercise,
  SessionFeel,
} from './types';

export const LOGGED_WEEKS = 8;

interface Progress {
  load: number;
  reps: number;
  topStreak: number;
}

/** A deload week's sets per exercise (the engine's pr.deload prescription). */
export function deloadSets(exercises: readonly PlannedExercise[]): number[] {
  return engineDeloadSets(exercises.map((e) => e.sets));
}

function simulate() {
  const state = new Map<string, Progress>();
  const sessions: LoggedSession[] = [];
  const order = [...plan].sort((a, b) => a.weekday - b.weekday);

  for (let week = 1; week <= LOGGED_WEEKS; week++) {
    const isDeload = week === DELOAD_WEEK;
    for (const planned of order) {
      const date = dateOf(week, planned.weekday);
      const setCounts = isDeload
        ? deloadSets(planned.exercises)
        : planned.exercises.map((e) => e.sets);
      const patterns = new Set<string>();
      const exercises: LoggedExercise[] = planned.exercises.map((pe, i) => {
        const [lo, hi] = pe.repRange;
        const st = state.get(pe.exerciseId) ?? { load: pe.startLoad, reps: lo, topStreak: 0 };
        state.set(pe.exerciseId, st);
        const n = setCounts[i] as number;
        const stalled = pe.exerciseId === STALLED.exerciseId && week >= STALLED.fromWeek;
        // A deterministic off day now and then: the last set misses a rep.
        const offDay = !isDeload && (week * 7 + i + planned.weekday) % 6 === 0;
        const sets: LoggedSet[] = [];

        if (needsWarmUp(pe.exerciseId, patterns)) {
          for (const w of warmUpSets(pe.exerciseId, st.load, st.reps))
            sets.push({ kind: 'warmup', ...w });
        }
        patterns.add(exercise(pe.exerciseId).movement_pattern);

        for (let s = 0; s < n; s++) {
          const last = s === n - 1;
          const reps = last && (offDay || stalled) ? Math.max(lo, st.reps - 1) : st.reps;
          const effort = isDeload
            ? 'easy'
            : last && (reps >= hi || offDay || stalled)
              ? 'hard'
              : 'ok';
          sets.push({ kind: 'work', load: st.load, reps, effort });
        }

        // Progress (through week 7). Deload weeks don't count towards the streak.
        if (!isDeload && week < LOGGED_WEEKS) {
          const work = sets.filter((x) => x.kind === 'work');
          const allTop = work.every((x) => x.reps >= hi);
          const allHit = work.every((x) => x.reps >= st.reps);
          if (allTop) {
            st.topStreak += 1;
            if (st.topStreak >= 2) {
              st.load = progressedLoad(pe.exerciseId, st.load);
              st.reps = lo;
              st.topStreak = 0;
            }
          } else {
            st.topStreak = 0;
            if (allHit && !stalled) st.reps = Math.min(hi, st.reps + 1);
          }
        }
        return { exerciseId: pe.exerciseId, sets };
      });

      const workSets = exercises.reduce(
        (c, e) => c + e.sets.filter((x) => x.kind === 'work').length,
        0,
      );
      const feel: SessionFeel = isDeload
        ? 'easy'
        : (week === 5 && planned.id === 'A') || (week === 8 && planned.id === 'C')
          ? 'tough'
          : 'good';
      sessions.push({
        id: `w${week}-${planned.id}`,
        date,
        week,
        sessionId: planned.id,
        deload: isDeload,
        durationMin: 12 + workSets * 3,
        feel,
        exercises,
        synced: true,
      });
    }
  }
  return { sessions, state };
}

const sim = simulate();

/** Every logged session, oldest first (weeks 1–8). */
export const sessions: readonly LoggedSession[] = sim.sessions;

/** Logged sessions for one exercise, oldest first, with just that exercise's sets. */
export function historyOf(exerciseId: string) {
  return sessions.flatMap((s) => {
    const ex = s.exercises.find((e) => e.exerciseId === exerciseId);
    return ex
      ? [{ date: s.date, week: s.week, sessionId: s.sessionId, deload: s.deload, sets: ex.sets }]
      : [];
  });
}

/** Working load and rep target going into week 9, before any review change is applied. */
export function currentTarget(exerciseId: string): { load: number; reps: number } {
  const st = sim.state.get(exerciseId);
  if (!st) throw new Error(`fixtures: ${exerciseId} is not in the plan`);
  return { load: st.load, reps: st.reps };
}
