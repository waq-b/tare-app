// Changes the rules offer (P1 T8, decision #87): stall steps (pr.stall), deloads (pr.deload) and
// extra sets at a new block (pr.volume_progression). Each has a stable id, so it's offered once;
// the user accepts or keeps it. Pure: a snapshot in, candidate records out.
import { deloadRule } from '@tare/data';
import {
  blockOf,
  deloadDue,
  isStalled,
  stallStep,
  volumeProposal,
  volumeReady,
  type KitLoad,
} from '@tare/engine';
import type { NewChange, PlanRecord } from '../db/index.ts';
import { addDays, mondayOf } from '../lib/dates.ts';
import type { Snapshot } from './snapshot.ts';

export type Offer = NewChange;

export function computeOffers(
  snap: Snapshot,
  plan: PlanRecord,
  today: string,
  kitFor: (exerciseId: string) => KitLoad,
): Offer[] {
  const profile = snap.profile;
  if (!profile) return [];
  const block = blockOf(snap.firstWorkout, today);
  const weekStart = mondayOf(today);
  const ids = [...new Set(plan.sessions.flatMap((s) => s.exercises.map((e) => e.exerciseId)))];
  const recent = [...snap.finished].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const poorRecovery =
    recent.length >= 2 &&
    recent.filter((w) => w.feel === 'tough' || w.feel === 'wrecked').length * 2 > recent.length;
  const offers: Offer[] = [];
  const base = { date: today, status: 'offered' as const, keepReason: null };

  // Stalls, one offer per lift per stall (keyed by its last session).
  let stalled = 0;
  if (!block.ramp) {
    for (const id of ids) {
      const sessions = snap.history[id] ?? [];
      if (isStalled(sessions)) stalled++;
      const resets = snap.changes.filter(
        (c) =>
          c.kind === 'stall' &&
          c.exerciseId === id &&
          c.status === 'accepted' &&
          c.to['load'] != null,
      ).length;
      const step = stallStep({
        sessions,
        poorRecovery,
        resetsBefore: resets,
        step: kitFor(id).step,
      });
      const last = sessions.at(-1);
      if (!step || !last) continue;
      offers.push({
        ...base,
        id: `stall:${id}:${last.date}`,
        kind: 'stall',
        exerciseId: id,
        from: { load: step.step === 2 ? step.from : Math.max(...last.sets.map((x) => x.load)) },
        to: { load: step.step === 2 ? step.load : null },
        ruleIds: step.ruleIds,
        detail: `step${step.step}`,
      });
    }
  }

  // A deload, planned or early.
  const call = deloadDue({
    block,
    stalledThisWeek: stalled,
    sessions: snap.finished.map((w) => ({ date: w.date, feel: w.feel })),
    today,
  });
  if (call.due) {
    offers.push({
      ...base,
      id: `deload:${weekStart}`,
      kind: 'deload',
      exerciseId: null,
      from: {},
      to: {},
      ruleIds: call.ruleIds,
      detail: call.why,
    });
  }

  // Extra sets at the start of a new block.
  if (block.newBlock) {
    const blockDays = (deloadRule().default_every_n_weeks + 1) * 7;
    const since = addDays(today, -blockDays);
    const inBlock = snap.finished.filter((w) => w.date >= since);
    const tracked = ids.filter((id) => (snap.history[id] ?? []).length >= 2);
    const ready = volumeReady({
      painFlagsInBlock: snap.flags.filter((f) => f.date >= since).length,
      sessionsInBlock: inBlock.map((w) => ({ date: w.date, feel: w.feel })),
      wreckedLast14Days: snap.finished.filter(
        (w) => w.feel === 'wrecked' && w.date >= addDays(today, -14),
      ).length,
      liftsHolding: tracked.filter((id) => !isStalled(snap.history[id] ?? [])).length,
      liftsTracked: tracked.length,
    });
    if (ready.ok) {
      const week = plan.sessions.flatMap((s) =>
        s.exercises.map((e) => ({ exerciseId: e.exerciseId, sets: e.sets })),
      );
      const { changes, ruleIds } = volumeProposal({
        goalId: profile.goalId,
        level: profile.level,
        week,
      });
      if (changes.length) {
        offers.push({
          ...base,
          id: `volume:${weekStart}`,
          kind: 'volume',
          exerciseId: null,
          // The whole week's sets, before and after.
          from: { sets: week.reduce((t, e) => t + e.sets, 0) },
          to: {
            sets:
              week.reduce((t, e) => t + e.sets, 0) + changes.reduce((t, c) => t + c.to - c.from, 0),
          },
          ruleIds,
          detail: JSON.stringify(
            changes.map((c) => ({ index: c.index, exerciseId: c.exerciseId, to: c.to })),
          ),
        });
      }
    }
  }
  return offers;
}
