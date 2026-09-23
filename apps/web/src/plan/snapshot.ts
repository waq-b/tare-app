// Reads what the rules need from Dexie in one go (for targets and offers).
import type { LoggedSession } from '@tare/engine';
import type { Repos } from '../db/index.ts';
import type { ChangeRecord, PainFlag, Profile, WorkoutRecord } from '../db/index.ts';

export interface Snapshot {
  profile: Profile | null;
  bodyweight: number | null;
  finished: WorkoutRecord[];
  /** Finished sessions per exercise, oldest first. */
  history: Record<string, LoggedSession[]>;
  changes: ChangeRecord[];
  flags: PainFlag[];
  firstWorkout: string | null;
}

export async function snapshot(r: Repos): Promise<Snapshot> {
  const [profile, weighIns, finished, sets, changes, flags] = await Promise.all([
    r.profile.get(),
    r.weighIns.list(),
    r.workouts.finished(),
    r.sets.all(),
    r.changes.all(),
    r.painFlags.all(),
  ]);
  const dateOf = new Map(finished.map((w) => [w.id, w.date]));
  const byExercise = new Map<string, Map<string, LoggedSession>>();
  for (const s of [...sets].sort((a, b) => a.loggedAt - b.loggedAt)) {
    const date = dateOf.get(s.workoutId);
    if (s.kind !== 'work' || !date) continue;
    const m = byExercise.get(s.exerciseId) ?? new Map<string, LoggedSession>();
    const cur = m.get(s.workoutId) ?? { date, sets: [] };
    m.set(s.workoutId, {
      date,
      sets: [...cur.sets, { load: s.load, reps: s.reps, effort: s.effort }],
    });
    byExercise.set(s.exerciseId, m);
  }
  const history = Object.fromEntries(
    [...byExercise].map(([id, m]) => [
      id,
      [...m.values()].sort((a, b) => a.date.localeCompare(b.date)),
    ]),
  );
  const dates = finished.map((w) => w.date).sort();
  return {
    profile: profile ?? null,
    bodyweight: weighIns.at(-1)?.kg ?? null,
    finished,
    history,
    changes,
    flags,
    firstWorkout: dates[0] ?? null,
  };
}
