import { deloadRule, goal, progressionText, rule } from '@tare/data';
import { describe, expect, it } from 'vitest';
import {
  blockOf,
  deloadDue,
  deloadPrescription,
  isStalled,
  rampSets,
  stallStep,
  volumeProposal,
  volumeReady,
  weeklySets,
  type LoggedSession,
} from '../src/index.ts';

const t = progressionText();
const every = deloadRule().default_every_n_weeks;
const addDays = (iso: string, n: number) =>
  new Date(Date.parse(iso) + n * 86_400_000).toISOString().slice(0, 10);
const START = '2026-09-01';

describe('blocks: ramp, planned deloads, new blocks', () => {
  it(`weeks 1–${t.rampWeeks} are the new-user ramp`, () => {
    expect(blockOf(START, START)).toMatchObject({ week: 1, ramp: true });
    expect(blockOf(START, addDays(START, 7 * t.rampWeeks - 1)).ramp).toBe(true);
    expect(blockOf(START, addDays(START, 7 * t.rampWeeks)).ramp).toBe(false);
    expect(blockOf(null, START)).toMatchObject({ week: 0, ramp: true });
  });

  it(`a planned deload after every ${every} weeks, then a new block`, () => {
    const weekStart = (w: number) => addDays(START, (w - 1) * 7);
    expect(blockOf(START, weekStart(every)).plannedDeload).toBe(false);
    expect(blockOf(START, weekStart(every + 1)).plannedDeload).toBe(true);
    expect(blockOf(START, weekStart(every + 2))).toMatchObject({
      plannedDeload: false,
      newBlock: true,
    });
    expect(blockOf(START, weekStart(2 * (every + 1))).plannedDeload).toBe(true);
  });

  it('ramp sets: the low end of the goal’s sets per exercise', () => {
    const [lo] = (goal('tr.goal.fat_loss') as unknown as { sets_per_exercise: [number, number] })
      .sets_per_exercise;
    expect(rampSets('tr.goal.fat_loss', 3)).toBe(lo);
    expect(rampSets('tr.goal.fat_loss', 1)).toBe(1);
  });
});

describe('pr.deload', () => {
  const block = blockOf(START, addDays(START, 21));
  const today = addDays(START, 21);
  const s = (daysAgo: number, feel: 'good' | 'tough' | 'wrecked') => ({
    date: addDays(today, -daysAgo),
    feel,
  });
  const trig = deloadRule().triggers.autoregulated_structured;

  it('planned deload weeks are due', () => {
    const b = blockOf(START, addDays(START, every * 7));
    expect(deloadDue({ block: b, stalledThisWeek: 0, sessions: [], today }).why).toBe('planned');
  });
  it(`${trig.stalled_lifts_same_week_min}+ stalled lifts in a week`, () => {
    expect(
      deloadDue({ block, stalledThisWeek: trig.stalled_lifts_same_week_min, sessions: [], today })
        .why,
    ).toBe('stalled_lifts');
  });
  it(`${trig.wrecked_sessions_14_days_min}+ Wrecked sessions in 14 days`, () => {
    expect(
      deloadDue({
        block,
        stalledThisWeek: 0,
        sessions: [s(1, 'wrecked'), s(5, 'wrecked'), s(9, 'good')],
        today,
      }).why,
    ).toBe('wrecked_sessions');
  });
  it('mostly Tough sessions over 2 weeks', () => {
    expect(
      deloadDue({
        block,
        stalledThisWeek: 0,
        sessions: [s(1, 'tough'), s(3, 'tough'), s(8, 'good'), s(10, 'good')],
        today,
      }).why,
    ).toBe('hard_sessions');
    expect(
      deloadDue({
        block,
        stalledThisWeek: 0,
        sessions: [s(1, 'tough'), s(3, 'good'), s(8, 'good')],
        today,
      }).due,
    ).toBe(false);
  });
  it('never during the ramp (except planned)', () => {
    expect(
      deloadDue({ block: blockOf(START, START), stalledThisWeek: 5, sessions: [], today: START })
        .due,
    ).toBe(false);
  });
  it('a deload week: sets cut by the rule, load held, effort eased', () => {
    const [cut] = deloadRule().volume_cut_pct;
    const d = deloadPrescription(3, 60, 2.5);
    expect(d.sets).toBe(Math.max(1, Math.round(3 * (1 - cut / 100))));
    expect(d.load).toBe(60);
    expect(d.rirIncrease).toBe(deloadRule().rir_increase);
  });
});

const sess = (load: number, reps: number[]): LoggedSession => ({
  date: 'x',
  sets: reps.map((r) => ({ load, reps: r, effort: 'ok' })),
});

describe('pr.stall', () => {
  it(`stalled after ${t.stallSessions} sessions without more load or reps`, () => {
    const flat = [
      sess(60, [8, 8, 8]),
      ...Array.from({ length: t.stallSessions }, () => sess(60, [8, 8, 7])),
    ];
    expect(isStalled(flat)).toBe(true);
    expect(isStalled(flat.slice(0, t.stallSessions))).toBe(false);
  });
  it('a rep more, or more load, clears it', () => {
    expect(
      isStalled([
        sess(60, [8, 8, 8]),
        sess(60, [8, 8, 8]),
        sess(60, [8, 8, 8]),
        sess(60, [9, 8, 8]),
      ]),
    ).toBe(false);
    expect(
      isStalled([
        sess(60, [8, 8, 8]),
        sess(60, [8, 8, 8]),
        sess(60, [8, 8, 8]),
        sess(62.5, [6, 6, 6]),
      ]),
    ).toBe(false);
  });
  const stalled = [
    sess(60, [8, 8, 8]),
    sess(60, [8, 8, 8]),
    sess(60, [8, 8, 8]),
    sess(60, [8, 8, 8]),
  ];
  it('step 1 when recovery is poor', () => {
    expect(
      stallStep({ sessions: stalled, poorRecovery: true, resetsBefore: 0, step: 2.5 })?.step,
    ).toBe(1);
  });
  it('step 2: reset the load by the low end of the drop, at least one step', () => {
    const r = stallStep({ sessions: stalled, poorRecovery: false, resetsBefore: 0, step: 2.5 });
    expect(r).toMatchObject({ step: 2, from: 60, load: 55 }); // 60 × 0.95 = 57 → 55 (one step under is 57.5; min of those)
    for (const id of r!.ruleIds) expect(() => rule(id)).not.toThrow();
  });
  it('step 3 after a reset already happened', () => {
    expect(
      stallStep({ sessions: stalled, poorRecovery: false, resetsBefore: 1, step: 2.5 })?.step,
    ).toBe(3);
  });
});

describe('pr.volume_progression', () => {
  const good = {
    painFlagsInBlock: 0,
    sessionsInBlock: [{ date: 'a', feel: 'good' as const }],
    wreckedLast14Days: 0,
    liftsHolding: 3,
    liftsTracked: 4,
  };
  it('ready when every requirement holds', () => expect(volumeReady(good).ok).toBe(true));
  it('each requirement can block it', () => {
    expect(volumeReady({ ...good, painFlagsInBlock: 1 }).blockedBy).toBe('pain_flags');
    expect(volumeReady({ ...good, wreckedLast14Days: 1 }).blockedBy).toBe('wrecked_sessions');
    expect(
      volumeReady({
        ...good,
        sessionsInBlock: [
          { date: 'a', feel: 'tough' },
          { date: 'b', feel: 'good' },
        ],
      }).blockedBy,
    ).toBe('hard_sessions');
    expect(volumeReady({ ...good, liftsHolding: 2, liftsTracked: 4 }).blockedBy).toBe(
      'performance',
    );
  });
  it('adds sets without passing the goal’s weekly max or sets per exercise', () => {
    const week = [
      { exerciseId: 'Barbell_Squat', sets: 3 },
      { exerciseId: 'Barbell_Bench_Press_-_Medium_Grip', sets: 3 },
      { exerciseId: 'Wide-Grip_Lat_Pulldown', sets: 3 },
    ];
    const { changes } = volumeProposal({ goalId: 'tr.goal.fat_loss', level: 'beginner', week });
    expect(changes.length).toBeGreaterThan(0);
    const after = week.map((e, i) => ({
      ...e,
      sets: changes.find((c) => c.index === i)?.to ?? e.sets,
    }));
    const max = (
      goal('tr.goal.fat_loss') as unknown as {
        weekly_sets_per_muscle: { beginner: { max: number } };
      }
    ).weekly_sets_per_muscle.beginner.max;
    for (const v of Object.values(weeklySets(after).perMuscle)) expect(v).toBeLessThanOrEqual(max);
    for (const e of after) expect(e.sets).toBeLessThanOrEqual(4);
  });
  it('offers nothing when every muscle is at the max already', () => {
    const week = Array.from({ length: 4 }, () => ({ exerciseId: 'Barbell_Squat', sets: 3 }));
    expect(volumeProposal({ goalId: 'tr.goal.fat_loss', level: 'beginner', week }).changes).toEqual(
      [],
    );
  });
});
