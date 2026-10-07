// pr.double_progression and pr.two_for_two, validated and typed. Two numbers live only in the
// trigger text in v0.1.3; they're parsed loudly (FALLBACK(vpt-issue #22)).
import { z } from 'zod';

const byClass = z.looseObject({ upper: z.number(), lower: z.number() });
const range = z.tuple([z.number(), z.number()]);

const Double = z.looseObject({
  id: z.literal('pr.double_progression'),
  default_for: z.array(z.string()),
  trigger: z.string(),
  increment_pct: byClass,
  increment_kg_min: byClass,
});
const TwoForTwo = z.looseObject({
  id: z.literal('pr.two_for_two'),
  default_for: z.array(z.string()),
  trigger: z.string(),
  increment_kg: z.looseObject({
    upper: z.looseObject({ novice: range, trained: range }),
    lower: z.looseObject({ novice: range, trained: range }),
  }),
});

export type DoubleProgression = z.infer<typeof Double> & { sessions: number };
export type TwoForTwoRule = z.infer<typeof TwoForTwo> & { sessions: number; repsOver: number };

function num(label: string, text: string, re: RegExp): number {
  const m = re.exec(text);
  if (!m?.[1]) throw new Error(`vpt: ${label} changed shape: "${text}"`);
  return Number(m[1]);
}

function parse<S extends z.ZodType>(schema: S, raw: unknown, id: string): z.infer<S> {
  const r = schema.safeParse(raw);
  if (!r.success)
    throw new Error(`vpt: ${id} failed validation at ${r.error.issues[0]?.path.join('.')}`);
  return r.data;
}

// FALLBACK(vpt-issue #22): "in 2 consecutive sessions" and "2+ reps above" are text only.
const SESSIONS = /in (\d+) consecutive sessions/;

export function parseDoubleProgression(raw: unknown): DoubleProgression {
  const v = parse(Double, raw, 'pr.double_progression');
  return { ...v, sessions: num('pr.double_progression trigger', v.trigger, SESSIONS) };
}

export function parseTwoForTwo(raw: unknown): TwoForTwoRule {
  const v = parse(TwoForTwo, raw, 'pr.two_for_two');
  return {
    ...v,
    sessions: num('pr.two_for_two trigger', v.trigger, SESSIONS),
    repsOver: num('pr.two_for_two trigger', v.trigger, /(\d+)\+ reps above/),
  };
}

/** Numbers the stall, ramp and volume rules carry only in text (v0.1.3). */
export interface ProgressionText {
  /** pr.stall: sessions with no increase before a lift counts as stalled. */
  stallSessions: number;
  /** pr.stall.step2: drop load by this range (fractions). */
  stallDrop: [number, number];
  /** pr.new_user_ramp: how many weeks the ramp lasts. */
  rampWeeks: number;
  /** pr.new_user_ramp: the effort aim (RPE). */
  rampRpe: [number, number];
  /** pr.new_user_ramp: weeks of logs before AI suggestions (P2). */
  aiAfterWeeks: number;
  /** pr.volume_progression: sets per muscle per week to add at a new block. */
  volumeAdd: [number, number];
}

// FALLBACK(vpt-issue #22): parsed from the rules' text until the data adds fields.
export function parseProgressionText(p: {
  stall: { definition: string; steps: { id: string; detail: string }[] };
  new_user_ramp: { rule: string };
  volume_progression: { rule: string };
}): ProgressionText {
  const step2 = p.stall.steps.find((s) => s.id === 'pr.stall.step2')?.detail ?? '';
  return {
    stallSessions: num('pr.stall definition', p.stall.definition, /for (\d+) consecutive sessions/),
    stallDrop: [
      num('pr.stall.step2', step2, /Drop load (\d+)-\d+%/) / 100,
      num('pr.stall.step2', step2, /Drop load \d+-(\d+)%/) / 100,
    ],
    rampWeeks: num('pr.new_user_ramp', p.new_user_ramp.rule, /Weeks 1-(\d+):/),
    rampRpe: [
      num('pr.new_user_ramp', p.new_user_ramp.rule, /RPE (\d+)-\d+/),
      num('pr.new_user_ramp', p.new_user_ramp.rule, /RPE \d+-(\d+)/),
    ],
    aiAfterWeeks: num('pr.new_user_ramp', p.new_user_ramp.rule, /until (\d+) weeks of logs/),
    volumeAdd: [
      num('pr.volume_progression', p.volume_progression.rule, /Add (\d+)-\d+ sets/),
      num('pr.volume_progression', p.volume_progression.rule, /Add \d+-(\d+) sets/),
    ],
  };
}
