// tr.global.starting_load (vpt v0.1.3): validated, typed, with the two constants that live
// only inside formula text parsed out loudly.
import { z } from 'zod';

const band = z.looseObject({
  from: z.number(),
  to: z.number(),
  factor_at_start: z.number(),
  per_year: z.number(),
});
const ratios = z.record(z.string(), z.number());
const staple = z.looseObject({
  anchor: z.string(),
  factor: z.number().positive(),
  basis: z.string(),
  stack_dependent: z.boolean().optional(),
});

export const StartingLoadValue = z.looseObject({
  inputs: z.looseObject({
    sex: z.looseObject({ enum: z.array(z.string()) }),
    age: z.looseObject({ applies: z.tuple([z.number(), z.number()]) }),
    level: z.looseObject({
      enum: z.array(z.string()),
      definition: z.record(z.string(), z.string()),
    }),
  }),
  reference_mass: z.looseObject({ expression: z.string() }),
  ratio_1rm: z.record(z.string(), z.record(z.string(), ratios)),
  age_factor: z.looseObject({ bands: z.array(band) }),
  first_session_pct: z.looseObject({
    expression: z.string(),
    cap: z.looseObject({ age_65_plus: z.number() }).and(z.record(z.string(), z.number())),
  }),
  safety_margin: z.number().positive().max(1),
  below_lightest_load: z.looseObject({ rule: z.string(), outcomes: z.array(z.string()) }),
  anchors: z.array(z.string()),
  staples: z.record(z.string(), staple),
  calibrate_instead: z.looseObject({ staples: z.record(z.string(), z.string()) }),
  first_session: z.looseObject({
    after_set_1: z.record(z.string(), z.string()),
    max_changes: z.string(),
    label: z.string(),
  }),
  worked_examples: z.array(
    z.looseObject({
      input: z.looseObject({
        name: z.string(),
        sex: z.string(),
        age: z.number(),
        bodyweight: z.number(),
        height_cm: z.number().nullable(),
        level: z.string(),
        target_reps: z.number(),
      }),
      expected: z.record(
        z.string(),
        z.looseObject({
          unrounded_kg: z.number(),
          suggested_kg: z.number().nullable(),
          outcome: z.string(),
          kit_step_kg: z.number(),
          lightest_kg: z.number(),
        }),
      ),
    }),
  ),
});

export type StartingLoadRule = z.infer<typeof StartingLoadValue> & {
  /** Parsed from reference_mass.expression: bodyweight is capped at this BMI when height is known. */
  bmiCap: number;
  /** Parsed from first_session_pct.expression: reps in reserve for the first session. */
  firstSessionRir: number;
  /** Parsed from below_lightest_load.rule: the lightest option is OK up to this share of e1RM. */
  lightestMaxPctOf1rm: number;
};

function parse(label: string, text: string, re: RegExp): number {
  const m = re.exec(text);
  if (!m?.[1]) {
    throw new Error(`vpt: tr.global.starting_load ${label} changed shape: "${text}"`);
  }
  return Number(m[1]);
}

export function parseStartingLoad(raw: unknown): StartingLoadRule {
  const res = StartingLoadValue.safeParse(raw);
  if (!res.success) {
    const where = res.error.issues[0]?.path.join('.') ?? '';
    throw new Error(`vpt: tr.global.starting_load failed validation at ${where}`);
  }
  const v = res.data;
  // FALLBACK(vpt-issue #21): these constants live only inside formula text in v0.1.3. Parse
  // them here, loudly; switch to structured fields when the data adds them.
  return {
    ...v,
    bmiCap: parse(
      'BMI cap',
      v.reference_mass.expression,
      /min\(bodyweight,\s*([\d.]+)\s*x\s*height_m\^2\)/,
    ),
    firstSessionRir: parse(
      'reps in reserve',
      v.first_session_pct.expression,
      /target_reps\s*\+\s*([\d.]+)/,
    ),
    lightestMaxPctOf1rm:
      parse(
        'lightest-load share',
        v.below_lightest_load.rule,
        /<=\s*([\d.]+)%\s*of the estimated 1RM/,
      ) / 100,
  };
}
