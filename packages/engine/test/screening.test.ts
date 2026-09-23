import { rule, screening } from '@tare/data';
import { describe, expect, it } from 'vitest';
import { evaluateScreening, type YesNo } from '../src/index.ts';

const sc = screening();
const ids = sc.questions.map((q) => q.id);

/** Every combination of yes/no answers. */
function* allAnswers(): Generator<Record<string, YesNo>> {
  for (let n = 0; n < 2 ** ids.length; n++) {
    yield Object.fromEntries(ids.map((id, i) => [id, n & (1 << i) ? 'yes' : 'no']));
  }
}

const answers = (over: Record<string, YesNo>) =>
  ({
    ...Object.fromEntries(ids.map((id) => [id, 'no'])),
    currently_active: 'yes',
    ...over,
  }) as Record<string, YesNo>;

describe('evaluateScreening', () => {
  it('waits until every question is answered', () => {
    const partial = answers({});
    delete partial['symptoms'];
    expect(evaluateScreening({ answers: partial })).toBeNull();
  });

  it('matches every matrix row, and shows its message verbatim', () => {
    for (const [key, row] of Object.entries(sc.matrix)) {
      const over = Object.fromEntries(key.split(',').map((p) => p.split('='))) as Record<
        string,
        YesNo
      >;
      const out = evaluateScreening({ answers: answers(over) });
      const hit = out?.rows.find((r) => r.key === key);
      expect(hit, key).toBeDefined();
      expect(hit?.result, key).toBe(row.result);
      expect(hit?.message, key).toBe(row.message);
    }
  });

  it('gives a result for every combination, with real rule IDs', () => {
    for (const a of allAnswers()) {
      const out = evaluateScreening({ answers: a });
      expect(out, JSON.stringify(a)).not.toBeNull();
      expect(Object.values(sc.matrix).map((r) => r.result)).toContain(out?.result);
      for (const id of out?.ruleIds ?? []) expect(() => rule(id), id).not.toThrow();
    }
  });

  it('puts GP clearance first whenever any row asks for it', () => {
    for (const a of allAnswers()) {
      const out = evaluateScreening({ answers: a });
      const wantsGp =
        a['symptoms'] === 'yes' ||
        a['supervised_only'] === 'yes' ||
        (a['currently_active'] === 'no' && a['known_disease'] === 'yes');
      expect(out?.result === 'medical_clearance_first', JSON.stringify(a)).toBe(wantsGp);
      expect(out?.askClearedByGp).toBe(wantsGp);
    }
  });

  it('an active lifter with no conditions is all set', () => {
    const out = evaluateScreening({ answers: answers({}) });
    expect(out?.result).toBe('continue_progress_as_tolerated');
    expect(out?.maxRpe).toBeNull();
    expect(out?.ruleIds).toEqual([
      'sf.screening',
      'sf.screening.currently_active',
      'sf.screening.known_disease',
    ]);
  });

  it('msk_issue = yes → modify: flags the area and keeps any effort cap', () => {
    const out = evaluateScreening({
      answers: answers({ currently_active: 'no', msk_issue: 'yes' }),
      mskAreas: ['knee'],
    });
    expect(out?.result).toBe('modify');
    expect(out?.message).toBe(sc.matrix['msk_issue=yes']?.message);
    expect(out?.flagAreas).toEqual(['knee']);
    expect(out?.rows.map((r) => r.result)).toEqual(['modify', 'start_light_to_moderate']);
    expect(out?.maxRpe).toBe(7);
    expect(out?.ruleIds).toContain('sf.screening.msk_issue');
  });

  it('cleared by GP = yes → start gently, with the data’s message', () => {
    const out = evaluateScreening({ answers: answers({ symptoms: 'yes' }), clearedByGp: 'yes' });
    expect(out?.result).toBe(sc.cleared_by_gp.if_yes.result);
    expect(out?.message).toBe(sc.cleared_by_gp.if_yes.message);
    expect(out?.maxRpe).toBe(7);
    expect(out?.askClearedByGp).toBe(false);
    expect(out?.setupBlocked).toBe(false);
    expect(out?.ruleIds).toContain('sf.screening.cleared_by_gp');
  });

  it('cleared by GP = no → setup waits, with the offers from the data', () => {
    const out = evaluateScreening({
      answers: answers({ supervised_only: 'yes' }),
      clearedByGp: 'no',
    });
    expect(out?.result).toBe('medical_clearance_first');
    expect(out?.message).toBe(sc.cleared_by_gp.if_no.message);
    expect(out?.setupBlocked).toBe(true);
    expect(out?.offer).toEqual(sc.cleared_by_gp.if_no['offer']);
  });

  it('ignores the GP answer when clearance wasn’t needed', () => {
    const out = evaluateScreening({ answers: answers({}), clearedByGp: 'no' });
    expect(out?.result).toBe('continue_progress_as_tolerated');
    expect(out?.setupBlocked).toBe(false);
  });
});
