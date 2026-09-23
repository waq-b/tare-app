// The app's records. Every synced record has a client-made UUIDv7 `id`, an `updatedAt`
// (ms since epoch) for last-write-wins, and `deleted` for soft deletes (P0 plan, Architecture).
// The zod schemas check imports and, from T10, what the server sends back.
import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const base = {
  id: z.string().min(1),
  updatedAt: z.number().int().nonnegative(),
  deleted: z.boolean().optional(),
};

export const Profile = z.looseObject({
  ...base,
  goalId: z.string(), // tr.goal.*
  goalsRanked: z.array(z.string()),
  level: z.enum(['beginner', 'intermediate']),
  daysPerWeek: z.number().int().min(1).max(7),
  sessionMinutes: z.number().int().positive(),
  units: z.enum(['kg', 'lb']),
  dumbbellConvention: z.enum(['per_hand', 'total']),
  kit: z.array(z.string()), // enums.equipment_detail
  cantDo: z.array(z.string()), // enums.skill_tags
  region: z.enum(['england', 'wales', 'scotland', 'northern_ireland']),
  maxRpe: z.number().nullable(), // from the screening outcome
  onboardedAt: z.number().nullable(),
  /** Body stats for suggested starting weights (tr.global.starting_load); optional. */
  sex: z.enum(['male', 'female', 'prefer_not_to_say']).nullable().optional(),
  birthYear: z.number().int().nullable().optional(),
  heightCm: z.number().positive().nullable().optional(),
  /** Smallest jump and lightest option per kind of kit (P1 T2); defaults when missing. */
  kitLoads: z
    .record(
      z.string(),
      z.looseObject({ step: z.number().positive(), lightest: z.number().nonnegative() }),
    )
    .optional(),
  /** Per-exercise smallest jump, overriding its kit's. */
  stepOverrides: z.record(z.string(), z.number().positive()).optional(),
});

export const ScreeningRecord = z.looseObject({
  ...base,
  takenAt: z.number(),
  answers: z.record(z.string(), z.enum(['yes', 'no'])),
  mskAreas: z.array(z.string()),
  mskSide: z.enum(['left', 'right', 'both']).nullable(),
  clearedByGp: z.enum(['yes', 'no']).nullable(),
  clearedOn: isoDate.nullable(),
  gpNote: z.string().nullable(),
  result: z.string(),
  ruleIds: z.array(z.string()),
});

export const PlannedExercise = z.looseObject({
  exerciseId: z.string(),
  sets: z.number().int().positive(),
  repRange: z.tuple([z.number().int().positive(), z.number().int().positive()]),
  restSec: z.number().int().positive(),
  /** kg (per hand for dumbbells); null = start with an easy calibration set (#69). */
  startLoad: z.number().nonnegative().nullable(),
});

export const PlanRecord = z.looseObject({
  ...base,
  name: z.string(),
  active: z.boolean(),
  startedOn: isoDate,
  sessions: z.array(
    z.looseObject({
      key: z.string(), // "A", "B", "C"
      name: z.string(),
      weekday: z.number().int().min(0).max(6), // 0 = Monday
      exercises: z.array(PlannedExercise),
    }),
  ),
});

/** One exercise in a workout, with the targets it started with (they can change mid-workout). */
export const WorkoutExercise = z.looseObject({
  exerciseId: z.string(),
  swappedFrom: z.string().nullable(),
  skipped: z.boolean(),
  /** Working sets planned (Add set / Skip set change it). */
  sets: z.number().int().nonnegative(),
  repRange: z.tuple([z.number().int().positive(), z.number().int().positive()]),
  restSec: z.number().int().positive(),
  /** Target working load, kg (per hand for dumbbells); null = find it with an easy first set. */
  load: z.number().nonnegative().nullable(),
  /** The load is a suggestion from body stats (tr.global.starting_load), not a logged weight. */
  estimated: z.boolean().optional(),
});

export const WorkoutRecord = z.looseObject({
  ...base,
  planId: z.string().nullable(),
  sessionKey: z.string().nullable(),
  date: isoDate,
  startedAt: z.number(),
  finishedAt: z.number().nullable(),
  feel: z.enum(['easy', 'good', 'tough', 'wrecked']).nullable(),
  /** Index of the exercise on screen, so a reload resumes in the same place. */
  current: z.number().int().nonnegative(),
  exercises: z.array(WorkoutExercise),
});

export const SetRecord = z.looseObject({
  ...base,
  workoutId: z.string(),
  exerciseId: z.string(),
  kind: z.enum(['warmup', 'work']),
  load: z.number().nonnegative(),
  reps: z.number().int().nonnegative(),
  effort: z.enum(['easy', 'ok', 'hard']).nullable(),
  loggedAt: z.number(),
});

export const WeighIn = z.looseObject({
  ...base,
  date: isoDate,
  time: z.string().regex(/^\d{2}:\d{2}$/),
  kg: z.number().positive(),
  waistCm: z.number().positive().nullable(),
});

export const PainFlag = z.looseObject({
  ...base,
  date: isoDate,
  /** enums.body_areas; null when a red flag was raised without an area (e.g. chest pain). */
  area: z.string().nullable(),
  /** For sided areas only. */
  side: z.enum(['left', 'right', 'both']).nullable(),
  ruleId: z.string(), // safety_rules.json
  workoutId: z.string().nullable(),
  exerciseId: z.string().nullable(),
  status: z.enum(['active', 'cleared']),
  clearedOn: isoDate.nullable(),
  /** Exercises the engine action took out of the session in progress. */
  skippedExerciseIds: z.array(z.string()),
});

export type Profile = z.infer<typeof Profile>;
export type ScreeningRecord = z.infer<typeof ScreeningRecord>;
export type PlannedExercise = z.infer<typeof PlannedExercise>;
export type PlanRecord = z.infer<typeof PlanRecord>;
export type WorkoutRecord = z.infer<typeof WorkoutRecord>;
export type WorkoutExercise = z.infer<typeof WorkoutExercise>;
export type SetRecord = z.infer<typeof SetRecord>;
export type WeighIn = z.infer<typeof WeighIn>;
export type PainFlag = z.infer<typeof PainFlag>;

/** Synced tables and their schemas. The outbox and meta stay on the phone. */
export const SYNCED = {
  profile: Profile,
  screening: ScreeningRecord,
  plans: PlanRecord,
  workouts: WorkoutRecord,
  sets: SetRecord,
  weighIns: WeighIn,
  painFlags: PainFlag,
} as const;
export type SyncedTable = keyof typeof SYNCED;
export const SYNCED_TABLES = Object.keys(SYNCED) as SyncedTable[];

export interface RecordOf {
  profile: Profile;
  screening: ScreeningRecord;
  plans: PlanRecord;
  workouts: WorkoutRecord;
  sets: SetRecord;
  weighIns: WeighIn;
  painFlags: PainFlag;
}

export interface OutboxEntry {
  seq?: number;
  table: SyncedTable;
  id: string;
  record: RecordOf[SyncedTable];
  queuedAt: number;
}

export interface MetaEntry {
  key: string;
  value: unknown;
}
