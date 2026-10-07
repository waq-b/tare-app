// Writes for the rules' changes (P1 T8): offer once, accept, keep, undo, and log what applied.
import type { AppData } from '../data/DbContext.tsx';
import type { ChangeRecord } from '../db/index.ts';
import { mondayOf } from '../lib/dates.ts';
import type { Offer } from './offers.ts';
import type { ExerciseTarget } from './targets.ts';

/** Saves offers not made before (their ids are stable), leaving decided ones alone. */
export async function ensureOffers(data: AppData, offers: readonly Offer[]) {
  for (const o of offers) {
    if (!(await data.db.changes.get(o.id))) await data.r.changes.put(o);
  }
}

/** Accept an offer, with its side effects: a stall's step 1 is a deload this week; extra sets
 * update the plan. */
export async function acceptOffer(data: AppData, change: ChangeRecord, today: string) {
  await data.r.changes.decide(change.id, 'accepted');
  if (change.kind === 'stall' && change.detail === 'step1') {
    const id = `deload:${mondayOf(today)}`;
    if (!(await data.db.changes.get(id))) {
      await data.r.changes.put({
        id,
        date: today,
        kind: 'deload',
        status: 'accepted',
        exerciseId: null,
        from: {},
        to: {},
        ruleIds: ['pr.deload', 'pr.stall.step1'],
        detail: 'stall_recovery',
        keepReason: null,
      });
    }
  }
  if (change.kind === 'volume' && change.detail) {
    const extra = JSON.parse(change.detail) as { index: number; to: number }[];
    const plan = await data.r.plans.active();
    if (!plan) return;
    let i = 0;
    await data.r.plans.activate({
      ...plan,
      sessions: plan.sessions.map((s) => ({
        ...s,
        exercises: s.exercises.map((e) => {
          // The proposal's index counts exercises across the whole week, in plan order.
          const index = i++;
          const hit = extra.find((x) => x.index === index);
          return hit ? { ...e, sets: hit.to } : e;
        }),
      })),
    });
  }
}

export const keepOffer = (data: AppData, change: ChangeRecord, reason: string | null) =>
  data.r.changes.decide(change.id, 'kept', reason);

/** Undo an increase the rules applied: until the next session, the load stays as last time. */
export function undoIncrease(data: AppData, t: ExerciseTarget, today: string) {
  if (t.diff?.kind !== 'increase') return Promise.resolve();
  return data.r.changes.put({
    id: `progression:${t.exerciseId}:${today}`,
    date: today,
    kind: 'progression',
    status: 'undone',
    exerciseId: t.exerciseId,
    from: { load: t.diff.from.load },
    to: { load: t.load },
    ruleIds: t.diff.ruleIds,
    detail: null,
    keepReason: null,
  });
}

/** When a workout starts: log the changes that applied (load up, a return after a flag). */
export async function logApplied(data: AppData, targets: readonly ExerciseTarget[], today: string) {
  for (const t of targets) {
    if (t.diff?.kind !== 'increase' && t.diff?.kind !== 'return') continue;
    const id = `${t.diff.kind === 'increase' ? 'progression' : 'return'}:${t.exerciseId}:${today}`;
    if (await data.db.changes.get(id)) continue;
    await data.r.changes.put({
      id,
      date: today,
      kind: t.diff.kind === 'increase' ? 'progression' : 'safety_return',
      status: 'applied',
      exerciseId: t.exerciseId,
      from: { load: t.diff.from.load, sets: t.diff.from.sets },
      to: { load: t.load, sets: t.sets },
      ruleIds: t.diff.ruleIds,
      detail: null,
      keepReason: null,
    });
  }
}
