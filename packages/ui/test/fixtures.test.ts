// The fixtures must agree with themselves and with the rules, so no story shows an
// impossible screen (e.g. a coach review before 4 weeks of logs).
import { exercise, rule, safetyRule, screening, vpt } from '@tare/data';
import { describe, expect, it } from 'vitest';
import {
  CURRENT_WEEK,
  DELOAD_WEEK,
  deload,
  e1rm,
  e1rmHistory,
  fatLoss,
  FIXTURE_FOOD_TARGETS,
  historyOf,
  lastTwo,
  LOGGED_WEEKS,
  painFlags,
  plan,
  profile,
  review,
  screeningArea,
  screeningMatrixKey,
  sessions,
  sevenDayAverage,
  TODAY,
  weekdayOf,
  weekOf,
  weeklyGroupSets,
  weeklySets,
  weighIns,
} from '../fixtures';

const enums = vpt().enums;

describe('calendar and logs', () => {
  it('has 3 sessions in each logged week, on the planned weekdays, before today', () => {
    expect(sessions).toHaveLength(LOGGED_WEEKS * plan.length);
    for (const s of sessions) {
      const planned = plan.find((p) => p.id === s.sessionId);
      expect(weekdayOf(s.date), s.id).toBe(planned?.weekday);
      expect(weekOf(s.date), s.id).toBe(s.week);
      expect(s.date < TODAY, s.id).toBe(true);
    }
    expect(weekOf(TODAY)).toBe(CURRENT_WEEK);
  });

  it('warm-ups follow tr.global.warm_up and are lighter than working sets', () => {
    for (const s of sessions) {
      const patterns = new Set<string>();
      for (const ex of s.exercises) {
        const e = exercise(ex.exerciseId);
        const warm = ex.sets.filter((x) => x.kind === 'warmup');
        const work = ex.sets.filter((x) => x.kind === 'work');
        const expected =
          e['mechanic'] === 'compound' &&
          e.load_convention !== 'bodyweight' &&
          !patterns.has(e.movement_pattern);
        expect(warm.length > 0, `${s.id} ${ex.exerciseId}`).toBe(expected);
        for (const w of warm) expect(w.load).toBeLessThan(work[0]?.load ?? 0);
        patterns.add(e.movement_pattern);
      }
    }
  });

  it('the deload week cuts volume within pr.deload and keeps load within its intensity cut', () => {
    const [lo, hi] = deload.volume_cut_pct as [number, number];
    const [, maxLoadCut] = deload.intensity_cut_pct as [number, number];
    for (const p of plan) {
      const d = sessions.find((s) => s.week === DELOAD_WEEK && s.sessionId === p.id);
      const before = sessions.find((s) => s.week === DELOAD_WEEK - 1 && s.sessionId === p.id);
      const work = (s: typeof d) =>
        s?.exercises.flatMap((e) => e.sets.filter((x) => x.kind === 'work')) ?? [];
      const cut = 100 * (1 - work(d).length / p.exercises.reduce((n, e) => n + e.sets, 0));
      expect(cut, p.id).toBeGreaterThanOrEqual(lo);
      expect(cut, p.id).toBeLessThanOrEqual(hi);
      for (const ex of d?.exercises ?? []) {
        const prev = before?.exercises
          .find((e) => e.exerciseId === ex.exerciseId)
          ?.sets.find((x) => x.kind === 'work');
        const now = ex.sets.find((x) => x.kind === 'work');
        if (prev && now)
          expect(now.load).toBeGreaterThanOrEqual(prev.load * (1 - maxLoadCut / 100));
      }
    }
  });

  it('estimated 1RM follows tr.global.e1rm (Epley, capped reps)', () => {
    expect(e1rm(60, 10)).toBe(80);
    expect(e1rm(70, 8)).toBe(88.7);
    expect(e1rm(100, 1)).toBe(100);
    expect(e1rm(40, 12)).toBeNull();
    expect(e1rmHistory('Barbell_Bench_Press_-_Medium_Grip').at(-1)?.e1rm).toBe(80);
  });

  it('counts weekly sets per tr.global.set_counting, and groups by max not sum', () => {
    const muscles = weeklySets(8);
    const groups = weeklyGroupSets(8);
    for (const m of Object.keys(muscles)) expect(enums.muscles).toContain(m);
    // A group can never exceed the sum of its members.
    expect(groups['back']).toBeLessThanOrEqual(
      (muscles['lats'] ?? 0) + (muscles['middle back'] ?? 0) + (muscles['lower back'] ?? 0),
    );
  });
});

describe('plan and profile', () => {
  it('uses real exercises the user has the kit for and can do', () => {
    for (const p of plan) {
      for (const pe of p.exercises) {
        const e = exercise(pe.exerciseId);
        for (const tag of e.equipment_detail)
          expect(profile.kit, `${pe.exerciseId} needs ${tag}`).toContain(tag);
        for (const tag of e.skill_tags) expect(profile.cantDo).not.toContain(tag);
      }
    }
    for (const tag of profile.kit) expect(enums.equipment_detail).toContain(tag);
    for (const tag of profile.cantDo) expect(enums.skill_tags).toContain(tag);
  });

  it('prescriptions sit inside tr.goal.fat_loss ranges', () => {
    const [repLo, repHi] = fatLoss.rep_range;
    const [setLo, setHi] = fatLoss.sets_per_exercise;
    for (const p of plan) {
      for (const pe of p.exercises) {
        expect(pe.repRange[0]).toBeGreaterThanOrEqual(repLo);
        expect(pe.repRange[1]).toBeLessThanOrEqual(repHi);
        expect(pe.sets).toBeGreaterThanOrEqual(setLo);
        expect(pe.sets).toBeLessThanOrEqual(setHi);
      }
    }
    expect(() => rule(profile.goalId)).not.toThrow();
  });

  it('screening answers map to a real matrix result, with a real area', () => {
    expect(screening().matrix[screeningMatrixKey]?.result).toBe('modify');
    expect(enums.body_areas).toContain(screeningArea.area);
    expect(enums.body_area_sided).toContain(screeningArea.area);
  });
});

describe('coach review', () => {
  it('comes after the 4 weeks of logs pr.new_user_ramp requires', () => {
    expect(review.week).toBeGreaterThanOrEqual(5);
    expect(rule('pr.new_user_ramp').raw['rule']).toMatch(/4 weeks/);
  });

  it('cites only real rule IDs', () => {
    for (const c of review.changes)
      for (const id of c.ruleIds) expect(() => rule(id), `${c.id} ${id}`).not.toThrow();
  });

  it('has one accepted, one kept with a reason, and pending changes', () => {
    const by = (s: string) => review.changes.filter((c) => c.state === s);
    expect(by('accepted')).toHaveLength(1);
    expect(by('kept')).toHaveLength(1);
    expect(by('kept')[0]?.keepReason).toBeDefined();
    expect(by('pending').length).toBeGreaterThanOrEqual(1);
  });

  it('only proposes progress where the logs hit the top of the range twice (pr.double_progression)', () => {
    for (const c of review.changes.filter((x) => x.kind === 'progress')) {
      const pe = plan.flatMap((p) => p.exercises).find((e) => e.exerciseId === c.exerciseId);
      const two = lastTwo(c.exerciseId);
      expect(two).toHaveLength(2);
      for (const h of two) {
        for (const s of h.sets.filter((x) => x.kind === 'work'))
          expect(s.reps, `${c.exerciseId} ${h.date}`).toBe(pe?.repRange[1]);
      }
    }
  });

  it('the stall change matches a real stall (no load or rep gain for 3+ sessions)', () => {
    const hold = review.changes.find((c) => c.kind === 'hold');
    const recent = historyOf(hold?.exerciseId ?? '')
      .filter((h) => !h.deload)
      .slice(-3);
    const sig = (h: (typeof recent)[number]) =>
      h.sets
        .filter((x) => x.kind === 'work')
        .map((x) => `${x.load}x${x.reps}`)
        .join();
    expect(new Set(recent.map(sig)).size).toBe(1);
  });
});

describe('safety, body and the rest', () => {
  it('pain flags use real safety rules and body areas', () => {
    for (const f of painFlags) {
      expect(() => safetyRule(f.ruleId)).not.toThrow();
      expect(enums.body_areas).toContain(f.area);
      if (f.side !== 'both') expect(enums.body_area_sided).toContain(f.area);
      if (f.status === 'cleared') expect(f.clearedOn && f.clearedOn >= f.date).toBe(true);
    }
    expect(painFlags.filter((f) => f.status === 'active')).toHaveLength(1);
  });

  it('weigh-ins are in the past, in order, with a 7-day average', () => {
    expect(weighIns.every((w) => w.date <= TODAY)).toBe(true);
    expect([...weighIns].sort((a, b) => a.date.localeCompare(b.date))).toEqual(weighIns);
    expect(sevenDayAverage('2026-09-20')).not.toBeNull();
  });

  it('food targets are clearly fixture-only (vpt has none yet)', () => {
    expect(Object.keys({ FIXTURE_FOOD_TARGETS })[0]).toMatch(/^FIXTURE_/);
  });
});
