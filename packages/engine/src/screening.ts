// Onboarding screening (sf.screening). The matrix, messages and GP follow-up are the data's;
// the engine only decides which rows match and which one leads.
import { screening } from '@tare/data';

export type YesNo = 'yes' | 'no';

export interface ScreeningAnswers {
  /** Answers by question ID (sf.screening questions). */
  answers: Readonly<Record<string, YesNo | undefined>>;
  /** Body areas for msk_issue = yes (enums.body_areas). */
  mskAreas?: readonly string[];
  /** The cleared_by_gp follow-up, once asked. */
  clearedByGp?: YesNo;
}

export interface ScreeningRow {
  /** Matrix key, e.g. "currently_active=yes,known_disease=no". */
  key: string;
  result: string;
  /** Shown verbatim. */
  message: string;
  maxRpe: number | null;
}

export interface ScreeningOutcome {
  /** The leading result (most cautious matched row). */
  result: string;
  /** The leading message, verbatim from the data. */
  message: string;
  /** Every matched row, most cautious first. */
  rows: ScreeningRow[];
  /** Lowest max RPE across the matched rows, or null for no cap. */
  maxRpe: number | null;
  /** Areas to plan around (msk_issue = yes). */
  flagAreas: string[];
  /** True when setup can't go on until the GP has said yes (cleared_by_gp.if_no). */
  setupBlocked: boolean;
  /** Services to offer (safety_rules.json → services keys). */
  offer: string[];
  /** True when the cleared_by_gp question should be asked next. */
  askClearedByGp: boolean;
  ruleIds: string[];
}

/** Most cautious first. The data has no precedence between rows, so this order is ours:
 * medical clearance beats everything, then working around an area, then effort caps. */
const CAUTION = [
  'medical_clearance_first',
  'modify',
  'continue_moderate',
  'start_light_to_moderate',
  'continue_progress_as_tolerated',
];
// An unknown (newly added) result gets -1, so it's treated as the most cautious.
const rank = (result: string) => CAUTION.indexOf(result);

const parseKey = (key: string) =>
  key.split(',').map((part) => {
    const [q, a] = part.split('=');
    return { q: q ?? '', a: a ?? '' };
  });

const maxRpeOf = (row: Record<string, unknown>) =>
  typeof row['max_rpe'] === 'number' ? row['max_rpe'] : null;

/** The screening outcome, or null until every question has an answer. */
export function evaluateScreening(input: ScreeningAnswers): ScreeningOutcome | null {
  const sc = screening();
  if (sc.questions.some((q) => input.answers[q.id] === undefined)) return null;

  const ruleIds = new Set(['sf.screening']);
  let rows: ScreeningRow[] = Object.entries(sc.matrix)
    .filter(([key]) => parseKey(key).every(({ q, a }) => input.answers[q] === a))
    .map(([key, row]) => {
      for (const { q } of parseKey(key)) ruleIds.add(`sf.screening.${q}`);
      return { key, result: row.result, message: row.message, maxRpe: maxRpeOf(row) };
    })
    .sort((a, b) => rank(a.result) - rank(b.result));

  const first = rows[0];
  if (!first) throw new Error('sf.screening: no matrix row matches a complete set of answers');

  const gp = sc.cleared_by_gp;
  const needsGp = first.result === gp.applies_to;
  let setupBlocked = false;
  let offer: string[] = [];
  if (needsGp && input.clearedByGp) {
    ruleIds.add('sf.screening.cleared_by_gp');
    if (input.clearedByGp === 'yes') {
      const yes: ScreeningRow = {
        key: 'cleared_by_gp=yes',
        result: gp.if_yes.result,
        message: gp.if_yes.message,
        maxRpe: maxRpeOf(gp.if_yes),
      };
      rows = [yes, ...rows.filter((r) => r.result !== gp.applies_to)].sort(
        (a, b) => rank(a.result) - rank(b.result),
      );
    } else {
      setupBlocked = gp.if_no['setup_blocked'] === true;
      offer = (gp.if_no['offer'] as string[] | undefined) ?? [];
      rows = [{ ...first, key: 'cleared_by_gp=no', message: gp.if_no.message }, ...rows.slice(1)];
    }
  }

  const lead = rows[0] ?? first;
  const caps = rows.map((r) => r.maxRpe).filter((x): x is number => x !== null);
  return {
    result: lead.result,
    message: lead.message,
    rows,
    maxRpe: caps.length ? Math.min(...caps) : null,
    flagAreas: input.answers['msk_issue'] === 'yes' ? [...(input.mskAreas ?? [])] : [],
    setupBlocked,
    offer,
    askClearedByGp: needsGp && !input.clearedByGp,
    ruleIds: [...ruleIds],
  };
}
