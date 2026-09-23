// The first plan, seeded by hand until the AI coach can propose one (P2). The structure is
// the D1 plan (decision #69): three full-body sessions from real staples. Rep ranges, sets and
// rest come from the user's goal (tr.goal.*). Exercises the user's kit or "can't do yet" list
// rules out, or that load an area flagged at screening as primary (sf.screening msk_issue →
// modify: "exclude/modify exercises loading it", via body_area_map), are swapped for the first
// curated swap that fits, or dropped.
import { exercise, exercisesLoading, goal } from '@tare/data';
import { swapOptions } from '@tare/engine';
import type { PlanRecord, PlannedExercise } from '../db/index.ts';

interface SeedExercise {
  exerciseId: string;
  sets: number;
  repRange: [number, number];
}

const SESSIONS: { key: string; name: string; exercises: SeedExercise[] }[] = [
  {
    key: 'A',
    name: 'Session A · Squat + pull',
    exercises: [
      { exerciseId: 'Barbell_Squat', sets: 3, repRange: [6, 10] },
      { exerciseId: 'Wide-Grip_Lat_Pulldown', sets: 3, repRange: [8, 12] },
      { exerciseId: 'Leg_Press', sets: 3, repRange: [10, 15] },
      { exerciseId: 'Dumbbell_Incline_Row', sets: 3, repRange: [8, 12] },
      { exerciseId: 'Dumbbell_Bicep_Curl', sets: 2, repRange: [10, 15] },
    ],
  },
  {
    key: 'B',
    name: 'Session B · Push + pull',
    exercises: [
      { exerciseId: 'Barbell_Bench_Press_-_Medium_Grip', sets: 3, repRange: [6, 10] },
      { exerciseId: 'Wide-Grip_Lat_Pulldown', sets: 3, repRange: [8, 12] },
      { exerciseId: 'Incline_Dumbbell_Press', sets: 3, repRange: [8, 12] },
      { exerciseId: 'Seated_Cable_Rows', sets: 3, repRange: [8, 12] },
      { exerciseId: 'Side_Lateral_Raise', sets: 2, repRange: [10, 15] },
      { exerciseId: 'Triceps_Pushdown', sets: 2, repRange: [10, 15] },
    ],
  },
  {
    key: 'C',
    name: 'Session C · Hinge + press',
    exercises: [
      { exerciseId: 'Barbell_Deadlift', sets: 3, repRange: [6, 8] },
      { exerciseId: 'Standing_Military_Press', sets: 3, repRange: [6, 10] },
      { exerciseId: 'Dumbbell_Lunges', sets: 3, repRange: [8, 12] },
      { exerciseId: 'Standing_Calf_Raises', sets: 2, repRange: [10, 15] },
      { exerciseId: 'Hammer_Curls', sets: 2, repRange: [10, 15] },
    ],
  },
];

/** Weekdays per days-per-week, spread out with rest between. */
const WEEKDAYS: Record<number, number[]> = { 2: [1, 4], 3: [1, 3, 5] }; // D1 plan: Tue, Thu, Sat
export const SEED_DAYS = Object.keys(WEEKDAYS).map(Number);

export interface SeedInput {
  goalId: string;
  daysPerWeek: number;
  kit: readonly string[];
  cantDo: readonly string[];
  /** Areas flagged at screening (msk_issue = yes). */
  avoidAreas?: readonly string[];
  startedOn: string;
}

export interface SeedChange {
  exerciseId: string;
  /** The swap used, or null when nothing fitted and it was dropped. */
  to: string | null;
  why: 'kit' | 'area';
}

const clamp = (n: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, n));

export interface SeedPlan {
  name: string;
  startedOn: string;
  sessions: PlanRecord['sessions'];
}

export function seedPlan(input: SeedInput): { plan: SeedPlan; changes: SeedChange[] } {
  const g = goal(input.goalId) as unknown as {
    rep_range: [number, number];
    rest_seconds: [number, number];
    sets_per_exercise: [number, number];
  };
  const days = WEEKDAYS[input.daysPerWeek];
  if (!days) throw new Error(`seed plan: ${input.daysPerWeek} days a week isn't supported yet`);

  const avoid = new Set((input.avoidAreas ?? []).flatMap((a) => exercisesLoading(a, 'primary')));
  const kitFits = (id: string) => {
    const e = exercise(id);
    return (
      e.equipment_detail.every((k) => input.kit.includes(k)) &&
      !e.skill_tags.some((t) => input.cantDo.includes(t))
    );
  };
  const changes: SeedChange[] = [];
  const pick = (id: string): string | null => {
    if (kitFits(id) && !avoid.has(id)) return id;
    const to =
      swapOptions(id, { kit: input.kit, cantDo: input.cantDo }).find((o) => !avoid.has(o.id))?.id ??
      null;
    if (!changes.some((c) => c.exerciseId === id)) {
      changes.push({ exerciseId: id, to, why: avoid.has(id) ? 'area' : 'kit' });
    }
    return to;
  };

  const sessions = SESSIONS.slice(0, days.length).map((s, i) => ({
    key: s.key,
    name: s.name,
    weekday: days[i] as number,
    exercises: s.exercises.flatMap((x): PlannedExercise[] => {
      const id = pick(x.exerciseId);
      if (!id) return [];
      const compound = exercise(id)['mechanic'] === 'compound';
      const lo = clamp(x.repRange[0], g.rep_range);
      const hi = Math.max(lo, clamp(x.repRange[1], g.rep_range));
      return [
        {
          exerciseId: id,
          sets: clamp(x.sets, g.sets_per_exercise),
          repRange: [lo, hi],
          restSec: compound ? g.rest_seconds[1] : g.rest_seconds[0],
          startLoad: null,
        },
      ];
    }),
  }));
  return {
    plan: { name: 'Starter plan', startedOn: input.startedOn, sessions },
    changes,
  };
}

/** Every exercise in the seed, once each, in order (for the starting-weights step). */
export function uniqueExercises(plan: { sessions: PlanRecord['sessions'] }): string[] {
  return [...new Set(plan.sessions.flatMap((s) => s.exercises.map((e) => e.exerciseId)))];
}
