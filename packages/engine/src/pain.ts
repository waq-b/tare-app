// Pain flag: routes the answers to a safety_rules.json rule, most urgent first, and works out
// which exercises to skip. The questions are our wording of each rule's red flag; the answer is
// always a rule ID from the data, and its message is shown verbatim by the app.
import { exercisesLoading, safetyRule } from '@tare/data';

export type PainTiming = 'during' | 'after' | 'week' | 'six_weeks';
export type PainSign = 'severe' | 'cant_bear_weight' | 'sprain' | 'calf_hot';

export interface PainAnswers {
  area: string | null;
  timing: PainTiming | null;
  signs: readonly PainSign[];
  unsure: boolean;
}

/** Follow-up signs, each mapped to the rule whose red flag it asks about. */
export const SIGNS: { sign: PainSign; text: string; rule: string; onlyFor?: string }[] = [
  {
    sign: 'calf_hot',
    text: 'The calf is hot, swollen and tender',
    rule: 'calf_hot_swollen',
    onlyFor: 'calf',
  },
  {
    sign: 'severe',
    text: 'A crack sound, an odd shape, numbness or pins and needles, or skin that’s blue, grey or cold',
    rule: 'injury_severe',
  },
  {
    sign: 'cant_bear_weight',
    text: 'Can’t put weight on it or walk more than a few steps, swelling getting worse, or feeling hot and shivery',
    rule: 'injury_cant_bear_weight',
  },
  {
    sign: 'sprain',
    text: 'Swelling or bruising after a twist or overstretch',
    rule: 'suspected_sprain_strain',
  },
];

export const TIMINGS: { value: PainTiming; title: string; hint: string; rule: string }[] = [
  {
    value: 'during',
    title: 'It came on during a set',
    hint: 'Sharp, catching, or above about 5 out of 10. (A physio rule of thumb, not NHS guidance.)',
    rule: 'pain_during_exercise',
  },
  {
    value: 'after',
    title: 'Dull soreness 1–3 days after training',
    hint: 'General muscle ache after a hard or new session',
    rule: 'doms_normal',
  },
  {
    value: 'week',
    title: 'It’s lasted more than a week',
    hint: 'Or it’s sharp or constant, or in a joint',
    rule: 'pain_not_doms',
  },
  {
    value: 'six_weeks',
    title: 'It hasn’t settled in 6 weeks',
    hint: 'An ache or injury that keeps going',
    rule: 'pain_not_settling_6wk',
  },
];

/** The rule for these answers, or null until there's enough to decide. */
export function routePainFlag(a: PainAnswers): string | null {
  const has = (s: PainSign) => a.signs.includes(s);
  if (has('calf_hot') && a.area === 'calf') return 'calf_hot_swollen';
  if (has('severe')) return 'injury_severe';
  if (has('cant_bear_weight')) return 'injury_cant_bear_weight';
  if (a.unsure) return 'unsure_if_emergency';
  if (has('sprain')) return 'suspected_sprain_strain';
  if (!a.area || !a.timing) return null;
  return TIMINGS.find((t) => t.value === a.timing)?.rule ?? null;
}

export interface PainModification {
  /** The exercise to stop now, if the flag came mid-exercise. */
  stop: string | null;
  /** Remaining exercises that load the area as primary: skip them today. */
  skip: string[];
  /** Remaining exercises to carry on with. */
  keep: string[];
  ruleIds: string[];
}

/** pain_during_exercise → engine_action: stop the current exercise and skip the rest of the
 * session's exercises that load the flagged area as primary (body_area_map). Side-agnostic. */
export function modifyForPainFlag(input: {
  area: string;
  current: string | null;
  remaining: readonly string[];
}): PainModification {
  const ruleId = 'pain_during_exercise';
  safetyRule(ruleId); // throws if the rule ever disappears
  const loads = new Set(exercisesLoading(input.area, 'primary'));
  const rest = input.remaining.filter((id) => id !== input.current);
  return {
    stop: input.current,
    skip: rest.filter((id) => loads.has(id)),
    keep: rest.filter((id) => !loads.has(id)),
    ruleIds: [ruleId],
  };
}
