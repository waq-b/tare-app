// The user's kit, for rounding loads (P1 T2). Defaults per decision #88 (1.25 kg plates → 2.5 kg
// barbell steps). App settings, not rule data: the user changes them in Settings → Weight steps,
// and any exercise can have its own smallest jump.
import { kitKindOf, type KitKind, type KitLoad } from '@tare/engine';
import type { Profile } from '../db/index.ts';

export const DEFAULT_KIT: Record<KitKind, KitLoad> = {
  barbell: { step: 2.5, lightest: 20 }, // an Olympic bar
  dumbbell: { step: 2, lightest: 2 }, // per hand
  stack: { step: 5, lightest: 5 },
};

export const KIT_KINDS: { kind: KitKind; label: string; hint: string }[] = [
  {
    kind: 'barbell',
    label: 'Barbell',
    hint: 'Two of your smallest plates (one a side); lightest is the empty bar',
  },
  { kind: 'dumbbell', label: 'Dumbbells', hint: 'Per hand: the gap between rack weights' },
  { kind: 'stack', label: 'Machines and cables', hint: 'One pin on the stack' },
];

type KitProfile = Pick<Profile, 'kitLoads' | 'stepOverrides'> | null | undefined;

export function kitLoadOf(profile: KitProfile, kind: KitKind): KitLoad {
  const k = profile?.kitLoads?.[kind];
  return k ? { step: k.step, lightest: k.lightest } : DEFAULT_KIT[kind];
}

/** The kit an exercise rounds to, with its own smallest jump if the user set one. */
export function kitFor(profile: KitProfile, exerciseId: string): KitLoad {
  const kit = kitLoadOf(profile, kitKindOf(exerciseId));
  const own = profile?.stepOverrides?.[exerciseId];
  return own ? { ...kit, step: own } : kit;
}
