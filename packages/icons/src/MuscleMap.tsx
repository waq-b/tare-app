import { createElement } from 'react';
import type { Muscle } from './generated/enums.ts';
import { muscleMapBack, muscleMapFront } from './generated/icons.ts';
import { Svg, type A11yProps } from './svg.tsx';

export type MuscleMapView = 'front' | 'back';

export interface MuscleMapProps extends A11yProps {
  view: MuscleMapView;
  /** Counted as 1 set per set. Drawn in accent. */
  primary?: readonly Muscle[];
  /** Counted as 0.5 sets per set. Drawn in accent at 40%. */
  secondary?: readonly Muscle[];
  /** Rendered width in px; height keeps the 60:150 body ratio. */
  width?: number;
}

const regions = { front: muscleMapFront, back: muscleMapBack };

/** Muscles the drawing has a region for. Others are listed in DESIGN.md → Design gaps. */
export const drawnMuscles = [
  ...new Set([...muscleMapFront, ...muscleMapBack].flatMap((r) => (r.muscle ? [r.muscle] : []))),
] as Muscle[];

export type MuscleState = 'primary' | 'secondary' | 'idle';

const fill: Record<MuscleState, string> = {
  primary: 'var(--muscle-primary)',
  secondary: 'var(--muscle-secondary)',
  idle: 'var(--muscle-idle)',
};

/** Blocky front/back body. Primary wins if a muscle is in both lists. */
export function MuscleMap({
  view,
  primary = [],
  secondary = [],
  width = 60,
  ...a11y
}: MuscleMapProps) {
  const state = (m: string | null): MuscleState =>
    m && (primary as readonly string[]).includes(m)
      ? 'primary'
      : m && (secondary as readonly string[]).includes(m)
        ? 'secondary'
        : 'idle';
  return (
    <Svg width={width} height={(width * 150) / 60} viewBox="0 0 60 150" {...a11y}>
      {regions[view].map((r, i) => {
        const s = state(r.muscle);
        return createElement(r.tag, {
          key: i,
          ...r.attrs,
          fill: fill[s],
          'data-muscle': r.muscle ?? undefined,
          'data-state': s,
        });
      })}
    </Svg>
  );
}
