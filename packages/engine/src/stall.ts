// pr.stall: no increase in reps or load on a lift for N sessions. Then the rule's steps: check
// recovery first; else reset the load; if it stalls again after a reset, swap or change range.
import { progressionText } from '@tare/data';
import type { LoggedSession } from './progression.ts';

const score = (s: LoggedSession) => {
  const load = Math.max(...s.sets.map((x) => x.load));
  const reps = s.sets.filter((x) => x.load === load).reduce((t, x) => t + x.reps, 0);
  return { load, reps };
};
const beats = (a: { load: number; reps: number }, b: { load: number; reps: number }) =>
  a.load > b.load || (a.load === b.load && a.reps > b.reps);

/** Stalled: none of the last N sessions beat the best before them (more load, or more reps at it). */
export function isStalled(sessions: readonly LoggedSession[]): boolean {
  const n = progressionText().stallSessions;
  const done = sessions.filter((s) => s.sets.length > 0);
  if (done.length < n + 1) return false;
  const before = done.slice(0, -n).map(score);
  const best = before.reduce((a, b) => (beats(b, a) ? b : a));
  return !done.slice(-n).some((s) => beats(score(s), best));
}

export type StallStep =
  | { step: 1; action: 'check_recovery'; ruleIds: string[] }
  | { step: 2; action: 'reset_load'; load: number; from: number; ruleIds: string[] }
  | { step: 3; action: 'swap_or_change_range'; ruleIds: string[] };

/** The step to offer for a stalled lift. `poorRecovery`: most recent sessions felt Tough or
 * Wrecked. `resetsBefore`: load resets already accepted for this lift. */
export function stallStep(input: {
  sessions: readonly LoggedSession[];
  poorRecovery: boolean;
  resetsBefore: number;
  step: number;
}): StallStep | null {
  if (!isStalled(input.sessions)) return null;
  if (input.poorRecovery)
    return { step: 1, action: 'check_recovery', ruleIds: ['pr.stall', 'pr.stall.step1'] };
  if (input.resetsBefore > 0)
    return { step: 3, action: 'swap_or_change_range', ruleIds: ['pr.stall', 'pr.stall.step3'] };
  const last = input.sessions.filter((s) => s.sets.length > 0).at(-1);
  const from = last ? Math.max(...last.sets.map((x) => x.load)) : 0;
  const [lo] = progressionText().stallDrop;
  // The low end of the drop, rounded down: always at least one kit step lighter.
  const load = Math.min(
    from - input.step,
    Math.floor((from * (1 - lo)) / input.step + 1e-9) * input.step,
  );
  return {
    step: 2,
    action: 'reset_load',
    load: Math.max(0, load),
    from,
    ruleIds: ['pr.stall', 'pr.stall.step2'],
  };
}
