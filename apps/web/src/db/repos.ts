// Domain reads and writes for the screens. All writes go through Store (saved + queued).
import type { Store } from './store.ts';
import type {
  PainFlag,
  PlanRecord,
  Profile,
  ScreeningRecord,
  SetRecord,
  WeighIn,
  WorkoutRecord,
} from './model.ts';

type Fields<T> = Omit<T, 'id' | 'updatedAt' | 'deleted'>;

export const PROFILE_ID = 'me';

export function repos(store: Store) {
  const { db } = store;
  const live = <T extends { deleted?: boolean | undefined }>(xs: T[]) =>
    xs.filter((x) => !x.deleted);

  return {
    profile: {
      get: () => store.get('profile', PROFILE_ID),
      save: (p: Fields<Profile>) => store.put('profile', { ...p, id: PROFILE_ID }),
    },

    screening: {
      save: (s: Fields<ScreeningRecord>) => store.put('screening', s),
      latest: async () => live(await db.screening.orderBy('takenAt').reverse().toArray())[0],
    },

    plans: {
      active: async () => live(await db.plans.toArray()).find((p) => p.active),
      /** Saves a plan as the active one; any other active plan is switched off. */
      activate: (p: Fields<PlanRecord> & { id?: string }) =>
        db.transaction('rw', db.plans, db.outbox, async () => {
          for (const old of live(await db.plans.toArray())) {
            if (old.active && old.id !== p.id)
              await store.update('plans', old.id, { active: false });
          }
          return store.put('plans', { ...p, active: true });
        }),
    },

    workouts: {
      start: (w: Pick<WorkoutRecord, 'planId' | 'sessionKey' | 'date' | 'exercises'>) =>
        store.put('workouts', { ...w, startedAt: store.now(), finishedAt: null, feel: null }),
      get: (id: string) => store.get('workouts', id),
      /** The workout in progress, if any (resume after a reload or crash). */
      unfinished: async () =>
        live(await db.workouts.orderBy('startedAt').reverse().toArray()).find(
          (w) => w.finishedAt === null,
        ),
      update: (id: string, change: Partial<Fields<WorkoutRecord>>) =>
        store.update('workouts', id, change),
      finish: (id: string, feel: WorkoutRecord['feel']) =>
        store.update('workouts', id, { finishedAt: store.now(), feel }),
      /** Finished workouts, newest first. */
      finished: async () =>
        live(await db.workouts.orderBy('startedAt').reverse().toArray()).filter(
          (w) => w.finishedAt !== null,
        ),
      remove: async (id: string) => {
        await db.transaction('rw', db.workouts, db.sets, db.outbox, async () => {
          for (const s of live(await db.sets.where('workoutId').equals(id).toArray())) {
            await store.remove('sets', s.id);
          }
          await store.remove('workouts', id);
        });
      },
    },

    sets: {
      log: (s: Omit<Fields<SetRecord>, 'loggedAt'>) =>
        store.put('sets', { ...s, loggedAt: store.now() }),
      edit: (id: string, change: Partial<Pick<SetRecord, 'load' | 'reps' | 'effort' | 'kind'>>) =>
        store.update('sets', id, change),
      remove: (id: string) => store.remove('sets', id),
      /** A workout's sets in the order they were logged. */
      forWorkout: async (workoutId: string) =>
        live(await db.sets.where('workoutId').equals(workoutId).sortBy('loggedAt')),
      /** Working sets for an exercise from finished workouts only, newest workout first
       * (by the workout's date, then logging order). */
      history: async (exerciseId: string) => {
        const sets = live(
          await db.sets
            .where('[exerciseId+loggedAt]')
            .between([exerciseId, -Infinity], [exerciseId, Infinity])
            .reverse()
            .toArray(),
        ).filter((s) => s.kind === 'work');
        const dateOf = new Map(
          live(await db.workouts.toArray())
            .filter((w) => w.finishedAt !== null)
            .map((w) => [w.id, w.date]),
        );
        return sets
          .filter((s) => dateOf.has(s.workoutId))
          .sort((a, b) =>
            (dateOf.get(b.workoutId) ?? '').localeCompare(dateOf.get(a.workoutId) ?? ''),
          );
      },
      /** The last working load logged for an exercise, to prefill the Ledger (#70). */
      lastWorkingLoad: async (exerciseId: string): Promise<number | null> => {
        const [last] = await repos(store).sets.history(exerciseId);
        return last ? last.load : null;
      },
    },

    weighIns: {
      add: (w: Fields<WeighIn>) => store.put('weighIns', w),
      remove: (id: string) => store.remove('weighIns', id),
      /** Oldest first. */
      list: async () => live(await db.weighIns.orderBy('date').toArray()),
    },

    painFlags: {
      raise: (f: Omit<Fields<PainFlag>, 'status' | 'clearedOn'>) =>
        store.put('painFlags', { ...f, status: 'active', clearedOn: null }),
      clear: (id: string, date: string) =>
        store.update('painFlags', id, { status: 'cleared', clearedOn: date }),
      active: async () => live(await db.painFlags.where('status').equals('active').toArray()),
      all: async () => live(await db.painFlags.orderBy('date').reverse().toArray()),
    },
  };
}

export type Repos = ReturnType<typeof repos>;
