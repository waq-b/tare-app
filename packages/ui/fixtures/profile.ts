// The fictional user. Uses the default plan, with invented personal details.
import type { Profile } from './types';

export const profile: Profile = {
  name: 'Sam',
  goalId: 'tr.goal.fat_loss',
  goalsRanked: ['fat_loss', 'hypertrophy', 'strength'],
  level: 'beginner',
  daysPerWeek: 3,
  sessionMinutes: 60,
  units: 'kg',
  dumbbellConvention: 'per_hand',
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
    'calf_machine',
    'smith_machine',
  ],
  cantDo: ['pull_up'],
  region: 'england',
};

/** Onboarding screening answers (sf.screening). msk_issue = yes, knee. */
export const screeningAnswers = {
  currently_active: 'yes',
  known_disease: 'no',
  symptoms: 'no',
  msk_issue: 'yes',
  supervised_only: 'no',
} as const;
export const screeningArea = { area: 'knee', side: 'left' } as const;
/** The matrix key the answers match (checked against the data in tests). */
export const screeningMatrixKey = 'msk_issue=yes';
