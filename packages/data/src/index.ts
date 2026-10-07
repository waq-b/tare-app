// @tare/data: the only module that reads vpt/data.
// Everything is validated on first use; accessors throw on unknown IDs rather than guess.
import type { z } from 'zod';
// Which files feed the loader is picked by a package import condition: the full vpt/data in
// tests and Storybook, the slim app bundle (dist/vpt-app.json) in the web app ("tare-app").
import { raw } from '#vpt-source';

/** The unvalidated files behind vpt() (for building the app bundle in tests and scripts). */
export const rawVpt = raw;
import { loadVpt, type RuleEntry, type Vpt } from './load.ts';
import {
  parseDoubleProgression,
  parseProgressionText,
  parseTwoForTwo,
  type DoubleProgression,
  type ProgressionText,
  type TwoForTwoRule,
} from './progression.ts';
import { parseStartingLoad, type StartingLoadRule } from './startingLoad.ts';
import type * as S from './schemas.ts';

export { loadVpt, labelFromId, MIN_VPT_VERSION, versionAtLeast } from './load.ts';
export { slimForApp } from './slim.ts';
export { parseStartingLoad, type StartingLoadRule } from './startingLoad.ts';
export type { DoubleProgression, ProgressionText, TwoForTwoRule } from './progression.ts';
export type { RawVpt, RuleEntry, RuleFile, Vpt } from './load.ts';

export type Exercise = z.infer<typeof S.Exercise>;
export type SafetyRule = z.infer<typeof S.SafetyRule>;
export type Screening = z.infer<typeof S.Screening>;
export type ScreeningQuestion = z.infer<typeof S.ScreeningQuestion>;
export type Service = z.infer<typeof S.Service>;
export type Source = z.infer<typeof S.Source>;
export type Goal = z.infer<typeof S.Goal>;

/** Known values today. Types stay open (`string & {}`) because the data only ever adds. */
export type EvidenceStrength = 'strong' | 'moderate' | 'weak' | (string & {});
export type SafetyAction =
  | 'stop_now_call_999'
  | 'stop_and_contact_111'
  | 'stop_and_see_gp'
  | 'reduce_or_rest'
  | 'modify_exercise'
  | 'continue_with_caution'
  | (string & {});

let cache: Vpt | undefined;

/** The validated dataset (parsed once). */
export function vpt(): Vpt {
  cache ??= loadVpt(raw);
  return cache;
}

let exerciseIndex: Map<string, Exercise> | undefined;

export function exercise(id: string): Exercise {
  exerciseIndex ??= new Map(vpt().exercises.map((e) => [e.id, e]));
  const ex = exerciseIndex.get(id);
  if (!ex) throw new Error(`vpt: unknown exercise "${id}"`);
  return ex;
}

/** Name to show. Staples have a short `display_name`; the rest fall back to the full name. */
export function displayName(ex: Pick<Exercise, 'display_name' | 'name'>): string {
  // FALLBACK(vpt-issue #5): non-staples have display_name: null by design in v0.1.2.
  return ex.display_name ?? ex.name;
}

export function rule(id: string): RuleEntry {
  const r = vpt().rules.get(id);
  if (!r) throw new Error(`vpt: unknown rule ID "${id}"`);
  return r;
}

export function safetyRules(): readonly SafetyRule[] {
  return vpt().safety.rules;
}

export function safetyRule(id: string): SafetyRule {
  const r = vpt().safety.rules.find((x) => x.id === id);
  if (!r) throw new Error(`vpt: unknown safety rule "${id}"`);
  return r;
}

export function screening(): Screening {
  return vpt().safety.screening;
}

export function services(): Readonly<Record<string, Service>> {
  return vpt().safety.services;
}

export function source(key: string): Source {
  const s = vpt().sources[key];
  if (!s) throw new Error(`vpt: unknown source "${key}"`);
  return s;
}

/** A goal with `inherits` resolved and `overrides` applied (e.g. fat_loss ← hypertrophy). */
export function goal(id: string): Readonly<Record<string, unknown>> & Goal {
  const all = vpt().training.goals;
  const find = (gid: string) => {
    const g = all.find((x) => x.id === gid);
    if (!g) throw new Error(`vpt: unknown goal "${gid}"`);
    return g;
  };
  const g = find(id);
  if (!g.inherits) return g;
  const parent = goal(g.inherits);
  return { ...parent, ...g, ...(g.overrides ?? {}) };
}

/** Muscle group (e.g. "back") for a muscle (e.g. "lats"), from `muscle_groups`. */
export function muscleGroupOf(muscle: string): string {
  for (const [group, members] of Object.entries(vpt().muscleGroups)) {
    if (members.includes(muscle)) return group;
  }
  throw new Error(`vpt: muscle "${muscle}" is in no muscle group`);
}

/** Exercise IDs that load a body area, from `body_area_map`. */
export function exercisesLoading(area: string, load: 'primary' | 'secondary'): readonly string[] {
  const a = vpt().bodyAreaMap[area];
  if (!a) throw new Error(`vpt: unknown body area "${area}"`);
  return a[load];
}

let startingLoadCache: StartingLoadRule | undefined;

/** tr.global.starting_load, validated (throws if the data changes shape). */
export function startingLoadRule(): StartingLoadRule {
  startingLoadCache ??= parseStartingLoad(rule('tr.global.starting_load').raw['value']);
  return startingLoadCache;
}

const method = (id: string) => {
  const m = vpt().progression.methods.find((x) => x.id === id);
  if (!m) throw new Error(`vpt: no progression method ${id}`);
  return m;
};
let doubleCache: DoubleProgression | undefined;
let twoCache: TwoForTwoRule | undefined;

/** pr.double_progression, validated. */
export function doubleProgressionRule(): DoubleProgression {
  doubleCache ??= parseDoubleProgression(method('pr.double_progression'));
  return doubleCache;
}

/** pr.two_for_two, validated. */
export function twoForTwoRule(): TwoForTwoRule {
  twoCache ??= parseTwoForTwo(method('pr.two_for_two'));
  return twoCache;
}

let textCache: ProgressionText | undefined;

/** The stall, ramp and volume rules' numbers (text-only in v0.1.3). */
export function progressionText(): ProgressionText {
  textCache ??= parseProgressionText(
    vpt().progression as unknown as Parameters<typeof parseProgressionText>[0],
  );
  return textCache;
}

/** pr.deload, typed (its numbers are structured). */
export function deloadRule() {
  return vpt().progression.deload as unknown as {
    default_every_n_weeks: number;
    volume_cut_pct: [number, number];
    intensity_cut_pct: [number, number];
    rir_increase: number;
    detail: string;
    triggers: {
      autoregulated_structured: {
        stalled_lifts_same_week_min: number;
        hard_session_share_2wk_min: number;
        wrecked_sessions_14_days_min: number;
      };
    };
  };
}

/** pr.volume_progression's structured requirements. */
export function volumeProgressionRule() {
  return (
    vpt().progression as unknown as {
      volume_progression: {
        requires_structured: {
          pain_flags_in_block: number;
          hard_session_share_max: number;
          wrecked_sessions_last_14_days_max: number;
        };
      };
    }
  ).volume_progression;
}
