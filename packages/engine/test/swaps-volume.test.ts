import { exercise, muscleGroupOf, rule } from '@tare/data';
import { describe, expect, it } from 'vitest';
import { swapOptions, weeklySets } from '../src/index.ts';

const bench = 'Barbell_Bench_Press_-_Medium_Grip';

describe('swapOptions', () => {
  it('keeps the data’s order and drops swaps needing kit the user lacks', () => {
    const all = exercise(bench).swaps.map((s) => s.id);
    const kit = [...new Set(all.flatMap((id) => exercise(id).equipment_detail))];
    expect(swapOptions(bench, { kit, cantDo: [] }).map((s) => s.id)).toEqual(all);
    const noDumbbells = kit.filter((k) => k !== 'dumbbells');
    const got = swapOptions(bench, { kit: noDumbbells, cantDo: [] });
    for (const s of got) expect(exercise(s.id).equipment_detail).not.toContain('dumbbells');
    expect(got.length).toBeLessThan(all.length);
  });

  it('drops swaps on the can’t-do list', () => {
    const all = exercise(bench).swaps.map((s) => s.id);
    const kit = [...new Set(all.flatMap((id) => exercise(id).equipment_detail))];
    const tags = [...new Set(all.flatMap((id) => exercise(id).skill_tags))];
    expect(tags.length).toBeGreaterThan(0);
    const got = swapOptions(bench, { kit, cantDo: tags });
    for (const s of got) expect(exercise(s.id).skill_tags).toEqual([]);
  });
});

describe('weeklySets (tr.global.set_counting + muscle_group_rollup)', () => {
  const credit = rule('tr.global.set_counting').raw['value'] as {
    primary: number;
    secondary: number;
  };

  it('counts primary and secondary muscles fractionally', () => {
    const w = weeklySets([{ exerciseId: bench, sets: 3 }]);
    const ex = exercise(bench);
    for (const m of ex.primary_muscles) expect(w.perMuscle[m]).toBe(3 * credit.primary);
    for (const m of ex.secondary_muscles) expect(w.perMuscle[m]).toBe(3 * credit.secondary);
    expect(w.ruleIds).toEqual(['tr.global.set_counting', 'tr.global.muscle_group_rollup']);
  });

  it('a group gets the max of its members per set, not the sum', () => {
    const w = weeklySets([{ exerciseId: 'Barbell_Deadlift', sets: 2 }]);
    const ex = exercise('Barbell_Deadlift');
    const groups = new Set([...ex.primary_muscles, ...ex.secondary_muscles].map(muscleGroupOf));
    for (const g of groups) expect(w.perGroup[g]).toBeLessThanOrEqual(2 * credit.primary);
  });

  it('adds up across exercises and ignores zero sets', () => {
    const w = weeklySets([
      { exerciseId: bench, sets: 3 },
      { exerciseId: 'Incline_Dumbbell_Press', sets: 3 },
      { exerciseId: 'Barbell_Squat', sets: 0 },
    ]);
    expect(w.perMuscle['chest']).toBe(6);
    expect(w.perMuscle['quadriceps']).toBeUndefined();
  });
});
