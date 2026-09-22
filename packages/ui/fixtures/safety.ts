// Pain flags. Rule IDs are real safety_rules.json rules; their messages come from the data.
import type { PainFlag } from './types';

export const painFlags: readonly PainFlag[] = [
  {
    id: 'pf2',
    date: '2026-09-17',
    area: 'shoulder',
    side: 'right',
    ruleId: 'pain_during_exercise',
    exerciseId: 'Standing_Military_Press',
    status: 'active',
  },
  {
    id: 'pf1',
    date: '2026-08-27',
    area: 'ankle',
    side: 'left',
    ruleId: 'suspected_sprain_strain',
    status: 'cleared',
    clearedOn: '2026-09-02',
  },
];
