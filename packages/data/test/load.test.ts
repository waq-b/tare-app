import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  displayName,
  exercise,
  exercisesLoading,
  goal,
  labelFromId,
  loadVpt,
  MIN_VPT_VERSION,
  muscleGroupOf,
  rule,
  safetyRule,
  safetyRules,
  screening,
  services,
  versionAtLeast,
  vpt,
  type RawVpt,
} from '../src/index.ts';

const file = (name: string): unknown =>
  JSON.parse(readFileSync(new URL(`../../../vpt/data/${name}`, import.meta.url), 'utf8'));

/** A fresh deep copy of the real files, safe to mutate. */
function raw(): RawVpt & Record<string, unknown> {
  return {
    exercises: file('exercises.json'),
    training: file('training_rules.json'),
    progression: file('progression_rules.json'),
    safety: file('safety_rules.json'),
    sources: file('sources.json'),
    ruleIds: file('rule_ids.json'),
  };
}
// Tests mutate raw JSON to prove the loader rejects bad data; `any` keeps that readable.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

describe('loading vpt', () => {
  it('parses every file at the minimum version or newer', () => {
    const d = vpt();
    expect(versionAtLeast(d.version, MIN_VPT_VERSION)).toBe(true);
    expect(d.exercises.length).toBeGreaterThan(800);
    expect(d.safety.rules.length).toBeGreaterThan(0);
  });

  it('resolves every ID in rule_ids.json', () => {
    for (const id of vpt().ruleIds) expect(rule(id).id).toBe(id);
  });

  it('gives every rule sources and evidence, except the documented conflicts', () => {
    for (const id of vpt().ruleIds) {
      const r = rule(id);
      if (id.startsWith('tr.conflict.')) {
        expect(r.evidenceStrength, id).toBeUndefined();
        continue;
      }
      expect(r.evidenceStrength, id).toMatch(/^(strong|moderate|weak)$/);
      expect(r.sources.length, id).toBeGreaterThan(0);
    }
  });

  it('inherits sources for stall steps and screening questions', () => {
    expect(rule('pr.stall.step2').inheritedFrom).toBe('pr.stall');
    expect(rule('pr.stall.step2').sources).toEqual(rule('pr.stall').sources);
    expect(rule('sf.screening.msk_issue').inheritedFrom).toBe('sf.screening');
    expect(rule('pr.double_progression').inheritedFrom).toBeUndefined();
  });

  it('accepts fields and enum values it does not know (the data only adds)', () => {
    const r = raw();
    (r.exercises as Json).brand_new_field = { anything: true };
    ((r.exercises as Json).exercises[0] as Json).movement_pattern = 'teleport';
    (r.safety as Json).rules[0].new_field = 'x';
    expect(() => loadVpt(r)).not.toThrow();
  });

  it('fails loudly on a missing field', () => {
    const r = raw();
    delete (r.safety as Json).rules[0].user_message;
    expect(() => loadVpt(r)).toThrow(/safety_rules\.json failed validation[\s\S]*user_message/);
  });

  it('fails loudly on a removed or renamed rule ID', () => {
    const r = raw();
    const methods = (r.progression as Json).methods as Json[];
    const dp = methods.find((m: Json) => m.id === 'pr.double_progression');
    dp.id = 'pr.double_progression_v2';
    expect(() => loadVpt(r)).toThrow(/pr\.double_progression\b/);
  });

  it('refuses data older than MIN_VPT_VERSION', () => {
    const r = raw();
    (r.training as Json).version = '0.1.1';
    expect(() => loadVpt(r)).toThrow(/training_rules\.json is v0\.1\.1/);
  });

  it('refuses a safety rule an AI could override (hard line 3)', () => {
    const r = raw();
    (r.safety as Json).rules[0].llm_can_override = true;
    expect(() => loadVpt(r)).toThrow(/llm_can_override/);
  });
});

describe('accessors', () => {
  it('finds exercises and uses display_name with a fallback', () => {
    const bench = exercise('Barbell_Bench_Press_-_Medium_Grip');
    expect(displayName(bench)).toBe('Bench press');
    const nonStaple = vpt().exercises.find((e) => !e.staple && e.display_name === null);
    expect(nonStaple && displayName(nonStaple)).toBe(nonStaple?.name);
    expect(() => exercise('Nope')).toThrow(/unknown exercise/);
  });

  it('every swap points at a real exercise', () => {
    for (const e of vpt().exercises)
      for (const s of e.swaps) expect(() => exercise(s.id)).not.toThrow();
  });

  it('resolves goal inheritance (fat_loss ← hypertrophy, with overrides)', () => {
    const g = goal('tr.goal.fat_loss');
    const h = goal('tr.goal.hypertrophy');
    expect(g['rest_seconds']).toEqual(h['rest_seconds']);
    expect(g['weekly_sets_per_muscle']).toEqual({
      beginner: { min: 4, optimal: 8, max: 12 },
      intermediate: { min: 6, optimal: 10, max: 16 },
    });
  });

  it('safety rules: every rule has an action, a message and services that exist', () => {
    const svc = services();
    for (const r of safetyRules()) {
      expect(r.user_message.length).toBeGreaterThan(0);
      for (const s of r.services) expect(svc[s], `${r.id} → ${s}`).toBeDefined();
    }
    expect(safetyRule('pain_during_exercise').action).toBe('modify_exercise');
  });

  it('screening: every matrix result has a message', () => {
    const s = screening();
    for (const m of Object.values(s.matrix)) expect(s.result_messages[m.result]).toBeTruthy();
    expect(s.questions.map((q) => q.id)).toEqual([
      'currently_active',
      'known_disease',
      'symptoms',
      'msk_issue',
      'supervised_only',
    ]);
  });

  it('muscle groups cover every muscle exactly once', () => {
    for (const m of vpt().enums.muscles) expect(() => muscleGroupOf(m)).not.toThrow();
    expect(muscleGroupOf('lats')).toBe('back');
  });

  it('body areas map to real exercises', () => {
    for (const area of vpt().enums.body_areas) {
      for (const id of exercisesLoading(area, 'primary')) expect(() => exercise(id)).not.toThrow();
    }
    expect(exercisesLoading('shoulder', 'primary')).toContain('Barbell_Bench_Press_-_Medium_Grip');
  });

  it('labels rule IDs for the UI', () => {
    expect(labelFromId('pr.double_progression')).toBe('double progression');
    expect(labelFromId('tr.global.set_counting')).toBe('set counting');
    expect(labelFromId('pr.stall.step2')).toBe('stall step 2');
    expect(labelFromId('tr.goal.fat_loss')).toBe('fat loss');
    expect(labelFromId('sf.screening.msk_issue')).toBe('screening msk issue');
  });
});
