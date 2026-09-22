import { createElement } from 'react';
import { bodyAreasSided, type BodyArea } from './generated/enums.ts';
import { muscleMapBack, muscleMapFront } from './generated/icons.ts';
import { Svg, type A11yProps } from './svg.tsx';

export type BodySide = 'left' | 'right';
export type BodyFlagState = 'active' | 'cleared';

export interface BodyFlag {
  area: BodyArea;
  /** The user's own left/right. Omit for unsided areas (neck, backs). */
  side?: BodySide | 'both';
  state: BodyFlagState;
}

export interface BodyMapProps extends A11yProps {
  view: 'front' | 'back';
  flags: readonly BodyFlag[];
  /** Rendered width in px; height keeps the 60:150 ratio. */
  width?: number;
}

type Marker =
  | { shape: 'circle'; cx: number; cy: number; r: number }
  | { shape: 'rect'; x: number; y: number; w: number; h: number }
  | { shape: 'ellipse'; cx: number; cy: number; rx: number; ry: number };

/** Viewer's-left x and viewer's-right x for sided areas, per view. On the front view the
 * user's right is on the viewer's left; on the back view it's on the viewer's right. */
const SIDED: Partial<
  Record<BodyArea, { views: ('front' | 'back')[]; at: (x: number) => Marker; x: [number, number] }>
> = {
  shoulder: {
    views: ['front', 'back'],
    x: [15, 45],
    at: (x) => ({ shape: 'circle', cx: x, cy: 34, r: 5.5 }),
  },
  elbow: {
    views: ['front', 'back'],
    x: [10, 50],
    at: (x) => ({ shape: 'circle', cx: x, cy: 61, r: 4 }),
  },
  wrist: {
    views: ['front', 'back'],
    x: [8, 52],
    at: (x) => ({ shape: 'circle', cx: x, cy: 83, r: 3.5 }),
  },
  hip: {
    views: ['front', 'back'],
    x: [23, 37],
    at: (x) => ({ shape: 'circle', cx: x, cy: 76, r: 4.5 }),
  },
  knee: { views: ['front'], x: [24, 36], at: (x) => ({ shape: 'circle', cx: x, cy: 115, r: 4.5 }) },
  calf: {
    views: ['back'],
    x: [24, 36],
    at: (x) => ({ shape: 'ellipse', cx: x, cy: 127, rx: 4.5, ry: 9 }),
  },
  ankle: {
    views: ['front', 'back'],
    x: [24, 36],
    at: (x) => ({ shape: 'circle', cx: x, cy: 144, r: 3.5 }),
  },
};

const CENTRAL: Partial<Record<BodyArea, { views: ('front' | 'back')[]; m: Marker }>> = {
  neck: { views: ['front', 'back'], m: { shape: 'rect', x: 26, y: 21, w: 8, h: 6 } },
  upper_back: { views: ['back'], m: { shape: 'rect', x: 21, y: 30, w: 18, h: 14 } },
  lower_back: { views: ['back'], m: { shape: 'rect', x: 24, y: 56, w: 12, h: 13 } },
};

/** Where an area is drawn on a view, per side. Empty if it isn't visible on that view. */
export function bodyMarkers(
  area: BodyArea,
  side: BodySide | 'both' | undefined,
  view: 'front' | 'back',
): Marker[] {
  const central = CENTRAL[area];
  if (central) return central.views.includes(view) ? [central.m] : [];
  const sided = SIDED[area];
  if (!sided || !sided.views.includes(view)) return [];
  const [viewerLeft, viewerRight] = sided.x;
  const rightX = view === 'front' ? viewerLeft : viewerRight;
  const leftX = view === 'front' ? viewerRight : viewerLeft;
  const sides = side === 'left' ? [leftX] : side === 'right' ? [rightX] : [leftX, rightX];
  return sides.map((x) => sided.at(x));
}

/** Areas with a left and a right (from vpt). */
export const sidedAreas: readonly BodyArea[] = bodyAreasSided;

const FILL: Record<BodyFlagState, string> = {
  active: 'var(--muscle-primary)',
  cleared: 'var(--muscle-secondary)',
};

/** Blocky figure with pain-flag areas marked: active in accent, cleared at 40%. */
export function BodyMap({ view, flags, width = 60, ...a11y }: BodyMapProps) {
  const silhouette = view === 'front' ? muscleMapFront : muscleMapBack;
  return (
    <Svg width={width} height={(width * 150) / 60} viewBox="0 0 60 150" {...a11y}>
      {silhouette.map((r, i) =>
        createElement(r.tag, { key: `s${i}`, ...r.attrs, fill: 'var(--muscle-idle)' }),
      )}
      {flags.flatMap((f, fi) =>
        bodyMarkers(f.area, f.side, view).map((m, mi) => {
          const common = {
            key: `f${fi}-${mi}`,
            fill: FILL[f.state],
            'data-area': f.area,
            'data-state': f.state,
            stroke: 'var(--bg)',
            strokeWidth: 1,
          };
          if (m.shape === 'circle') return <circle {...common} cx={m.cx} cy={m.cy} r={m.r} />;
          if (m.shape === 'ellipse')
            return <ellipse {...common} cx={m.cx} cy={m.cy} rx={m.rx} ry={m.ry} />;
          return <rect {...common} x={m.x} y={m.y} width={m.w} height={m.h} rx={2} />;
        }),
      )}
    </Svg>
  );
}
