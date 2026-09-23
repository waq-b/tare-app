// The full vpt/data files (tests, Storybook, scripts).
import exercises from '../../../vpt/data/exercises.json' with { type: 'json' };
import progression from '../../../vpt/data/progression_rules.json' with { type: 'json' };
import ruleIds from '../../../vpt/data/rule_ids.json' with { type: 'json' };
import safety from '../../../vpt/data/safety_rules.json' with { type: 'json' };
import sources from '../../../vpt/data/sources.json' with { type: 'json' };
import training from '../../../vpt/data/training_rules.json' with { type: 'json' };
import type { RawVpt } from './load.ts';

export const raw: RawVpt = { exercises, training, progression, safety, sources, ruleIds };
