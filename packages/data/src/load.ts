// Validates raw vpt files and builds the typed dataset. Pure: takes parsed JSON, returns
// data or throws. `index.ts` feeds it the real files.
import type { z } from 'zod';
import {
  ExercisesFile,
  ProgressionFile,
  RuleIdsFile,
  SafetyFile,
  SourcesFile,
  TrainingFile,
  type Source,
} from './schemas.ts';

/** Oldest vpt version this app understands. Bump when the app starts relying on new data. */
export const MIN_VPT_VERSION = '0.1.3';

export interface RawVpt {
  exercises: unknown;
  training: unknown;
  progression: unknown;
  safety: unknown;
  sources: unknown;
  ruleIds: unknown;
}

export type RuleFile = 'training' | 'progression' | 'safety';

/** Any cited rule, normalised for the "why" UI (RuleChip, EvidenceBadge, SourceLink). */
export interface RuleEntry {
  id: string;
  file: RuleFile;
  /** Short name derived from the ID, e.g. `pr.double_progression` → "double progression". */
  label: string;
  /** `undefined` when the data gives none (e.g. `tr.conflict.*`). Never guessed. */
  evidenceStrength: string | undefined;
  sources: z.infer<typeof Source>[];
  /** Where sources/evidence came from when the entry has none of its own. */
  inheritedFrom: string | undefined;
  raw: Readonly<Record<string, unknown>>;
}

function parseVersion(v: string): [number, number, number] {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v);
  if (!m) throw new Error(`vpt: bad version "${v}"`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

export function versionAtLeast(v: string, min: string): boolean {
  const [a, b] = [parseVersion(v), parseVersion(min)];
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return (a[i] as number) > (b[i] as number);
  }
  return true;
}

function parseFile<S extends z.ZodType>(name: string, schema: S, raw: unknown): z.infer<S> {
  const res = schema.safeParse(raw);
  if (!res.success) {
    const issues = res.error.issues
      .slice(0, 5)
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`vpt: ${name} failed validation\n${issues}`);
  }
  return res.data;
}

/** `pr.stall.step2` → "stall step 2"; `tr.global.set_counting` → "set counting". */
export function labelFromId(id: string): string {
  const parts = id.split('.');
  const scope = new Set(['tr', 'pr', 'sf', 'global', 'goal', 'dose', 'conflict']);
  const meaningful = parts.filter((p, i) => !(i < parts.length - 1 && scope.has(p)));
  return meaningful
    .join(' ')
    .replace(/_/g, ' ')
    .replace(/([a-z])(\d)/g, '$1 $2');
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Walks a rules file and indexes every object whose `id` is a known rule ID. Entries with no
 * sources/evidence of their own inherit from the nearest ancestor that has them. */
function indexRules(
  file: RuleFile,
  root: unknown,
  ids: ReadonlySet<string>,
  out: Map<string, RuleEntry>,
) {
  const walk = (node: unknown, cited: Obj | undefined) => {
    if (Array.isArray(node)) {
      for (const n of node) walk(n, cited);
      return;
    }
    if (!isObj(node)) return;
    const sources = node['sources'] ?? node['logic_source'];
    const own = Array.isArray(sources) || typeof node['evidence_strength'] === 'string';
    const nearest = own ? node : cited;
    const id = node['id'];
    if (typeof id === 'string' && ids.has(id)) {
      const src = (nearest?.['sources'] ?? nearest?.['logic_source'] ?? []) as RuleEntry['sources'];
      out.set(id, {
        id,
        file,
        label: labelFromId(id),
        evidenceStrength: nearest?.['evidence_strength'] as string | undefined,
        sources: src,
        inheritedFrom: own || !nearest ? undefined : (nearest['id'] as string | undefined),
        raw: node,
      });
    }
    for (const v of Object.values(node)) walk(v, nearest);
  };
  walk(root, undefined);
}

export function loadVpt(raw: RawVpt) {
  const exercisesFile = parseFile('exercises.json', ExercisesFile, raw.exercises);
  const training = parseFile('training_rules.json', TrainingFile, raw.training);
  const progression = parseFile('progression_rules.json', ProgressionFile, raw.progression);
  const safety = parseFile('safety_rules.json', SafetyFile, raw.safety);
  const sourcesFile = parseFile('sources.json', SourcesFile, raw.sources);
  const ruleIds = parseFile('rule_ids.json', RuleIdsFile, raw.ruleIds);

  const versions = {
    'exercises.json': exercisesFile.version,
    'training_rules.json': training.version,
    'progression_rules.json': progression.version,
    'safety_rules.json': safety.version,
    'sources.json': sourcesFile.version,
  };
  for (const [name, v] of Object.entries(versions)) {
    if (!versionAtLeast(v, MIN_VPT_VERSION)) {
      throw new Error(`vpt: ${name} is v${v}; the app needs at least v${MIN_VPT_VERSION}`);
    }
  }

  // Rule index. Screening questions are cited as `sf.screening.<question id>`.
  const ids = new Set(ruleIds);
  const rules = new Map<string, RuleEntry>();
  indexRules('training', training, ids, rules);
  indexRules('progression', progression, ids, rules);
  indexRules('safety', safety, ids, rules);
  const screening = rules.get('sf.screening');
  const questions = [...safety.screening.questions, safety.screening.cleared_by_gp.question];
  for (const q of questions) {
    const id = `sf.screening.${q.id}`;
    if (ids.has(id) && screening) {
      rules.set(id, {
        ...screening,
        id,
        label: labelFromId(id),
        inheritedFrom: 'sf.screening',
        raw: q,
      });
    }
  }
  const missing = ruleIds.filter((id) => !rules.has(id));
  if (missing.length) {
    throw new Error(
      `vpt: rule_ids.json lists IDs not found in any rules file: ${missing.join(', ')}`,
    );
  }

  return {
    version: exercisesFile.version,
    enums: exercisesFile.enums,
    muscleGroups: exercisesFile.muscle_groups,
    bodyAreaMap: exercisesFile.body_area_map.areas,
    exercises: exercisesFile.exercises,
    training,
    progression,
    safety,
    sources: sourcesFile.sources,
    ruleIds,
    rules,
  };
}

export type Vpt = ReturnType<typeof loadVpt>;
