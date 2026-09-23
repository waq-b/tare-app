// Onboarding answers in progress. Kept in meta so a reload, or leaving to ring the GP, loses
// nothing. Written to real records only at the end (or, for GP-first, the screening alone).
import type { TareDb } from '../../db/index.ts';

export type YesNo = 'yes' | 'no';
export type Region = 'england' | 'wales' | 'scotland' | 'northern_ireland';

export interface Draft {
  acceptedDisclaimer: boolean;
  region: Region;
  answers: Record<string, YesNo>;
  mskAreas: string[];
  mskSide: 'left' | 'right' | 'both' | null;
  clearedByGp: YesNo | null;
  gpNote: string;
  goalsRanked: string[];
  daysPerWeek: number;
  sessionMinutes: number;
  level: 'beginner' | 'intermediate';
  kit: string[];
  cantDo: string[];
  /** kg per exercise; missing = the body-stats estimate, else an easy calibration set. */
  startLoads: Record<string, number>;
  /** Body stats for suggested starting weights (tr.global.starting_load). Text as typed. */
  sex: 'male' | 'female' | 'prefer_not_to_say' | null;
  age: string;
  heightCm: string;
  bodyweight: string;
}

/** Waqar's defaults (CLAUDE.md §10), all changeable. */
export const DEFAULT_DRAFT: Draft = {
  acceptedDisclaimer: false,
  region: 'england',
  answers: {},
  mskAreas: [],
  mskSide: null,
  clearedByGp: null,
  gpNote: '',
  goalsRanked: ['fat_loss', 'strength'],
  daysPerWeek: 3,
  sessionMinutes: 60,
  level: 'beginner',
  kit: [
    'barbell',
    'plates',
    'power_rack',
    'flat_bench',
    'adjustable_bench',
    'dumbbells',
    'cable_stack',
    'lat_pulldown',
    'leg_press',
    'smith_machine',
    'calf_machine',
  ],
  cantDo: ['pull_up', 'chin_up'],
  startLoads: {},
  sex: null,
  age: '',
  heightCm: '',
  bodyweight: '',
};

const num = (t: string) => {
  const n = Number(t.replace(',', '.'));
  return t.trim() && Number.isFinite(n) && n > 0 ? n : null;
};

/** The draft's body stats, or null if any required one is missing. */
export function draftBody(d: Draft) {
  const age = num(d.age);
  const bodyweight = num(d.bodyweight);
  if (!d.sex || !age || !bodyweight) return null;
  return { sex: d.sex, age: Math.round(age), bodyweight, heightCm: num(d.heightCm) };
}

const KEY = 'onboardingDraft';

export async function loadDraft(db: TareDb): Promise<Draft> {
  const m = await db.meta.get(KEY);
  return { ...DEFAULT_DRAFT, ...((m?.value as Partial<Draft> | undefined) ?? {}) };
}

export async function saveDraft(db: TareDb, d: Draft): Promise<void> {
  await db.meta.put({ key: KEY, value: d });
}

export async function clearDraft(db: TareDb): Promise<void> {
  await db.meta.delete(KEY);
}
