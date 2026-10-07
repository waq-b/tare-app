// The live targets and offers for a session, from a snapshot of Dexie.
import { blockOf, type Block } from '@tare/engine';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppData } from '../data/DbContext.tsx';
import type { PlanRecord } from '../db/index.ts';
import { mondayOf } from '../lib/dates.ts';
import { bodyStatsOf } from '../lib/estimate.ts';
import { kitFor } from '../settings/kit.ts';
import { computeOffers, type Offer } from './offers.ts';
import { snapshot, type Snapshot } from './snapshot.ts';
import { exerciseTarget, type ExerciseTarget } from './targets.ts';

export interface PlanState {
  snap: Snapshot;
  block: Block;
  /** Targets for every exercise in the plan. */
  targets: Record<string, ExerciseTarget>;
  offers: Offer[];
}

export function usePlanState(
  plan: PlanRecord | null | undefined,
  today: string,
): PlanState | undefined {
  const { r } = useAppData();
  return useLiveQuery(async () => {
    if (!plan) return undefined;
    const snap = await snapshot(r);
    const profile = snap.profile;
    const block = blockOf(snap.firstWorkout, today);
    const stats = bodyStatsOf(profile, snap.bodyweight, Number(today.slice(0, 4)));
    const targets: Record<string, ExerciseTarget> = {};
    for (const s of plan.sessions) {
      for (const p of s.exercises) {
        if (targets[p.exerciseId]) continue;
        targets[p.exerciseId] = exerciseTarget({
          planned: p,
          sessions: snap.history[p.exerciseId] ?? [],
          goalId: profile?.goalId ?? 'tr.goal.general',
          level: profile?.level ?? 'beginner',
          maxRpe: profile?.maxRpe ?? null,
          kit: kitFor(profile, p.exerciseId),
          stats,
          block,
          weekStart: mondayOf(today),
          changes: snap.changes,
          flags: snap.flags,
        });
      }
    }
    const offers = computeOffers(snap, plan, today, (id) => kitFor(profile, id));
    return { snap, block, targets, offers };
  }, [r, plan, today]);
}
