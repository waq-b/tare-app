import type { MovementPattern } from './generated/enums.ts';
import { patternIcons, uiIcons } from './generated/icons.ts';
import { renderNodes, Svg, type A11yProps } from './svg.tsx';
import type { IconNode } from './types.ts';

/** vpt movement_pattern → canvas drawing. The canvas draws 10 of 14 patterns; the rest
 * reuse an existing UI icon until design adds them (see DESIGN.md → Design gaps). */
export const patternGlyph = {
  squat: patternIcons.squat,
  hinge: patternIcons.hinge,
  lunge: patternIcons.lunge,
  push_h: patternIcons['push-h'],
  push_v: patternIcons['push-v'],
  pull_h: patternIcons['pull-h'],
  pull_v: patternIcons['pull-v'],
  carry: patternIcons.carry,
  core: patternIcons.core,
  isolation: patternIcons.iso,
  cardio: uiIcons.bike,
  plyometric: uiIcons.dumbbell,
  olympic: uiIcons.dumbbell,
  mobility: uiIcons.dumbbell,
} as const satisfies Record<MovementPattern, readonly IconNode[]>;

/** Patterns with no drawing of their own on the canvas. */
export const patternsWithoutGlyph = [
  'cardio',
  'plyometric',
  'olympic',
  'mobility',
] as const satisfies readonly MovementPattern[];

export interface PatternIconProps extends A11yProps {
  pattern: MovementPattern;
  size?: number;
  /** In grid units. Pattern drawings on the canvas use 1.6. */
  strokeWidth?: number;
}

/** A movement pattern as a direction of force (no exercise photos). */
export function PatternIcon({ pattern, size = 24, strokeWidth = 1.6, ...a11y }: PatternIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...a11y}
    >
      {renderNodes(patternGlyph[pattern])}
    </Svg>
  );
}
