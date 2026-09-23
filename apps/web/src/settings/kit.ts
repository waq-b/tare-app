// The user's kit, for rounding loads. Defaults per decision #88 (1.25 kg plates → 2.5 kg
// barbell steps). App settings, not rule data; P1 T2 makes them editable.
import type { KitKind, KitLoad } from '@tare/engine';

export const DEFAULT_KIT: Record<KitKind, KitLoad> = {
  barbell: { step: 2.5, lightest: 20 }, // an Olympic bar
  dumbbell: { step: 2, lightest: 2 }, // per hand
  stack: { step: 5, lightest: 5 },
};
