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
  /** kg per exercise; missing = start with an easy calibration set (#69). */
  startLoads: Record<string, number>;
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
};

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
