// Writes onboarding's results as real records. Plain functions (not in the screen) so the
// clock is read here, not during a render.
import { vpt } from '@tare/data';
import type { ScreeningOutcome } from '@tare/engine';
import type { AppData } from '../../data/DbContext.tsx';
import type { SeedPlan } from '../../seed/plan.ts';
import { clearDraft, type Draft } from './draft.ts';

export function goalIdOf(key: string): string {
  const g = vpt().training.goals.find((x) => x.goal === key);
  if (!g) throw new Error(`no goal "${key}"`);
  return g.id;
}

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** The screening as answered. GP-first saves this alone ("Save my answers"). */
export function saveScreening(data: AppData, d: Draft, o: ScreeningOutcome, now = Date.now()) {
  return data.r.screening.save({
    takenAt: now,
    answers: d.answers,
    mskAreas: o.flagAreas,
    mskSide: o.flagAreas.length ? d.mskSide : null,
    clearedByGp: d.clearedByGp,
    clearedOn: d.clearedByGp === 'yes' ? isoDay(now) : null,
    gpNote: d.gpNote.trim() || null,
    result: o.result,
    ruleIds: o.ruleIds,
  });
}

/** Screening, profile and the seeded plan with the starting weights, then the draft goes. */
export async function completeOnboarding(
  data: AppData,
  d: Draft,
  o: ScreeningOutcome,
  plan: SeedPlan,
  now = Date.now(),
) {
  const { db } = data;
  // All or nothing: a reload or a closed app mid-way must never leave a profile without a plan.
  await db.transaction('rw', [db.screening, db.profile, db.plans, db.outbox, db.meta], async () => {
    await saveAll(data, d, o, plan, now);
  });
}

async function saveAll(data: AppData, d: Draft, o: ScreeningOutcome, plan: SeedPlan, now: number) {
  await saveScreening(data, d, o, now);
  await data.r.profile.save({
    goalId: goalIdOf(d.goalsRanked[0] ?? 'general'),
    goalsRanked: d.goalsRanked,
    level: d.level,
    daysPerWeek: d.daysPerWeek,
    sessionMinutes: d.sessionMinutes,
    units: 'kg',
    dumbbellConvention: 'per_hand',
    kit: d.kit,
    cantDo: d.cantDo,
    region: d.region,
    maxRpe: o.maxRpe,
    onboardedAt: now,
  });
  await data.r.plans.activate({
    ...plan,
    sessions: plan.sessions.map((sess) => ({
      ...sess,
      exercises: sess.exercises.map((e) => ({
        ...e,
        startLoad: d.startLoads[e.exerciseId] ?? null,
      })),
    })),
  });
  await clearDraft(data.db);
}
