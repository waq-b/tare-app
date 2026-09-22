// zod schemas for vpt/data/*.json.
// Loose by design: the data session only ever adds, so unknown fields and unknown enum
// values pass. Missing fields fail. Enum-like fields are plain strings for that reason.
import { z } from 'zod';

const str = z.string();
const strs = z.array(z.string());

export const Source = z.looseObject({
  title: str,
  org: str,
  url: str.nullable(),
  year: z.number().nullable(),
});

const cited = {
  sources: z.array(Source),
  evidence_strength: str,
};

// ---------- exercises.json ----------

export const Exercise = z.looseObject({
  id: str,
  name: str,
  display_name: str.nullable(),
  aliases: strs,
  primary_muscles: strs,
  secondary_muscles: strs,
  stabilisers: strs,
  equipment: strs,
  equipment_detail: strs,
  movement_pattern: str,
  level: str,
  staple: z.boolean(),
  unilateral: z.boolean(),
  load_convention: str,
  increment_class: str,
  body_areas: z.array(z.looseObject({ area: str, load: str })),
  skill_tags: strs,
  swaps: z.array(z.looseObject({ id: str, reason: str })),
  cues: strs,
  instructions: strs,
});

export const ExercisesFile = z.looseObject({
  version: str,
  enums: z.looseObject({
    muscles: strs,
    equipment: strs,
    movement_pattern: strs,
    load_convention: strs,
    increment_class: strs,
    swap_reason: strs,
    level: strs,
    body_areas: strs,
    body_area_sided: strs,
    equipment_detail: strs,
    skill_tags: strs,
  }),
  muscle_groups: z.record(str, strs),
  body_area_map: z.looseObject({
    areas: z.record(str, z.looseObject({ primary: strs, secondary: strs })),
  }),
  exercises: z.array(Exercise),
});

// ---------- training_rules.json ----------

export const GlobalRule = z.looseObject({ id: str, rule: str, ...cited });

export const Goal = z.looseObject({
  id: str,
  goal: str,
  inherits: str.optional(),
  overrides: z.record(str, z.unknown()).optional(),
  ...cited,
});

export const TrainingFile = z.looseObject({
  version: str,
  global: z.array(GlobalRule),
  goals: z.array(Goal),
  minimum_doses: z.array(z.looseObject({ id: str, rule: str, ...cited })),
  conflicts: z.array(z.looseObject({ id: str, topic: str, summary: str, resolution: str })),
});

// ---------- progression_rules.json ----------

export const ProgressionMethod = z.looseObject({
  id: str,
  method: str,
  trigger: str,
  action: str,
  ...cited,
});

export const ProgressionFile = z.looseObject({
  version: str,
  methods: z.array(ProgressionMethod),
  volume_progression: z.looseObject({ id: str, rule: str, ...cited }),
  stall: z.looseObject({
    id: str,
    definition: str,
    steps: z.array(z.looseObject({ id: str, step: z.number(), action: str, detail: str })),
    ...cited,
  }),
  deload: z.looseObject({
    id: str,
    every_n_weeks: z.array(z.number()),
    default_every_n_weeks: z.number(),
    volume_cut_pct: z.array(z.number()),
    intensity_cut_pct: z.array(z.number()),
    ...cited,
  }),
  new_user_ramp: z.looseObject({ id: str, rule: str, ...cited }),
});

// ---------- safety_rules.json ----------

export const SafetyRule = z.looseObject({
  id: str,
  red_flag: str,
  action: str,
  user_message: str,
  /** Hard line 3: no AI may override a safety rule. Anything else fails to load. */
  llm_can_override: z.literal(false),
  services: strs,
  ...cited,
});

export const ScreeningQuestion = z.looseObject({ id: str, text: str, type: str });

export const Screening = z.looseObject({
  id: str,
  evidence_strength: str,
  logic_source: z.array(Source),
  questions: z.array(ScreeningQuestion),
  matrix: z.record(str, z.looseObject({ result: str, message: str })),
  result_messages: z.record(str, str),
  cleared_by_gp: z.looseObject({
    applies_to: str,
    question: ScreeningQuestion,
    if_yes: z.looseObject({ result: str, message: str }),
    if_no: z.looseObject({ message: str }),
  }),
});

export const Service = z.looseObject({ label: str });

export const SafetyFile = z.looseObject({
  version: str,
  rules: z.array(SafetyRule),
  screening: Screening,
  services: z.record(str, Service),
});

// ---------- sources.json, rule_ids.json ----------

export const SourcesFile = z.looseObject({
  version: str,
  sources: z.record(str, Source.extend({ verification: str })),
});

export const RuleIdsFile = strs;
