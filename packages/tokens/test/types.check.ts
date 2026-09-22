// Type-level test, checked by `npm run typecheck` (not run by Vitest).
import { cssVar, tokens, type SafetyAction } from '../dist/index.js';

cssVar('surface-2');
cssVar('accent-tint');
cssVar('safety-stop-now-call-999');
// @ts-expect-error: not a token
cssVar('nope');

const action: SafetyAction = 'stop_and_see_gp';
// @ts-expect-error: not a safety_rules.json action
const bad: SafetyAction = 'call_mum';

const bg: '#0E0F14' = tokens.color.dark.bg;

export { action, bad, bg };
