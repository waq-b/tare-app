import { exercise, exercisesLoading, goal } from '@tare/data';
import { describe, expect, it } from 'vitest';
import { seedPlan, uniqueExercises } from '../src/seed/plan.ts';
import { DEFAULT_DRAFT } from '../src/screens/onboarding/draft.ts';

const base = {
  goalId: 'tr.goal.fat_loss',
  daysPerWeek: 3,
  kit: DEFAULT_DRAFT.kit,
  cantDo: DEFAULT_DRAFT.cantDo,
  startedOn: '2026-09-28',
};

describe('seed plan (#69)', () => {
  it('Waqar’s defaults: the D1 plan, Tue/Thu/Sat, every exercise fits his kit', () => {
    const { plan, changes } = seedPlan(base);
    expect(changes).toEqual([]);
    expect(plan.sessions.map((s) => [s.key, s.weekday])).toEqual([
      ['A', 1],
      ['B', 3],
      ['C', 5],
    ]);
    for (const id of uniqueExercises(plan)) {
      expect(
        exercise(id).equipment_detail.every((k) => base.kit.includes(k)),
        id,
      ).toBe(true);
    }
    expect(plan.sessions.flatMap((s) => s.exercises).every((e) => e.startLoad === null)).toBe(true);
  });

  it('reps, sets and rest sit inside the goal’s ranges (tr.goal.*)', () => {
    for (const g of [
      'tr.goal.fat_loss',
      'tr.goal.strength',
      'tr.goal.endurance',
      'tr.goal.general',
    ]) {
      const r = goal(g) as unknown as {
        rep_range: [number, number];
        rest_seconds: [number, number];
        sets_per_exercise: [number, number];
      };
      for (const e of seedPlan({ ...base, goalId: g }).plan.sessions.flatMap((s) => s.exercises)) {
        expect(e.repRange[0], g).toBeGreaterThanOrEqual(r.rep_range[0]);
        expect(e.repRange[1], g).toBeLessThanOrEqual(r.rep_range[1]);
        expect(e.repRange[0]).toBeLessThanOrEqual(e.repRange[1]);
        expect(r.rest_seconds).toContain(e.restSec);
        expect(e.sets).toBeGreaterThanOrEqual(r.sets_per_exercise[0]);
        expect(e.sets).toBeLessThanOrEqual(r.sets_per_exercise[1]);
      }
    }
  });

  it('swaps what the kit rules out, and says so', () => {
    const kit = base.kit.filter((k) => k !== 'leg_press' && k !== 'calf_machine');
    const { plan, changes } = seedPlan({ ...base, kit });
    expect(changes.map((c) => c.exerciseId).sort()).toEqual(['Leg_Press', 'Standing_Calf_Raises']);
    expect(changes.every((c) => c.why === 'kit')).toBe(true);
    for (const id of uniqueExercises(plan)) {
      expect(
        exercise(id).equipment_detail.every((k) => kit.includes(k)),
        id,
      ).toBe(true);
    }
  });

  it('a flagged knee: nothing left in the plan loads the knee as primary (msk_issue → modify)', () => {
    const { plan, changes } = seedPlan({ ...base, avoidAreas: ['knee'] });
    const knee = new Set(exercisesLoading('knee', 'primary'));
    for (const id of uniqueExercises(plan)) expect(knee.has(id), id).toBe(false);
    expect(changes.length).toBeGreaterThan(0);
    expect(changes.every((c) => c.why === 'area' || c.why === 'kit')).toBe(true);
    expect(changes.filter((c) => c.why === 'area').map((c) => c.exerciseId)).toContain(
      'Barbell_Squat',
    );
  });

  it('two days a week: sessions A and B, Tue and Fri', () => {
    const { plan } = seedPlan({ ...base, daysPerWeek: 2 });
    expect(plan.sessions.map((s) => [s.key, s.weekday])).toEqual([
      ['A', 1],
      ['B', 4],
    ]);
  });

  it('refuses days it can’t plan for yet', () => {
    expect(() => seedPlan({ ...base, daysPerWeek: 5 })).toThrow(
      'isn’t supported'.replace('’', "'"),
    );
  });
});
