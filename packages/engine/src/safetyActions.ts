// The safety rules' engine actions that shape training after a flag (safety_rules.json).
// They only ever make training easier: less load, fewer sets, or no Hard sets. Nothing here can
// loosen a safety action (hard line 3).
import { safetyRule } from '@tare/data';

// FALLBACK(vpt-issue #23): the percentages live only in engine_action text in v0.1.3.
function pctIn(ruleId: string, re: RegExp): number {
  const text = String(safetyRule(ruleId)['engine_action'] ?? '');
  const m = re.exec(text);
  if (!m?.[1]) throw new Error(`vpt: ${ruleId} engine_action changed shape: "${text}"`);
  return Number(m[1]) / 100;
}

export interface Return {
  load: number | null;
  sets: number;
  ruleIds: string[];
}

/** The first session back on an exercise after a flag on its area is cleared:
 * pain_during_exercise → a share of the previous load; suspected_sprain_strain → a share of the
 * sets. Other rules leave it as planned. */
export function returnAfterFlag(input: {
  ruleId: string;
  lastLoad: number | null;
  sets: number;
  step: number;
}): Return {
  const { ruleId, lastLoad, sets, step } = input;
  if (ruleId === 'pain_during_exercise' && lastLoad !== null) {
    const share = pctIn(ruleId, /reintroduce at (\d+)% of previous load/);
    return {
      load: Math.floor((lastLoad * share) / step + 1e-9) * step,
      sets,
      ruleIds: [ruleId],
    };
  }
  if (ruleId === 'suspected_sprain_strain') {
    const share = pctIn(ruleId, /resume at (\d+)% volume/);
    return { load: lastLoad, sets: Math.max(1, Math.round(sets * share)), ruleIds: [ruleId] };
  }
  return { load: lastLoad, sets, ruleIds: [] };
}

/** doms_normal: while it's active, the sore muscle gets no Hard sets. */
export function noHardSets(activeRuleIds: readonly string[]): boolean {
  return activeRuleIds.includes('doms_normal');
}
