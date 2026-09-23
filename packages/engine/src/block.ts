// Where the user is in their training (pr.new_user_ramp, pr.deload), and whether a deload is
// due: planned at the end of a block, or early on the rule's structured triggers.
import { deloadRule, goal, progressionText } from '@tare/data';

const DAY = 86_400_000;
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / DAY);

export interface Block {
  /** 1-based training week since the first workout (0 before any). */
  week: number;
  /** pr.new_user_ramp: the first weeks, establishing working weights. */
  ramp: boolean;
  /** pr.deload: this is a planned deload week (the week after each block). */
  plannedDeload: boolean;
  /** The first week of a new block (after a deload): where extra sets are offered. */
  newBlock: boolean;
  /** Weeks of logs, for "not enough data yet" (the ramp rule's AI threshold). */
  weeksOfLogs: number;
  ruleIds: string[];
}

export function blockOf(firstWorkout: string | null, today: string): Block {
  const t = progressionText();
  const every = deloadRule().default_every_n_weeks;
  if (!firstWorkout) {
    return {
      week: 0,
      ramp: true,
      plannedDeload: false,
      newBlock: false,
      weeksOfLogs: 0,
      ruleIds: ['pr.new_user_ramp'],
    };
  }
  const week = Math.floor(daysBetween(firstWorkout, today) / 7) + 1;
  const cycle = every + 1; // n training weeks, then a deload week
  const inCycle = ((week - 1) % cycle) + 1;
  return {
    week,
    ramp: week <= t.rampWeeks,
    plannedDeload: inCycle === cycle,
    newBlock: week > cycle && inCycle === 1,
    weeksOfLogs: Math.floor(daysBetween(firstWorkout, today) / 7),
    ruleIds: ['pr.new_user_ramp', 'pr.deload'],
  };
}

/** pr.new_user_ramp: sets during the ramp. The rule says "the goal's beginner min"; we take the
 * low end of the goal's sets per exercise, which keeps weekly sets near that minimum. */
export function rampSets(goalId: string, plannedSets: number): number {
  const [lo] = (goal(goalId) as unknown as { sets_per_exercise: [number, number] })
    .sets_per_exercise;
  return Math.min(plannedSets, lo);
}

export interface SessionFeel {
  date: string;
  feel: 'easy' | 'good' | 'tough' | 'wrecked' | null;
}

export interface DeloadCall {
  due: boolean;
  why: 'planned' | 'stalled_lifts' | 'hard_sessions' | 'wrecked_sessions' | null;
  ruleIds: string[];
}

/** pr.deload: planned at the end of a block, or early on its structured triggers. */
export function deloadDue(input: {
  block: Block;
  /** Lifts stalled this week (pr.stall). */
  stalledThisWeek: number;
  /** Finished sessions' feel, any order. */
  sessions: readonly SessionFeel[];
  today: string;
}): DeloadCall {
  const ruleIds = ['pr.deload', 'tr.global.effort_session_map'];
  const t = deloadRule().triggers.autoregulated_structured;
  if (input.block.plannedDeload) return { due: true, why: 'planned', ruleIds };
  if (input.block.ramp) return { due: false, why: null, ruleIds };
  if (input.stalledThisWeek >= t.stalled_lifts_same_week_min) {
    return { due: true, why: 'stalled_lifts', ruleIds: [...ruleIds, 'pr.stall'] };
  }
  const within = (days: number) =>
    input.sessions.filter((s) => {
      const d = daysBetween(s.date, input.today);
      return d >= 0 && d < days;
    });
  const wrecked = within(14).filter((s) => s.feel === 'wrecked').length;
  if (wrecked >= t.wrecked_sessions_14_days_min)
    return { due: true, why: 'wrecked_sessions', ruleIds };
  const twoWeeks = within(14);
  const hard = twoWeeks.filter((s) => s.feel === 'tough' || s.feel === 'wrecked').length;
  if (twoWeeks.length >= 2 && hard / twoWeeks.length >= t.hard_session_share_2wk_min) {
    return { due: true, why: 'hard_sessions', ruleIds };
  }
  return { due: false, why: null, ruleIds };
}

/** pr.deload: a deload week's sets and load. Volume goes first: sets cut by the low end of the
 * rule's range; load held (the low end of its intensity cut). */
export function deloadPrescription(sets: number, load: number | null, step: number) {
  const d = deloadRule();
  const [cut] = d.volume_cut_pct;
  const [intensity] = d.intensity_cut_pct;
  return {
    sets: Math.max(1, Math.round(sets * (1 - cut / 100))),
    load: load === null ? null : Math.floor((load * (1 - intensity / 100)) / step + 1e-9) * step,
    rirIncrease: d.rir_increase,
    ruleIds: ['pr.deload'],
  };
}
