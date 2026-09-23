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
